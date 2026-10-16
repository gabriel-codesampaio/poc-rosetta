import type { Action, AiResponse, Component } from '../contract';
import type { NormalizedEvent } from '../events/normalize';
import { BALANCE, BANNER, EXTRA_OFFERS, OFFERS, type Offer } from './catalog';
import type { BusinessAi } from './types';

/**
 * IA de negócio simulada. Respostas fixas por intenção, para que qualquer diferença
 * entre canais venha só do filtro.
 */
export function createMockAi(): BusinessAi {
  return {
    name: 'mock',
    async respond(event: NormalizedEvent): Promise<AiResponse> {
      return { messages: route(event) };
    },
  };
}

const pts = (n: number) => `${n.toLocaleString('pt-BR')} pontos`;

const MENU: Action[] = [
  { id: 'balance', label: 'Ver saldo' },
  { id: 'offers', label: 'Ver ofertas' },
];
const HOME: Action = { id: 'home', label: 'Início' };

const simplify = (s: string) =>
  s.normalize('NFD').replace(/\p{Diacritic}/gu, '').trim().toLowerCase();

function intentFromText(text: string): string {
  const t = simplify(text);
  if (/\bsaldo\b|\bpontos\b/.test(t)) return 'balance';
  if (/\boferta|\bresgat|\bpassage|\bproduto/.test(t)) return 'offers';
  if (/\blimite/.test(t)) return 'limits';
  if (/^(oi|ola|menu|inicio|comecar|bom dia|boa tarde|boa noite|hello|hi)\b/.test(t)) return 'home';
  return 'unknown';
}

function route(event: NormalizedEvent): Component[] {
  const intent = event.type === 'action' ? event.actionId : intentFromText(event.text);
  const all = [...OFFERS, ...EXTRA_OFFERS];

  switch (intent) {
    case 'home':
      return greeting();
    case 'balance':
      return balance();
    case 'offers':
      return offers();
    case 'cancel':
      return [
        { type: 'text', content: 'Tudo bem, resgate cancelado.' },
        { type: 'buttons', text: 'Posso ajudar com mais alguma coisa?', actions: MENU },
      ];
    case 'limits':
      return limits();
  }

  const chosen = all.find((o) => o.id === intent);
  if (chosen) return confirm(chosen);

  const confirmed = all.find((o) => `confirm_${o.id}` === intent);
  if (confirmed) return success(confirmed);

  return [
    { type: 'text', content: 'Não entendi. Posso te ajudar com seu saldo ou com as ofertas disponíveis.' },
    { type: 'buttons', actions: MENU },
  ];
}

function greeting(): Component[] {
  return [
    {
      type: 'text',
      content: 'Olá! Sou seu assistente de pontos. Posso mostrar seu **saldo** ou as **ofertas** disponíveis para resgate.',
    },
    { type: 'buttons', text: 'O que você quer fazer?', actions: MENU },
  ];
}

function balance(): Component[] {
  return [
    { type: 'text', content: `Você tem **${pts(BALANCE)}** disponíveis.` },
    { type: 'image', url: BANNER, caption: 'Seus pontos valem passagens, produtos e hospedagens.' },
    { type: 'buttons', actions: [{ id: 'offers', label: 'Ver ofertas' }, HOME] },
  ];
}

const toCard = (o: Offer) => ({
  title: o.title,
  subtitle: o.subtitle,
  image: o.image,
  points: o.points,
  actions: [{ id: o.id, label: 'Quero essa' }],
});

function offers(): Component[] {
  return [
    { type: 'text', content: 'Separei 3 ofertas que cabem no seu saldo:' },
    { type: 'carousel', cards: OFFERS.map(toCard) },
  ];
}

function confirm(o: Offer): Component[] {
  return [
    {
      type: 'card',
      title: o.title,
      subtitle: 'Confirme o resgate',
      image: o.image,
      points: o.points,
      actions: [
        { id: `confirm_${o.id}`, label: 'Confirmar' },
        { id: 'cancel', label: 'Cancelar' },
      ],
    },
  ];
}

function success(o: Offer): Component[] {
  if (o.points > BALANCE) {
    return [
      { type: 'text', content: `Ops, *${o.title}* custa ${pts(o.points)} e você tem ${pts(BALANCE)}.` },
      { type: 'buttons', actions: [{ id: 'offers', label: 'Ver ofertas' }, HOME] },
    ];
  }
  return [
    {
      type: 'text',
      content: `**Pronto!** Você resgatou *${o.title}* por ${pts(o.points)}. Seu novo saldo é **${pts(BALANCE - o.points)}**.`,
    },
    { type: 'buttons', text: 'Quer fazer mais alguma coisa?', actions: [{ id: 'offers', label: 'Ver ofertas' }, HOME] },
  ];
}

/** Turno de estresse: força todas as regras de fallback de uma vez. */
function limits(): Component[] {
  const destinations = [
    'Rio de Janeiro', 'Salvador', 'Recife', 'Fortaleza', 'Natal', 'Florianópolis',
    'Porto Alegre', 'Manaus', 'Belém', 'Lisboa', 'Buenos Aires', 'Santiago',
  ];
  const rules = 'Os pontos podem ser trocados por passagens, produtos e hospedagens de parceiros. ';
  return [
    {
      type: 'text',
      content: '# Teste de limites\nEste turno força **todas** as regras de fallback. Veja o *painel de debug* ou o [regulamento](https://example.com/regulamento).',
    },
    {
      type: 'buttons',
      text: 'Cinco botões, um com rótulo longo:',
      actions: [
        { id: 'balance', label: 'Ver saldo' },
        { id: 'offers', label: 'Ver ofertas' },
        { id: 'intl', label: 'Quero ver todas as ofertas de passagens internacionais' },
        { id: 'products', label: 'Produtos' },
        HOME,
      ],
    },
    { type: 'carousel', cards: [...OFFERS, ...EXTRA_OFFERS].map(toCard) },
    {
      type: 'buttons',
      text: 'Doze destinos:',
      actions: destinations.map((d, i) => ({ id: `dest_${i + 1}`, label: d })),
    },
    { type: 'text', content: `**Regulamento resumido.** ${rules.repeat(24).trim()}` },
  ];
}
