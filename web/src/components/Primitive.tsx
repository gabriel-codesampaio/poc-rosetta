import type { Action, Card, Component } from '../contract';
import { formatPoints, parseMarkdown } from '../chat/markdown';

type OnAction = (action: Action) => void;

export function Markdown({ content }: { content: string }) {
  return (
    <>
      {parseMarkdown(content).map((line, i) => (
        <p key={i} className="md-line">
          {line.map((s, j) => {
            let node: React.ReactNode = s.text;
            if (s.href) node = <a href={s.href} target="_blank" rel="noreferrer">{node}</a>;
            if (s.italic) node = <em>{node}</em>;
            if (s.bold) node = <strong>{node}</strong>;
            return <span key={j}>{node}</span>;
          })}
        </p>
      ))}
    </>
  );
}

function ActionButtons({ actions, onAction }: { actions: Action[]; onAction: OnAction }) {
  return (
    <div className="actions">
      {actions.map((a) => (
        <button key={a.id} type="button" onClick={() => onAction(a)}>
          {a.label}
        </button>
      ))}
    </div>
  );
}

function CardView({ card, onAction }: { card: Card; onAction: OnAction }) {
  return (
    <article className="card">
      {card.image && <img src={card.image} alt="" loading="lazy" />}
      <div className="card-body">
        <h4>{card.title}</h4>
        {card.subtitle && <p className="muted">{card.subtitle}</p>}
        {card.points != null && <p className="points">{formatPoints(card.points)}</p>}
        {card.actions?.length ? <ActionButtons actions={card.actions} onAction={onAction} /> : null}
      </div>
    </article>
  );
}

/** Desenha um primitivo do contrato. Web suporta todos nativamente. */
export function Primitive({ component: c, onAction }: { component: Component; onAction: OnAction }) {
  switch (c.type) {
    case 'text':
      return <div className="bubble bot"><Markdown content={c.content} /></div>;
    case 'image':
      return (
        <figure className="bubble bot image">
          <img src={c.url} alt={c.caption ?? ''} loading="lazy" />
          {c.caption && <figcaption><Markdown content={c.caption} /></figcaption>}
        </figure>
      );
    case 'buttons':
      return (
        <div className="bubble bot">
          {c.text && <Markdown content={c.text} />}
          <ActionButtons actions={c.actions} onAction={onAction} />
        </div>
      );
    case 'card':
      return <CardView card={c} onAction={onAction} />;
    case 'carousel':
      return (
        <div className="carousel">
          {c.cards.map((card, i) => <CardView key={i} card={card} onAction={onAction} />)}
        </div>
      );
  }
}
