import type { Action, Channel } from '../contract';

export interface Session {
  id: string;
  channel: Channel;
  /** Ações mostradas no último turno, na ordem vista pelo usuário. */
  options: Action[];
  turns: number;
  createdAt: string;
}

/** Sessões em memória — suficiente para a POC (ver riscos no POC.md). */
export function createSessionStore() {
  const sessions = new Map<string, Session>();
  return {
    get(id: string, channel: Channel): Session {
      let s = sessions.get(id);
      if (!s) {
        s = { id, channel, options: [], turns: 0, createdAt: new Date().toISOString() };
        sessions.set(id, s);
      }
      s.channel = channel;
      return s;
    },
    clear() {
      sessions.clear();
    },
  };
}

export type SessionStore = ReturnType<typeof createSessionStore>;
