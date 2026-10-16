import { describe, expect, it } from 'vitest';
import { toWhatsAppMarkdown } from '../src/adapter/format';
import { createRulesAdapter } from '../src/adapter/rulesAdapter';
import type { Component } from '../src/contract';

const adapter = createRulesAdapter();
const img = 'https://example.com/a.jpg';
const actions = (n: number, label = (i: number) => `Opção ${i}`) =>
  Array.from({ length: n }, (_, i) => ({ id: `a${i + 1}`, label: label(i + 1) }));

const carousel: Component = {
  type: 'carousel',
  cards: [
    { title: 'Rio', image: img, points: 8500, actions: [{ id: 'offer_rio', label: 'Quero essa' }] },
    { title: 'Fone', image: img, points: 6200, actions: [{ id: 'offer_fone', label: 'Quero essa' }] },
  ],
};

describe('web e mobile', () => {
  it('entregam primitivos suportados sem adaptação', async () => {
    const r = await adapter.adapt([{ type: 'text', content: 'oi' }, carousel], 'web');
    expect(r.payload).toEqual([{ type: 'text', content: 'oi' }, carousel]);
    expect(r.decisions).toEqual([]);
    expect(r.options.map((o) => o.id)).toEqual(['offer_rio', 'offer_fone']);
  });

  it('dividem botões acima do limite do canal em grupos', async () => {
    const r = await adapter.adapt([{ type: 'buttons', text: 'Escolha', actions: actions(6) }], 'mobile');
    expect(r.payload).toHaveLength(2);
    expect(r.payload.map((c) => (c.type === 'buttons' ? c.actions.length : 0))).toEqual([4, 2]);
    expect(r.decisions.map((d) => d.rule)).toContain('split-buttons');
  });

  it('truncam rótulos longos', async () => {
    const r = await adapter.adapt([{ type: 'buttons', actions: actions(1, () => 'x'.repeat(50)) }], 'mobile');
    const c = r.payload[0]!;
    expect(c.type === 'buttons' && c.actions[0]!.label).toHaveLength(28);
    expect(r.decisions[0]!.rule).toBe('truncate-label');
  });
});

describe('whatsapp', () => {
  it('converte carrossel em mídias em sequência + quick reply rotulado pelo título', async () => {
    const r = await adapter.adapt([carousel], 'whatsapp');
    expect(r.payload.map((m) => m.kind)).toEqual(['media', 'media', 'quick_reply']);
    const qr = r.payload[2]!;
    expect(qr.kind === 'quick_reply' && qr.buttons).toEqual([
      { id: 'offer_rio', title: 'Rio' },
      { id: 'offer_fone', title: 'Fone' },
    ]);
    expect(r.decisions.map((d) => d.rule)).toEqual(
      expect.arrayContaining(['carousel-to-sequence', 'card-to-primitives', 'whatsapp-quick-reply']),
    );
  });

  it('converte card em mídia com legenda + botões', async () => {
    const r = await adapter.adapt(
      [{ type: 'card', title: 'Rio', subtitle: 'Confirme', image: img, points: 8500, actions: actions(2) }],
      'whatsapp',
    );
    expect(r.payload[0]).toEqual({ kind: 'media', mediaUrl: img, body: '*Rio*\nConfirme\n8.500 pontos' });
    expect(r.payload[1]!.kind).toBe('quick_reply');
  });

  it('desce a cadeia de botões: ≤3 quick reply, ≤10 lista, >10 texto numerado', async () => {
    const kind = async (n: number) => (await adapter.adapt([{ type: 'buttons', actions: actions(n) }], 'whatsapp')).payload[0]!.kind;
    expect(await kind(3)).toBe('quick_reply');
    expect(await kind(4)).toBe('list');
    expect(await kind(10)).toBe('list');
    expect(await kind(11)).toBe('text');
  });

  it('numera o texto de forma contínua com as opções do turno', async () => {
    const r = await adapter.adapt(
      [{ type: 'buttons', actions: actions(2) }, { type: 'buttons', actions: actions(11) }],
      'whatsapp',
    );
    const text = r.payload[1]!;
    expect(text.kind === 'text' && text.body).toContain('3. Opção 1');
    expect(r.options).toHaveLength(13);
  });

  it('corta rótulos no limite do quick reply e preserva o completo na lista', async () => {
    const long = 'Quero ver todas as ofertas internacionais';
    const qr = (await adapter.adapt([{ type: 'buttons', actions: actions(1, () => long) }], 'whatsapp')).payload[0]!;
    const title = qr.kind === 'quick_reply' ? qr.buttons[0]!.title : '';
    expect(title.length).toBeLessThanOrEqual(20);
    expect(title.endsWith('…')).toBe(true);

    const list = (await adapter.adapt([{ type: 'buttons', actions: actions(4, () => long) }], 'whatsapp')).payload[0]!;
    expect(list.kind === 'list' && list.items[0]).toMatchObject({ description: long });
  });

  it('quebra textos maiores que 1600 caracteres', async () => {
    const r = await adapter.adapt([{ type: 'text', content: 'palavra '.repeat(400) }], 'whatsapp');
    expect(r.payload.length).toBeGreaterThan(1);
    expect(r.payload.every((m) => m.kind === 'text' && m.body.length <= 1600)).toBe(true);
  });
});

describe('toWhatsAppMarkdown', () => {
  it('converte negrito, itálico, títulos, links e listas', () => {
    expect(toWhatsAppMarkdown('**a** e *b*')).toBe('*a* e _b_');
    expect(toWhatsAppMarkdown('# Título')).toBe('*Título*');
    expect(toWhatsAppMarkdown('[site](https://x.com)')).toBe('site (https://x.com)');
    expect(toWhatsAppMarkdown('- um\n- dois')).toBe('• um\n• dois');
  });
});
