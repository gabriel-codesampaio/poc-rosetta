import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import type { SendParams, TwilioClient } from '../src/twilio/client';
import { createWhatsAppSender } from '../src/twilio/sender';
import { isValidTwilioSignature } from '../src/twilio/signature';
import { createInboundHandler } from '../src/twilio/webhook';

function fakeClient() {
  const contents: { name: string; types: Record<string, unknown> }[] = [];
  const sent: SendParams[] = [];
  const client: TwilioClient = {
    async createContent(name, types) {
      contents.push({ name, types });
      return `HX${contents.length}`;
    },
    async sendMessage(p) {
      sent.push(p);
      return `SM${sent.length}`;
    },
  };
  return { client, contents, sent };
}

const FROM = 'whatsapp:+14155238886';
const USER = 'whatsapp:+5511999990000';

describe('sender do WhatsApp', () => {
  it('mapeia texto, mídia, quick reply e lista para a API do Twilio, reaproveitando templates', async () => {
    const { client, contents, sent } = fakeClient();
    const sender = createWhatsAppSender({ client, from: FROM });
    const qr = { kind: 'quick_reply' as const, body: 'Escolha', buttons: [{ id: 'balance', title: 'Ver saldo' }] };

    await sender.send(USER, [
      { kind: 'text', body: 'oi' },
      { kind: 'media', mediaUrl: 'https://x.com/a.jpg', body: 'legenda' },
      qr,
      { kind: 'list', body: 'Destinos', button: 'Ver opções', items: [{ id: 'd1', title: 'Rio' }] },
      qr,
    ]);

    expect(sent).toEqual([
      { to: USER, from: FROM, body: 'oi' },
      { to: USER, from: FROM, body: 'legenda', mediaUrl: 'https://x.com/a.jpg' },
      { to: USER, from: FROM, contentSid: 'HX1' },
      { to: USER, from: FROM, contentSid: 'HX2' },
      { to: USER, from: FROM, contentSid: 'HX1' },
    ]);
    expect(contents).toHaveLength(2);
    expect(contents[0]!.types).toEqual({
      'twilio/quick-reply': { body: 'Escolha', actions: [{ id: 'balance', title: 'Ver saldo' }] },
    });
    expect(contents[1]!.types).toMatchObject({ 'twilio/list-picker': { items: [{ id: 'd1', item: 'Rio' }] } });
  });
});

describe('webhook do Twilio', () => {
  it('roda o roteiro com ButtonPayload, ListId e texto, usando o número como sessão', async () => {
    const { chat, debug } = createApp();
    const { client, sent } = fakeClient();
    const handle = createInboundHandler(chat, { sender: createWhatsAppSender({ client, from: FROM }) });

    await handle({ From: USER, Body: 'Oi' });
    await handle({ From: USER, Body: 'Ver saldo', ButtonPayload: 'balance' });
    await handle({ From: USER, Body: 'ofertas' });
    await handle({ From: USER, Body: 'Fone Bluetooth', ButtonPayload: 'offer_fone' });
    await handle({ From: USER, Body: '1' });
    await handle({ From: USER, Body: 'Ver ofertas', ListId: 'offers' });

    const events = [...debug.list()].reverse().map((t) => (t.event.type === 'action' ? t.event.actionId : t.event.text));
    // "ofertas" é texto livre: a IA interpreta a intenção; "1" vira a 1ª opção mostrada (Confirmar).
    expect(events).toEqual(['Oi', 'balance', 'ofertas', 'offer_fone', 'confirm_offer_fone', 'offers']);
    expect(debug.list().every((t) => t.sessionId === USER && t.channel === 'whatsapp')).toBe(true);
    expect(sent.length).toBeGreaterThan(5);
    expect(sent.every((s) => s.to === USER)).toBe(true);
  });

  it('ignora mensagens sem texto nem botão', async () => {
    const { chat } = createApp();
    expect(await createInboundHandler(chat, {})({ From: USER, Body: '' })).toBeUndefined();
  });
});

describe('assinatura do Twilio', () => {
  it('aceita a assinatura correta e recusa a adulterada', () => {
    const url = 'https://abc.ngrok-free.app/twilio/webhook';
    const params = { From: USER, Body: 'Oi' };
    const sig = createHmac('sha1', 'token').update(`${url}BodyOiFrom${USER}`).digest('base64');
    expect(isValidTwilioSignature('token', url, params, sig)).toBe(true);
    expect(isValidTwilioSignature('token', url, { ...params, Body: 'Oi!' }, sig)).toBe(false);
    expect(isValidTwilioSignature('token', url, params, undefined)).toBe(false);
  });
});
