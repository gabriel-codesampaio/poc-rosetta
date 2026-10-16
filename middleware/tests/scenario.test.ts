import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import type { Channel, ChatRequest } from '../src/contract';
import { normalize } from '../src/events/normalize';

/** Roteiro de validação do POC.md, executado nos três canais. */
describe('roteiro de validação', () => {
  const steps = (channel: Channel): Omit<ChatRequest, 'sessionId' | 'channel'>[] =>
    channel === 'whatsapp'
      ? // No WhatsApp o usuário responde digitando: número ou rótulo.
        [{ text: 'Oi' }, { text: '1' }, { text: 'ver ofertas' }, { text: '1' }, { text: '1' }]
      : [
          { text: 'Oi' },
          { action: { id: 'balance' } },
          { action: { id: 'offers' } },
          { action: { id: 'offer_rio' } },
          { action: { id: 'confirm_offer_rio' } },
        ];

  for (const channel of ['web', 'mobile', 'whatsapp'] as const) {
    it(`completa saldo → ofertas → confirmação → sucesso no canal ${channel}`, async () => {
      const { chat, debug } = createApp();
      for (const step of steps(channel)) {
        await chat.handle({ sessionId: `s-${channel}`, channel, ...step });
      }
      const turns = [...debug.list()].reverse();
      expect(turns.map((t) => (t.event.type === 'action' ? t.event.actionId : t.event.text))).toEqual([
        'Oi',
        'balance',
        'offers',
        'offer_rio',
        'confirm_offer_rio',
      ]);
      const last = JSON.stringify(turns.at(-1)!.preview[channel].payload);
      expect(last).toContain('Pronto!');
      expect(last).toContain('3.900 pontos');
    });
  }

  it('registra a mesma resposta da IA adaptada para os três canais', async () => {
    const { chat, debug } = createApp();
    await chat.handle({ sessionId: 's', channel: 'web', action: { id: 'offers' } });
    const [turn] = debug.list();
    expect(turn!.preview.web.payload.some((c) => 'type' in c && c.type === 'carousel')).toBe(true);
    expect(turn!.preview.whatsapp.payload.map((m) => ('kind' in m ? m.kind : ''))).toEqual([
      'text', 'media', 'media', 'media', 'quick_reply',
    ]);
  });
});

describe('normalize', () => {
  const options = [
    { id: 'balance', label: 'Ver saldo' },
    { id: 'offers', label: 'Ver ofertas' },
  ];
  const base = { sessionId: 's', channel: 'whatsapp' as const };

  it('traduz número, rótulo e clique para o mesmo evento', () => {
    expect(normalize({ ...base, text: '2' }, options)).toEqual({ type: 'action', actionId: 'offers', via: 'number' });
    expect(normalize({ ...base, text: 'ver OFERTAS' }, options)).toEqual({ type: 'action', actionId: 'offers', via: 'label' });
    expect(normalize({ ...base, action: { id: 'offers' } }, options)).toEqual({ type: 'action', actionId: 'offers', via: 'button' });
  });

  it('mantém como texto o que não corresponde a uma opção', () => {
    expect(normalize({ ...base, text: '7' }, options)).toEqual({ type: 'text', text: '7' });
    expect(normalize({ ...base, text: 'quero pontos' }, options)).toEqual({ type: 'text', text: 'quero pontos' });
  });
});
