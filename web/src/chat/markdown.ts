/**
 * Markdown leve do contrato → trechos neutros de plataforma.
 * Cada front (web, mobile) desenha os trechos com seus próprios elementos,
 * sem nunca injetar HTML.
 */
export interface Span {
  text: string;
  bold?: boolean;
  italic?: boolean;
  href?: string;
}

const INLINE = /\*\*(.+?)\*\*|\*(.+?)\*|\[([^\]]+)\]\(([^)]+)\)/g;

export function parseLine(line: string): Span[] {
  const heading = /^#{1,6}\s+(.*)$/.exec(line);
  if (heading) return [{ text: heading[1] ?? '', bold: true }];

  const bullet = /^\s*[-*]\s+(.*)$/.exec(line);
  const source = bullet ? `• ${bullet[1]}` : line;

  const spans: Span[] = [];
  let last = 0;
  for (const m of source.matchAll(INLINE)) {
    if (m.index > last) spans.push({ text: source.slice(last, m.index) });
    if (m[1] != null) spans.push({ text: m[1], bold: true });
    else if (m[2] != null) spans.push({ text: m[2], italic: true });
    else spans.push({ text: m[3] ?? '', href: m[4] });
    last = m.index + m[0].length;
  }
  if (last < source.length) spans.push({ text: source.slice(last) });
  return spans;
}

export const parseMarkdown = (md: string): Span[][] => md.split('\n').map(parseLine);

export const formatPoints = (points: number) => `${points.toLocaleString('pt-BR')} pontos`;
