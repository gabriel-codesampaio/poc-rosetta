import type { Action, ButtonsComponent, Card, Component, ComponentType } from '../contract';
import type { ChannelCapabilities } from './capabilities';
import { cardCaption, chunk, splitText, truncate } from './format';
import type { Note, Placed } from './types';

/**
 * Etapa genérica do filtro: reescreve a resposta da IA usando apenas primitivos que o canal
 * suporta, respeitando seus limites. Nunca descarta conteúdo — só muda o formato.
 *
 * Cadeias de fallback:
 *   carousel → cards em sequência + 1 grupo de botões
 *   card     → imagem com legenda (ou texto) + botões
 *   buttons  → grupos menores, quando excede o limite
 *   text     → várias mensagens, quando excede o limite
 */
export function degrade(messages: Component[], caps: ChannelCapabilities, note: Note): Placed[] {
  return messages.flatMap((component, source) => {
    const say = (from: ComponentType, rule: string, detail: string) => note(source, from, rule, detail);
    return expand(component, caps, say).map((c) => ({ component: c, source }));
  });
}

type Say = (from: ComponentType, rule: string, detail: string) => void;

function expand(c: Component, caps: ChannelCapabilities, say: Say): Component[] {
  switch (c.type) {
    case 'text': {
      if (c.content.length <= caps.maxTextLength) return [c];
      const parts = splitText(c.content, caps.maxTextLength);
      say('text', 'split-text', `texto de ${c.content.length} caracteres virou ${parts.length} mensagens`);
      return parts.map((content) => ({ type: 'text', content }));
    }

    case 'image':
      return [c];

    case 'buttons':
      return limitButtons(c, caps, say);

    case 'card': {
      const { type: _type, ...card } = c;
      if (!caps.supports.card) return cardToPrimitives(card, caps, say);
      const actions = card.actions ? truncateLabels(card.actions, caps.maxButtonLabel, 'card', say) : undefined;
      if (!actions || actions.length <= caps.maxButtons) return [{ ...c, actions }];
      say('card', 'card-overflow-buttons', `${actions.length - caps.maxButtons} ações excedentes do card viraram botões abaixo dele`);
      return [
        { ...c, actions: actions.slice(0, caps.maxButtons) },
        ...limitButtons({ type: 'buttons', actions: actions.slice(caps.maxButtons) }, caps, say),
      ];
    }

    case 'carousel': {
      if (!caps.supports.carousel) return carouselToSequence(c.cards, caps, say);
      const cards = c.cards.map((card) => ({
        ...card,
        actions: card.actions ? truncateLabels(card.actions, caps.maxButtonLabel, 'carousel', say) : undefined,
      }));
      if (cards.length <= caps.maxCarouselCards) return [{ type: 'carousel', cards }];
      const groups = chunk(cards, caps.maxCarouselCards);
      say('carousel', 'split-carousel', `carrossel com ${cards.length} cards virou ${groups.length} carrosséis`);
      return groups.map((g) => ({ type: 'carousel', cards: g }));
    }
  }
}

function limitButtons(c: ButtonsComponent, caps: ChannelCapabilities, say: Say): Component[] {
  const actions = truncateLabels(c.actions, caps.maxButtonLabel, 'buttons', say);
  if (actions.length <= caps.maxButtons) return [{ ...c, actions }];
  const groups = chunk(actions, caps.maxButtons);
  say('buttons', 'split-buttons', `${actions.length} botões viraram ${groups.length} grupos de até ${caps.maxButtons}`);
  return groups.map((g, i) => ({ type: 'buttons', text: i === 0 ? c.text : undefined, actions: g }));
}

function truncateLabels(actions: Action[], max: number, from: ComponentType, say: Say): Action[] {
  return actions.map((a) => {
    if (a.label.length <= max) return a;
    const label = truncate(a.label, max);
    say(from, 'truncate-label', `"${a.label}" → "${label}"`);
    return { ...a, label };
  });
}

function cardToPrimitives(card: Card, caps: ChannelCapabilities, say: Say): Component[] {
  const caption = cardCaption(card);
  const head: Component = card.image
    ? { type: 'image', url: card.image, caption }
    : { type: 'text', content: caption };
  const hasActions = Boolean(card.actions?.length);
  say(
    'card',
    'card-to-primitives',
    `card "${card.title}" virou ${card.image ? 'imagem com legenda' : 'texto'}${hasActions ? ' + botões' : ''}`,
  );
  const tail = hasActions ? limitButtons({ type: 'buttons', actions: card.actions! }, caps, say) : [];
  return [...expand(head, caps, say), ...tail];
}

function carouselToSequence(cards: Card[], caps: ChannelCapabilities, say: Say): Component[] {
  say('carousel', 'carousel-to-sequence', `carrossel com ${cards.length} cards virou cards em sequência + 1 grupo de botões`);

  const sequence = cards.flatMap(({ actions: _actions, ...card }) =>
    expand({ type: 'card', ...card }, caps, say),
  );

  // As ações de todos os cards viram uma única escolha, rotulada pelo título de cada card.
  const actions = cards.flatMap((card) =>
    (card.actions ?? []).map((a) => ({
      id: a.id,
      label: card.actions!.length === 1 ? card.title : `${card.title}: ${a.label}`,
    })),
  );
  if (!actions.length) return sequence;
  return [...sequence, ...limitButtons({ type: 'buttons', text: 'Qual você escolhe?', actions }, caps, say)];
}
