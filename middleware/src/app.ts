import cors from 'cors';
import express from 'express';
import { fileURLToPath } from 'node:url';
import { createRulesAdapter } from './adapter/rulesAdapter';
import type { ComponentAdapter } from './adapter/types';
import { createMockAi } from './ai/mockAi';
import type { BusinessAi } from './ai/types';
import { createChatService } from './chat/service';
import { createSessionStore } from './chat/sessions';
import { CONTRACT_VERSION, ChatRequestSchema } from './contract';
import { createDebugStore } from './debug/store';
import { createTwilioRouter, type TwilioOptions } from './twilio/webhook';

const DEBUG_PAGE = fileURLToPath(new URL('./debug/page.html', import.meta.url));

export function createApp(opts: { ai?: BusinessAi; adapter?: ComponentAdapter; twilio?: TwilioOptions } = {}) {
  const sessions = createSessionStore();
  const debug = createDebugStore();
  const ai = opts.ai ?? createMockAi();
  const adapter = opts.adapter ?? createRulesAdapter();
  const chat = createChatService({ ai, adapter, sessions, debug });

  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ ok: true, contractVersion: CONTRACT_VERSION, ai: ai.name, adapter: adapter.name });
  });

  app.post('/chat', async (req, res, next) => {
    const parsed = ChatRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'invalid_request', issues: parsed.error.issues });
      return;
    }
    try {
      res.json(await chat.handle(parsed.data));
    } catch (err) {
      next(err);
    }
  });

  app.use(createTwilioRouter(chat, opts.twilio ?? {}));

  app.get('/debug', (_req, res) => res.sendFile(DEBUG_PAGE));
  app.get('/debug/turns', (_req, res) => res.json(debug.list()));
  app.delete('/debug/turns', (_req, res) => {
    debug.clear();
    res.status(204).end();
  });

  return { app, chat, sessions, debug };
}
