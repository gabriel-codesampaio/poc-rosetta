import type { Card } from '../contract';

export const formatPoints = (points: number) => `${points.toLocaleString('pt-BR')} pontos`;

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

export function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/** Quebra um texto em pedaços de até `max` caracteres, preferindo quebras de parágrafo e de palavra. */
export function splitText(text: string, max: number): string[] {
  const parts: string[] = [];
  let rest = text.trim();
  while (rest.length > max) {
    const window = rest.slice(0, max);
    const cut = Math.max(window.lastIndexOf('\n'), window.lastIndexOf(' '));
    const at = cut > max / 2 ? cut : max;
    parts.push(rest.slice(0, at).trimEnd());
    rest = rest.slice(at).trimStart();
  }
  if (rest) parts.push(rest);
  return parts;
}

/** Legenda em markdown leve usada quando um card precisa virar imagem ou texto. */
export function cardCaption(card: Card): string {
  return [`**${card.title}**`, card.subtitle, card.points != null ? formatPoints(card.points) : undefined]
    .filter(Boolean)
    .join('\n');
}

/** Converte o markdown leve do contrato para a formatação do WhatsApp. */
export function toWhatsAppMarkdown(md: string): string {
  const BOLD = '\u0000';
  return md
    .replace(/^#{1,6}\s+(.+)$/gm, `${BOLD}$1${BOLD}`)
    .replace(/\*\*(.+?)\*\*/g, `${BOLD}$1${BOLD}`)
    .replace(/(^|[^*])\*(?!\s)(.+?)\*(?!\*)/g, '$1_$2_')
    .replace(/~~(.+?)~~/g, '~$1~')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)')
    .replace(/^\s*[-*]\s+/gm, '• ')
    .replaceAll(BOLD, '*');
}
