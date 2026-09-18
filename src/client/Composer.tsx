import { useEffect, useRef, useState } from "react";
import { HUMAN, MAX_MESSAGE_CHARS, wolfKill, wolfPartner } from "../engine";
import type { Driver, View } from "./game";
import { prob, sprite } from "./format";
import { heat } from "./Table";

interface Props {
  view: View;
  driver: Driver;
}

function Seats({ view, onPick, exclude, label, hint }: { view: View; onPick: (id: number) => void; exclude: (id: number) => boolean; label: string; hint?: (id: number) => string | null }) {
  const { game } = view;
  const board = game.history[game.history.length - 1] ?? {};
  return (
    <div className="seats" role="group" aria-label={label}>
      {game.players
        .filter((p) => p.alive && !exclude(p.id))
        .map((p) => {
          const h = heat(board, p.id);
          const extra = hint?.(p.id);
          return (
            <button type="button" key={p.id} className="seat" onClick={() => onPick(p.id)}>
              <img src={sprite(p.name)} alt="" width={40} height={40} />
              <span className="seat-name">{p.name}</span>
              <span className="seat-heat">{h === null ? "" : prob(h)}</span>
              {extra ? <span className="seat-hint">{extra}</span> : null}
            </button>
          );
        })}
    </div>
  );
}

export function Composer({ view, driver }: Props) {
  const { game } = view;
  const [text, setText] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);
  const you = game.players[HUMAN];
  const day = game.phase === "day";

  useEffect(() => {
    if (day && you.alive && game.queue.length === 0 && game.humanMessagesLeft > 0) ref.current?.focus();
  }, [day, you.alive, game.queue.length, game.humanMessagesLeft]);

  if (!you.alive && game.phase !== "over") {
    return <div className="composer dead-note">You are dead. The table goes on without you.</div>;
  }

  if (game.phase === "vote") {
    if (view.humanVoted) {
      return <div className="composer vote-note">Your vote is in. The table finishes announcing.</div>;
    }
    return (
      <div className="composer vote-panel">
        <div className="panel-head">
          <span>Vote, day {game.day}. Who is a wolf?</span>
          <button type="button" className="link" onClick={() => driver.vote(null)}>
            abstain
          </button>
        </div>
        <Seats view={view} onPick={(id) => driver.vote(id)} exclude={(id) => id === HUMAN} label="vote" />
      </div>
    );
  }

  if (game.phase === "night") {
    const needs = view.night?.needs ?? [];
    if (needs.includes("kill")) {
      const partner = wolfPartner(game.players, HUMAN);
      const suggestion = wolfKill(game);
      return (
        <div className="composer vote-panel night-panel">
          <div className="panel-head">
            <span>
              Night {game.day}. {partner !== null ? `${game.players[partner].name} looks at you. ` : ""}Who dies?
            </span>
          </div>
          <Seats
            view={view}
            onPick={(id) => driver.night({ kill: id })}
            exclude={(id) => game.players[id].role === "wolf"}
            label="kill"
            hint={(id) => (id === suggestion && partner !== null ? `${game.players[partner].name} favours` : null)}
          />
        </div>
      );
    }
    if (needs.includes("check")) {
      const seen = new Set(game.log.filter((e) => e.kind === "check" && e.seer === HUMAN).map((e) => (e.kind === "check" ? e.target : -1)));
      return (
        <div className="composer vote-panel night-panel">
          <div className="panel-head">
            <span>Night {game.day}. Whom do you look at?</span>
          </div>
          <Seats view={view} onPick={(id) => driver.night({ check: id })} exclude={(id) => id === HUMAN || seen.has(id)} label="check" />
        </div>
      );
    }
    return (
      <div className="composer night-note">
        <span className="dots">Night {game.day}. You sleep</span>
      </div>
    );
  }

  const left = game.humanMessagesLeft;
  const over = text.length > MAX_MESSAGE_CHARS;
  const canSend = day && left > 0 && text.trim().length > 0 && !over && !view.pending;
  const send = () => {
    if (!canSend) return;
    driver.send(text);
    setText("");
  };
  const canCall = day && game.queue.length === 0 && view.speaking === null;

  return (
    <div className="composer">
      <textarea
        ref={ref}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send();
          }
        }}
        placeholder={left > 0 ? "Say something to the table" : "You have said your piece today"}
        disabled={!day || left <= 0}
        maxLength={MAX_MESSAGE_CHARS + 20}
        rows={2}
        aria-label="your message"
      />
      <div className="composer-row">
        <span className={`count${over ? " over" : ""}`}>
          {text.length}/{MAX_MESSAGE_CHARS} · {left} left today
        </span>
        <span className="composer-actions">
          {canCall ? (
            <button type="button" className="flag-btn" onClick={() => driver.callVote()}>
              call the vote
            </button>
          ) : null}
          <button type="button" className="primary" onClick={send} disabled={!canSend}>
            send
          </button>
        </span>
      </div>
    </div>
  );
}
