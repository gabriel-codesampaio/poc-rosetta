import type { Action } from '../../contract';
import { toWhatsAppMarkdown, truncate } from '../format';
import type { Note, Placed } from '../types';

/**
 * Formato de saída do WhatsApp, ainda independente do Twilio.
 * Na fase 4, o sender do Twilio mapeia cada `kind` para a API (texto, mídia, Content Templates).
 */
export type WhatsAppMessage =
  | { kind: 'text'; body: string }
  | { kind: 'media'; mediaUrl: string; body?: string }
  | { kind: 'quick_reply'; body: string; buttons: { id: string; title: string }[] }
  | {
      kind: 'list';
      body: string;
      button: string;
      items: { id: string; title: string; description?: string }[];
    };

/** Limites das mensagens interativas do WhatsApp Business. */
export const WHATSAPP_LIMITS = {
  quickReplyButtons: 3,
  quickReplyTitle: 20,
  listItems: 10,
  listTitle: 24,
  listDescription: 72,
} as const;

const DEFAULT_PROMPT = 'Escolha uma opção:';

/**
 * Recebe primitivos já degradados (só text, image e buttons) e gera as mensagens do WhatsApp.
 * Botões descem a cadeia: quick reply (≤3) → lista (≤10) → texto numerado.
 * Cada ação entregue é registrada em `options`, na ordem vista pelo usuário.
 */
export function renderWhatsApp(placed: Placed[], options: Action[], note: Note): WhatsAppMessage[] {
  return placed.map(({ component: c, source }): WhatsAppMessage => {
    switch (c.type) {
      case 'text':
        return { kind: 'text', body: toWhatsAppMarkdown(c.content) };

      case 'image':
        return {
          kind: 'media',
          mediaUrl: c.url,
          body: c.caption ? toWhatsAppMarkdown(c.caption) : undefined,
        };

      case 'buttons': {
        const firstNumber = options.length + 1;
        options.push(...c.actions);
        const body = toWhatsAppMarkdown(c.text ?? DEFAULT_PROMPT);
        const n = c.actions.length;

        if (n <= WHATSAPP_LIMITS.quickReplyButtons) {
          note(source, 'buttons', 'whatsapp-quick-reply', `${n} botões viraram quick reply`);
          return {
            kind: 'quick_reply',
            body,
            buttons: c.actions.map((a) => ({
              id: a.id,
              title: fit(a.label, WHATSAPP_LIMITS.quickReplyTitle, source, note),
            })),
          };
        }

        if (n <= WHATSAPP_LIMITS.listItems) {
          note(source, 'buttons', 'whatsapp-list', `${n} botões passam do limite de 3 do quick reply e viraram lista`);
          return {
            kind: 'list',
            body,
            button: 'Ver opções',
            items: c.actions.map((a) => {
              const title = fit(a.label, WHATSAPP_LIMITS.listTitle, source, note);
              return {
                id: a.id,
                title,
                // O rótulo completo vai para a descrição quando o título precisou ser cortado.
                description: title === a.label ? undefined : truncate(a.label, WHATSAPP_LIMITS.listDescription),
              };
            }),
          };
        }

        note(source, 'buttons', 'whatsapp-numbered-text', `${n} botões passam do limite de 10 da lista e viraram texto numerado`);
        const lines = c.actions.map((a, i) => `${firstNumber + i}. ${a.label}`);
        return { kind: 'text', body: `${body}\n\n${lines.join('\n')}\n\n_Responda com o número da opção._` };
      }

      case 'card':
      case 'carousel':
        throw new Error(`"${c.type}" deveria ter sido degradado antes de chegar ao renderer do WhatsApp`);
    }
  });
}

function fit(label: string, max: number, source: number, note: Note): string {
  const out = truncate(label, max);
  if (out !== label) note(source, 'buttons', 'truncate-label', `"${label}" → "${out}" (limite de ${max} do WhatsApp)`);
  return out;
}
