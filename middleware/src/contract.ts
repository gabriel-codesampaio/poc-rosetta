/**
 * Contrato de componentes primitivos — fonte da verdade.
 *
 * A IA de negócio responde SEMPRE neste formato, sem saber para qual canal está falando.
 * Este arquivo é copiado para web/ e mobile/ por `npm run sync-contract`; edite apenas aqui.
 */
import { z } from 'zod';

export const CONTRACT_VERSION = '1.0.0';

export const ActionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
});

export const CardSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().optional(),
  image: z.string().url().optional(),
  points: z.number().int().nonnegative().optional(),
  actions: z.array(ActionSchema).optional(),
});

export const TextComponentSchema = z.object({
  type: z.literal('text'),
  /** Markdown leve: **negrito**, *itálico*, listas, links. */
  content: z.string().min(1),
});

export const ImageComponentSchema = z.object({
  type: z.literal('image'),
  url: z.string().url(),
  caption: z.string().optional(),
});

export const ButtonsComponentSchema = z.object({
  type: z.literal('buttons'),
  text: z.string().optional(),
  actions: z.array(ActionSchema).min(1),
});

export const CardComponentSchema = CardSchema.extend({
  type: z.literal('card'),
});

export const CarouselComponentSchema = z.object({
  type: z.literal('carousel'),
  cards: z.array(CardSchema).min(1),
});

export const ComponentSchema = z.discriminatedUnion('type', [
  TextComponentSchema,
  ImageComponentSchema,
  ButtonsComponentSchema,
  CardComponentSchema,
  CarouselComponentSchema,
]);

export const AiResponseSchema = z.object({
  messages: z.array(ComponentSchema),
});

export const CHANNELS = ['web', 'mobile', 'whatsapp'] as const;
export const ChannelSchema = z.enum(CHANNELS);

export const ChatRequestSchema = z
  .object({
    sessionId: z.string().min(1),
    channel: ChannelSchema,
    text: z.string().optional(),
    action: z.object({ id: z.string().min(1) }).optional(),
  })
  .refine((r) => Boolean(r.text?.trim()) !== Boolean(r.action), {
    message: 'Envie exatamente um dos campos: text ou action',
  });

export type Action = z.infer<typeof ActionSchema>;
export type Card = z.infer<typeof CardSchema>;
export type TextComponent = z.infer<typeof TextComponentSchema>;
export type ImageComponent = z.infer<typeof ImageComponentSchema>;
export type ButtonsComponent = z.infer<typeof ButtonsComponentSchema>;
export type CardComponent = z.infer<typeof CardComponentSchema>;
export type CarouselComponent = z.infer<typeof CarouselComponentSchema>;
export type Component = z.infer<typeof ComponentSchema>;
export type ComponentType = Component['type'];
export type AiResponse = z.infer<typeof AiResponseSchema>;
export type Channel = z.infer<typeof ChannelSchema>;
export type ChatRequest = z.infer<typeof ChatRequestSchema>;

/** Resposta de POST /chat para canais que desenham os primitivos nativamente (web, mobile). */
export interface ChatResponse {
  contractVersion: string;
  sessionId: string;
  channel: Channel;
  messages: Component[];
}
