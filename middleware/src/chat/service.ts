import type { AdaptResult, ComponentAdapter, PayloadByChannel } from '../adapter/types';
import type { BusinessAi } from '../ai/types';
import {
  AiResponseSchema,
  CHANNELS,
  CONTRACT_VERSION,
  type Channel,
  type ChatRequest,
  type Component,
} from '../contract';
import type { DebugStore } from '../debug/store';
import { normalize } from '../events/normalize';
import type { SessionStore } from './sessions';

export interface ChatResult<C extends Channel = Channel> {
  contractVersion: string;
  sessionId: string;
  channel: C;
  messages: PayloadByChannel[C];
}

const AI_FAILURE: Component[] = [
  { type: 'text', content: 'Desculpe, tive um problema para montar a resposta. Pode tentar de novo?' },
];

/** Um turno: normalizar → IA → validar → adaptar → registrar. */
export function createChatService(deps: {
  ai: BusinessAi;
  adapter: ComponentAdapter;
  sessions: SessionStore;
  debug: DebugStore;
}) {
  const { ai, adapter, sessions, debug } = deps;

  return {
    async handle(req: ChatRequest): Promise<ChatResult> {
      const started = performance.now();
      const session = sessions.get(req.sessionId, req.channel);
      const event = normalize(req, session.options);

      const raw = await ai.respond(event, { sessionId: session.id });
      const parsed = AiResponseSchema.safeParse(raw);
      const messages = parsed.success ? parsed.data.messages : AI_FAILURE;

      // Adapta para todos os canais: o canal da requisição recebe o seu, o painel mostra os três lado a lado.
      const results = await Promise.all(CHANNELS.map((c) => adapter.adapt(messages, c)));
      const preview = Object.fromEntries(results.map((r) => [r.channel, r])) as Record<Channel, AdaptResult>;
      const delivered = preview[req.channel];

      session.options = delivered.options;
      session.turns += 1;

      debug.record({
        at: new Date().toISOString(),
        ms: Math.round(performance.now() - started),
        sessionId: session.id,
        channel: req.channel,
        adapter: adapter.name,
        input: req,
        event,
        ai: parsed.success
          ? { raw, valid: true }
          : { raw, valid: false, errors: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`) },
        preview,
      });

      return {
        contractVersion: CONTRACT_VERSION,
        sessionId: session.id,
        channel: req.channel,
        messages: delivered.payload,
      };
    },
  };
}

export type ChatService = ReturnType<typeof createChatService>;
