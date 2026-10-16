import { createHash } from 'node:crypto';
import type { WhatsAppMessage } from '../adapter/renderers/whatsapp';
import type { SendParams, TwilioClient } from './client';

/**
 * Última milha do canal WhatsApp: cada WhatsAppMessage vira uma chamada ao Twilio.
 * Quick reply e lista precisam de um Content Template; como o conteúdo é dinâmico,
 * criamos o template na hora e reaproveitamos pelo hash do conteúdo.
 * Em sessão iniciada pelo usuário (24h) esses tipos não precisam de aprovação do WhatsApp.
 */
export function createWhatsAppSender(opts: { client: TwilioClient; from: string }) {
  const { client, from } = opts;
  const contentCache = new Map<string, Promise<string>>();

  function contentSid(types: Record<string, unknown>): Promise<string> {
    const hash = createHash('sha1').update(JSON.stringify(types)).digest('hex').slice(0, 16);
    let sid = contentCache.get(hash);
    if (!sid) {
      sid = client.createContent(`rosetta_${hash}`, types);
      sid.catch(() => contentCache.delete(hash));
      contentCache.set(hash, sid);
    }
    return sid;
  }

  async function toParams(to: string, m: WhatsAppMessage): Promise<SendParams> {
    switch (m.kind) {
      case 'text':
        return { to, from, body: m.body };
      case 'media':
        return { to, from, body: m.body, mediaUrl: m.mediaUrl };
      case 'quick_reply':
        return {
          to,
          from,
          contentSid: await contentSid({
            'twilio/quick-reply': { body: m.body, actions: m.buttons.map((b) => ({ id: b.id, title: b.title })) },
          }),
        };
      case 'list':
        return {
          to,
          from,
          contentSid: await contentSid({
            'twilio/list-picker': {
              body: m.body,
              button: m.button,
              items: m.items.map((i) => ({ id: i.id, item: i.title, description: i.description })),
            },
          }),
        };
    }
  }

  return {
    /** Envia em sequência para preservar a ordem das mensagens no WhatsApp. */
    async send(to: string, messages: WhatsAppMessage[]): Promise<string[]> {
      const sids: string[] = [];
      for (const m of messages) sids.push(await client.sendMessage(await toParams(to, m)));
      return sids;
    },
  };
}

export type WhatsAppSender = ReturnType<typeof createWhatsAppSender>;
