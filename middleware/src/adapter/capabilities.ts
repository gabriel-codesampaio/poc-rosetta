import type { Channel, ComponentType } from '../contract';

/** O que cada canal sabe desenhar nativamente e com quais limites. */
export interface ChannelCapabilities {
  supports: Record<ComponentType, boolean>;
  /** Textos maiores são quebrados em várias mensagens. */
  maxTextLength: number;
  /** Botões por grupo; o excedente vira um novo grupo. Infinity = o renderer do canal decide. */
  maxButtons: number;
  maxButtonLabel: number;
  maxCarouselCards: number;
}

const ALL: Record<ComponentType, boolean> = {
  text: true,
  image: true,
  buttons: true,
  card: true,
  carousel: true,
};

export const CAPABILITIES: Record<Channel, ChannelCapabilities> = {
  web: {
    supports: ALL,
    maxTextLength: 4000,
    maxButtons: 6,
    maxButtonLabel: 40,
    maxCarouselCards: 10,
  },
  mobile: {
    supports: ALL,
    maxTextLength: 4000,
    maxButtons: 4,
    maxButtonLabel: 28,
    maxCarouselCards: 10,
  },
  whatsapp: {
    // Card e carrossel do Twilio exigem Content Templates aprovados; na POC eles degradam.
    supports: { ...ALL, card: false, carousel: false },
    maxTextLength: 1600,
    // Quick reply × lista × texto numerado é decidido em renderers/whatsapp.ts.
    maxButtons: Infinity,
    maxButtonLabel: Infinity,
    maxCarouselCards: Infinity,
  },
};
