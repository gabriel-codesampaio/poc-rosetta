import type { Action, ChatRequest } from '../contract';

/** Evento que a IA de negócio recebe, igual para qualquer canal. */
export type NormalizedEvent =
  | { type: 'text'; text: string }
  | { type: 'action'; actionId: string; via: 'button' | 'number' | 'label' };

const simplify = (s: string) =>
  s.normalize('NFD').replace(/\p{Diacritic}/gu, '').trim().toLowerCase();

/**
 * Traduz a entrada de qualquer canal para um evento normalizado.
 * `options` são as ações mostradas no turno anterior: é o que transforma
 * um "2" ou um "ver saldo" digitado no WhatsApp no mesmo actionId de um clique.
 */
export function normalize(req: ChatRequest, options: Action[]): NormalizedEvent {
  if (req.action) return { type: 'action', actionId: req.action.id, via: 'button' };

  const text = (req.text ?? '').trim();

  if (/^\d{1,2}$/.test(text)) {
    const option = options[Number(text) - 1];
    if (option) return { type: 'action', actionId: option.id, via: 'number' };
  }

  const byLabel = options.find((o) => simplify(o.label) === simplify(text));
  if (byLabel) return { type: 'action', actionId: byLabel.id, via: 'label' };

  return { type: 'text', text };
}
