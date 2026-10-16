import { useEffect, useRef, useState } from 'react';
import { useChat } from './chat/useChat';
import { Primitive } from './components/Primitive';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333';

function sessionId() {
  const key = 'rosetta-session';
  try {
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const id = `web-${crypto.randomUUID().slice(0, 8)}`;
    localStorage.setItem(key, id);
    return id;
  } catch {
    return `web-${crypto.randomUUID().slice(0, 8)}`;
  }
}

export default function App() {
  const [session] = useState(sessionId);
  const { entries, loading, send, act } = useChat({ apiUrl: API_URL, channel: 'web', sessionId: session });
  const [text, setText] = useState('');
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => end.current?.scrollIntoView({ behavior: 'smooth' }), [entries, loading]);

  return (
    <div className="app">
      <header>
        <strong>Assistente de Pontos</strong>
        <span className="muted">canal web · sessão {session}</span>
        <a href={`${API_URL}/debug`} target="_blank" rel="noreferrer">painel de debug</a>
      </header>

      <main className="thread">
        {entries.map((e) =>
          e.from === 'bot' ? (
            <div key={e.id} className="group">
              {e.components.map((c, i) => <Primitive key={i} component={c} onAction={act} />)}
            </div>
          ) : (
            <div key={e.id} className={`bubble ${e.from}`}>{e.text}</div>
          ),
        )}
        {loading && <div className="bubble bot typing">digitando…</div>}
        <div ref={end} />
      </main>

      <form
        className="composer"
        onSubmit={(ev) => {
          ev.preventDefault();
          send(text);
          setText('');
        }}
      >
        <input
          value={text}
          onChange={(ev) => setText(ev.target.value)}
          placeholder="Escreva (ex.: saldo, ofertas, limites)"
          aria-label="Mensagem"
        />
        <button type="submit" disabled={!text.trim()}>Enviar</button>
      </form>
    </div>
  );
}
