import { useEffect, useRef, useState } from "react";
import { HUMAN, renderLine, voteLine, type LogEntry, type Measurements } from "../engine";
import { ALL_LINES } from "../engine/lines";
import type { View } from "./game";
import { allSignals, fired, prob, roleWord, signed, sprite } from "./format";
import type { Selection } from "./Play";

interface Props {
  view: View;
  highlight: number | null;
  onSelect: (s: Selection) => void;
}

function Signals({ m, at, view }: { m: Measurements; at: number; view: View }) {
  const [open, setOpen] = useState(false);
  const hits = fired(m);
  const target = m.choices.target.choice;
  const targetP = m.choices.target.probabilities[target] ?? 0;
  // Net effect of this message on the speaker's own standing.
  const e = view.game.log[at];
  const speaker = e.kind === "message" ? e.speaker : -1;
  const own = view.game.updates.filter((u) => u.at === at && u.about === speaker && u.by === speaker);
  const net = own.length ? own.reduce((s, u) => s + u.delta, 0) / own.length : 0;
  return (
    <div className="signals">
      <button type="button" className="signal-toggle" onClick={() => setOpen((o) => !o)} title="every measurement for this message">
        {open ? "−" : "="}
      </button>
      {hits.length === 0 ? <span className="chip neutral">nothing fired</span> : null}
      {hits.map((h) => (
        <span key={h.id} className={`chip ${h.kind}`} title={`${h.id} = ${h.p.toFixed(2)}, threshold ${h.threshold.toFixed(2)}`}>
          {h.id} {h.p.toFixed(2)}
        </span>
      ))}
      {target !== "nobody" && targetP >= 0.4 ? (
        <span className="chip target" title={`target: ${target} (${targetP.toFixed(2)})`}>
          → {target}
        </span>
      ) : null}
      {own.length ? (
        <span className={`chip ${net > 0 ? "bad" : "good"}`} title="mean change in suspicion of the speaker, in log-odds">
          self {signed(net)}
        </span>
      ) : null}
      {open && (
        <table className="measure">
          <tbody>
            {allSignals(m).map((s) => (
              <tr key={s.id} className={s.p >= s.threshold ? "hit" : ""}>
                <th>{s.id}</th>
                <td className="num">{s.p.toFixed(2)}</td>
                <td className="num dim">≥ {s.threshold.toFixed(2)}</td>
                <td className="bar-cell">
                  <span className="bar">
                    <i style={{ width: `${Math.round(s.p * 100)}%` }} />
                  </span>
                </td>
              </tr>
            ))}
            <tr>
              <th>intent</th>
              <td colSpan={3}>
                {m.choices.intent.choice} <span className="dim">{(m.choices.intent.probabilities[m.choices.intent.choice] ?? 0).toFixed(2)}</span>
              </td>
            </tr>
            <tr>
              <th>tone</th>
              <td colSpan={3}>
                {m.choices.tone.choice} <span className="dim">{(m.choices.tone.probabilities[m.choices.tone.choice] ?? 0).toFixed(2)}</span>
              </td>
            </tr>
            <tr>
              <th>specificity</th>
              <td colSpan={3}>{m.scores.specificity.score.toFixed(2)} / 3</td>
            </tr>
            <tr>
              <th>persuasiveness</th>
              <td colSpan={3}>{m.scores.persuasiveness.score.toFixed(2)} / 2</td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
}

function Message({ e, at, view, onSelect }: { e: Extract<LogEntry, { kind: "message" }>; at: number; view: View; onSelect: (s: Selection) => void }) {
  const { game } = view;
  const p = game.players[e.speaker];
  const you = e.speaker === HUMAN;
  const target = e.target !== undefined ? game.players[e.target] : null;
  const measuring = view.measuring === at;
  const pickP = e.pick && e.lineId && e.candidates ? e.pick.probabilities[e.candidates.indexOf(e.lineId)] : undefined;
  // The mirror only exists for wolves, so it is shown only once the game is over.
  const mirror = game.phase === "over" && e.pick?.mirror && e.lineId && e.candidates ? e.pick.mirror[e.candidates.indexOf(e.lineId)] : undefined;
  return (
    <div className={`msg${you ? " you" : ""}${view.speaking === e.speaker && at === game.log.length - 1 ? " live" : ""}`}>
      <button type="button" className="msg-bust" onClick={() => onSelect({ mind: you ? Object.keys(game.minds).map(Number)[0] : e.speaker, about: e.speaker })} title={`see the board for ${p.name}`}>
        <img src={sprite(p.name)} alt="" width={40} height={40} />
      </button>
      <div className="msg-body">
        <div className="msg-head">
          <span className="who">{you ? "you" : p.name}</span>
          {target && !you ? <span className="arrow">→ {target.id === HUMAN ? "you" : target.name}</span> : null}
          {e.tone && !you ? <span className="tone">{e.tone}</span> : null}
          {e.intent && !you ? <span className="tone dim">{e.intent.replace("_", " ")}</span> : null}
          <span className="day dim">d{e.day}</span>
        </div>
        <p className="text">{e.text}</p>
        {e.fact ? <div className="note">= fact: {e.fact.text}</div> : null}
        {pickP !== undefined && e.candidates && e.candidates.length > 1 ? (
          <div className="note dim" title={mirror ? "the wolf's mirror: predicted suspicion of the line it chose" : "how strongly Jev preferred this line as the next thing to say"}>
            = line {mirror ? `chosen by the mirror: suspicious ${mirror.suspicious.toFixed(2)}, contradicts ${mirror.contradicts.toFixed(2)}, rehearsed ${mirror.rehearsed.toFixed(2)}` : `picked at ${pickP.toFixed(2)}`} of {e.candidates.length}
          </div>
        ) : null}
        {e.measurements ? <Signals m={e.measurements} at={at} view={view} /> : e.measured ? <div className={`note dim${measuring ? " measuring" : ""}`}>{measuring ? "= measuring" : "= not measured"}</div> : null}
      </div>
    </div>
  );
}

function System({ e, game }: { e: LogEntry; game: View["game"] }) {
  const name = (id: number | null) => (id === null ? "nobody" : id === HUMAN ? "you" : game.players[id].name);
  if (e.kind === "dawn") {
    if (e.day === 1) return <div className="sys">Day 1. The table wakes. Two of the eight are wolves.</div>;
    return (
      <div className={`sys${e.killed !== null ? " grim" : ""}`}>
        <span className="sys-day">Day {e.day}.</span>{" "}
        {e.killed === null ? "Nobody died in the night." : (
          <>
            {name(e.killed)} {e.killed === HUMAN ? "were" : "was"} killed in the night. {name(e.killed)} {e.killed === HUMAN ? "were" : "was"} {roleWord(game.players[e.killed].role)}.
            <img className="inline-badge" src={sprite(game.players[e.killed].role)} alt="" width={18} height={18} />
          </>
        )}
      </div>
    );
  }
  if (e.kind === "tally") {
    const parts = Object.entries(e.counts)
      .filter(([, n]) => n > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([id, n]) => `${name(Number(id))} ${n}`)
      .join(", ");
    return (
      <div className={`sys${e.eliminated !== null ? " grim" : ""}`}>
        <span className="sys-day">Vote, day {e.day}.</span> {parts ? `${parts}.` : "No votes."}{" "}
        {e.eliminated === null ? "Nobody is eliminated." : (
          <>
            {name(e.eliminated)} {e.eliminated === HUMAN ? "are" : "is"} eliminated and {e.eliminated === HUMAN ? "were" : "was"} {roleWord(e.role ?? "villager")}.
            <img className="inline-badge" src={sprite(e.role ?? "villager")} alt="" width={18} height={18} />
          </>
        )}
      </div>
    );
  }
  if (e.kind === "vote") {
    const voter = game.players[e.voter];
    const line = e.voter !== HUMAN && e.target !== null ? voteLine({ ...game, day: e.day }, e.voter, e.target, ALL_LINES) : null;
    return (
      <div className={`msg vote-line${e.voter === HUMAN ? " you" : ""}`}>
        <span className="msg-bust">
          <img src={sprite(voter.name)} alt="" width={40} height={40} />
        </span>
        <div className="msg-body">
          <div className="msg-head">
            <span className="who">{e.voter === HUMAN ? "you" : voter.name}</span>
            <span className="arrow">{e.voter === HUMAN ? "vote" : "votes"} {name(e.target)}</span>
          </div>
          {line && e.target !== null ? <p className="text">{renderLine(line.text, game.players[e.target].name)}</p> : null}
        </div>
      </div>
    );
  }
  if (e.kind === "check" && e.seer === HUMAN) {
    return (
      <div className="sys private">
        <img className="inline-badge" src={sprite("seer")} alt="" width={18} height={18} /> Night {e.day}: you looked at {name(e.target)}. {e.wolf ? "A wolf." : "Not a wolf."}
      </div>
    );
  }
  if (e.kind === "over") {
    return <div className="sys final">{e.winner === "village" ? "The village wins. Both wolves are dead." : "The wolves win. The village is theirs."}</div>;
  }
  return null;
}

export function Transcript({ view, highlight, onSelect }: Props) {
  const { game } = view;
  const ref = useRef<HTMLDivElement>(null);
  const pinned = useRef(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => {
      pinned.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (highlight !== null) {
      el.querySelector(`[data-at="${highlight}"]`)?.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }
    if (pinned.current) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [game.log.length, view.pending, view.announcements.length, view.measuring, highlight, view.revision]);

  const showHint = game.day === 1 && game.log.filter((e) => e.kind === "message" && e.speaker === HUMAN).length === 0 && game.phase === "day";

  return (
    <div className="transcript" ref={ref}>
      {showHint && (
        <div className="hint-block">
          <div>Type to the table; the board moves as soon as Jev has measured you.</div>
          <div>Cite what people said and how they voted. Bare accusations are discounted.</div>
          <div>Answer what is put to you. Dodging costs more than a bad answer.</div>
        </div>
      )}
      {game.log.map((e, at) => (
        <div key={at} data-at={at} className={highlight === at ? "hl-entry" : undefined}>
          {e.kind === "message" ? <Message e={e} at={at} view={view} onSelect={onSelect} /> : <System e={e} game={game} />}
        </div>
      ))}
      {view.announcements.map((a, i) => (
        <div key={`a${i}`} className={`msg vote-line${view.announcing === a.voter ? " live" : ""}`}>
          <span className="msg-bust">
            <img src={sprite(game.players[a.voter].name)} alt="" width={40} height={40} />
          </span>
          <div className="msg-body">
            <div className="msg-head">
              <span className="who">{game.players[a.voter].name}</span>
              <span className="arrow">votes {a.target === null ? "nobody" : a.target === HUMAN ? "you" : game.players[a.target].name}</span>
            </div>
            <p className="text">{a.text}</p>
          </div>
        </div>
      ))}
      {view.pending ? (
        <div className="msg you pending">
          <span className="msg-bust">
            <img src={sprite("stranger")} alt="" width={40} height={40} />
          </span>
          <div className="msg-body">
            <div className="msg-head">
              <span className="who">you</span>
            </div>
            <p className="text">{view.pending}</p>
            <div className="note dim measuring">= measuring</div>
          </div>
        </div>
      ) : null}
      {view.dawn && view.dawn.killed !== null && game.phase === "day" ? null : null}
      {view.night ? (
        <div className="sys night-note">
          Night {game.day}. {view.night.needs.length ? "" : "You sleep."}
          {view.night.result ? (
            <>
              {" "}
              You looked at {game.players[view.night.result.target].name}: {view.night.result.wolf ? "a wolf." : "not a wolf."}
            </>
          ) : null}
        </div>
      ) : null}
      {game.phase === "day" && view.speaking === null && !view.pending && game.queue.length === 0 && game.humanMessagesLeft > 0 && game.players[HUMAN].alive ? (
        <div className="sys soft">The table is waiting. Speak, or call the vote.</div>
      ) : null}
      {game.players[HUMAN].alive ? null : game.phase !== "over" ? <div className="sys soft">You are dead. You watch.</div> : null}
      <div className="scroll-pad" />
    </div>
  );
}

export { prob };
