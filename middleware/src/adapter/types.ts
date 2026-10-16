import type { Action, Channel, Component, ComponentType } from '../contract';
import type { WhatsAppMessage } from './renderers/whatsapp';

/** Uma adaptação feita pelo filtro, exibida no painel de debug. */
export interface Decision {
  /** Índice do componente na resposta original da IA. */
  source: number;
  /** Tipo do componente que sofreu a adaptação (pode ser um card dentro de um carrossel). */
  from: ComponentType;
  rule: string;
  detail: string;
}

export interface PayloadByChannel {
  web: Component[];
  mobile: Component[];
  whatsapp: WhatsAppMessage[];
}

export interface AdaptResult<C extends Channel = Channel> {
  channel: C;
  payload: PayloadByChannel[C];
  /**
   * Todas as ações entregues no turno, na ordem em que o usuário as vê.
   * É o que permite traduzir um "2" digitado no WhatsApp para o actionId certo.
   */
  options: Action[];
  decisions: Decision[];
}

/**
 * Fronteira trocável da POC: hoje implementada com regras (rulesAdapter),
 * no futuro pode ser uma IA orquestradora com a mesma assinatura.
 */
export interface ComponentAdapter {
  readonly name: string;
  adapt<C extends Channel>(messages: Component[], channel: C): Promise<AdaptResult<C>>;
}

/** Componente já degradado, com a origem preservada para rastrear decisões. */
export interface Placed {
  component: Component;
  source: number;
}

export type Note = (source: number, from: ComponentType, rule: string, detail: string) => void;
