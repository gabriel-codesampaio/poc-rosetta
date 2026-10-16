/**
 * Estado do chat, sem UI: usado igual no web e no mobile.
 * O front só conhece o contrato de primitivos; nunca a IA.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { z } from 'zod';
import { ComponentSchema, type Action, type Channel, type Component } from '../contract';

export type Entry =
  | { id: string; from: 'user'; text: string }
  | { id: string; from: 'bot'; components: Component[] }
  | { id: string; from: 'error'; text: string };

const ResponseSchema = z.object({
  contractVersion: z.string(),
  messages: z.array(ComponentSchema),
});

let seq = 0;
const nextId = () => `${Date.now()}-${++seq}`;

export function useChat(opts: { apiUrl: string; channel: Channel; sessionId: string; greeting?: string }) {
  const { apiUrl, channel, sessionId, greeting = 'Oi' } = opts;
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const greeted = useRef(false);

  const post = useCallback(
    async (body: { text: string } | { action: { id: string } }, echo: string) => {
      setEntries((e) => [...e, { id: nextId(), from: 'user', text: echo }]);
      setLoading(true);
      try {
        const res = await fetch(`${apiUrl}/chat`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ sessionId, channel, ...body }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const parsed = ResponseSchema.safeParse(await res.json());
        if (!parsed.success) throw new Error('Resposta fora do contrato');
        setEntries((e) => [...e, { id: nextId(), from: 'bot', components: parsed.data.messages }]);
      } catch (err) {
        const text = `Não consegui falar com o middleware (${err instanceof Error ? err.message : err}).`;
        setEntries((e) => [...e, { id: nextId(), from: 'error', text }]);
      } finally {
        setLoading(false);
      }
    },
    [apiUrl, channel, sessionId],
  );

  const send = useCallback((text: string) => {
    const t = text.trim();
    if (t) void post({ text: t }, t);
  }, [post]);

  const act = useCallback((action: Action) => void post({ action: { id: action.id } }, action.label), [post]);

  useEffect(() => {
    if (greeted.current) return;
    greeted.current = true;
    send(greeting);
  }, [send, greeting]);

  return { entries, loading, send, act };
}
