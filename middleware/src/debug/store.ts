import type { AdaptResult } from '../adapter/types';
import type { Channel, ChatRequest } from '../contract';
import type { NormalizedEvent } from '../events/normalize';

export interface Turn {
  id: number;
  at: string;
  ms: number;
  sessionId: string;
  channel: Channel;
  adapter: string;
  input: ChatRequest;
  event: NormalizedEvent;
  ai: { raw: unknown; valid: boolean; errors?: string[] };
  /** A mesma resposta da IA adaptada para os três canais; `channel` indica qual foi entregue. */
  preview: Record<Channel, AdaptResult>;
}

export function createDebugStore(limit = 200) {
  const turns: Turn[] = [];
  let seq = 0;
  return {
    record(turn: Omit<Turn, 'id'>): Turn {
      const t = { id: ++seq, ...turn };
      turns.unshift(t);
      turns.length = Math.min(turns.length, limit);
      return t;
    },
    list(): Turn[] {
      return turns;
    },
    clear() {
      turns.length = 0;
    },
  };
}

export type DebugStore = ReturnType<typeof createDebugStore>;
