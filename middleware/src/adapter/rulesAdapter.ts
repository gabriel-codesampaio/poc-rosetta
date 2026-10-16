import type { Action, Channel, Component } from '../contract';
import { CAPABILITIES, type ChannelCapabilities } from './capabilities';
import { degrade } from './degrade';
import { renderWhatsApp } from './renderers/whatsapp';
import type { AdaptResult, ComponentAdapter, Decision, Note } from './types';

/** Implementação da POC da fronteira `ComponentAdapter`: regras determinísticas. */
export function createRulesAdapter(
  capabilities: Record<Channel, ChannelCapabilities> = CAPABILITIES,
): ComponentAdapter {
  return {
    name: 'rules',

    async adapt<C extends Channel>(messages: Component[], channel: C): Promise<AdaptResult<C>> {
      const decisions: Decision[] = [];
      const note: Note = (source, from, rule, detail) => decisions.push({ source, from, rule, detail });

      const placed = degrade(messages, capabilities[channel], note);
      const options: Action[] = [];

      const payload =
        channel === 'whatsapp'
          ? renderWhatsApp(placed, options, note)
          : placed.map(({ component }) => {
              options.push(...actionsOf(component));
              return component;
            });

      return { channel, payload, options, decisions } as AdaptResult<C>;
    },
  };
}

function actionsOf(c: Component): Action[] {
  switch (c.type) {
    case 'buttons':
      return c.actions;
    case 'card':
      return c.actions ?? [];
    case 'carousel':
      return c.cards.flatMap((card) => card.actions ?? []);
    default:
      return [];
  }
}
