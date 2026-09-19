import { useMemo } from "react";
import { HUMAN, displayedStep, renormalisedStep, steps, type BeliefUpdate, type Board as BoardData, type CellStep, type GameState } from "../engine";
import { prob, signed, signedProb, sprite } from "./format";
import type { Selection } from "./Play";

interface Props {
  game: GameState;
  board: BoardData;
  hard: boolean;
  selected: Selection | null;
  onSelect: (s: Selection) => void;
  standing: number;
  lastJudgeMs: number | null;
  scrub: { at: number; max: number; onChange: (at: number | null) => void } | null;
}

/** Last update for each (mind, about) pair, for the delta shown under a cell. */
function lastUpdates(updates: BeliefUpdate[], upTo: number): Map<string, BeliefUpdate> {
  const out = new Map<string, BeliefUpdate>();
  for (const u of updates) {
    if (u.at > upTo) break;
    out.set(`${u.mind}:${u.about}`, u);
  }
  return out;
}

/** The mechanics of one update, in log-odds. */
function describe(u: BeliefUpdate): string {
  const gate = u.threshold > 0 && u.threshold < 1 ? `${u.p.toFixed(2)} ≥ ${u.threshold.toFixed(2)}` : u.threshold === 0 ? `${u.p.toFixed(2)}` : "";
  const factors = u.factors.map((f) => `${f.name} ${f.value.toFixed(2)}`).join(" · ");
  const w = u.weight ? `w ${u.weight.toFixed(2)}` : "";
  return [u.signal, gate, w, factors].filter(Boolean).join(" · ") + ` · Δlogit ${signed(u.delta)}`;
}

/** Who a step is attributed to. */
function stepBy(st: CellStep, game: GameState): string {
  if (st.renormalised) return "renormalised";
  if (st.by === null || st.by < 0) return "rule";
  return st.by === HUMAN ? "you" : game.players[st.by].name;
}

export function Board({ game, board, hard, selected, onSelect, standing, lastJudgeMs, scrub }: Props) {
  const upTo = scrub ? scrub.at : game.log.length - 1;
  const last = useMemo(() => lastUpdates(game.updates, upTo), [game.updates, upTo]);
  const minds = Object.keys(board).map(Number);
  const players = game.players;
  const dayStart = game.log.findIndex((e) => e.kind === "dawn" && e.day === game.day);
  const startBoard = game.history[Math.max(0, dayStart)] ?? {};
  let startSum = 0;
  let startN = 0;
  for (const row of Object.values(startBoard)) {
    startSum += row[HUMAN];
    startN++;
  }
  const trend = startN ? standing - startSum / startN : 0;
  // Where a player with no evidence either way sits: hidden wolves among the living others.
  const livingOthers = players.filter((p) => p.alive).length - 1;
  const hidden = players.filter((p) => p.alive && p.role === "wolf").length;
  const baseline = livingOthers > 0 ? Math.min(1, hidden / livingOthers) : 0;
  const trace = selected && board[selected.mind] ? steps(game, selected.mind, selected.about, upTo).slice(-6).reverse() : [];

  return (
    <>
      <div className="pane-head">
        <span className="file">{hard ? "your standing" : "belief board"}</span>
        <span className="dim">{scrub ? `replay ${scrub.at}/${scrub.max}` : lastJudgeMs !== null ? `last judgment ${lastJudgeMs} ms` : "P(wolf) per villager"}</span>
      </div>
      {scrub ? (
        <div className="scrub">
          <input type="range" min={0} max={scrub.max} value={scrub.at} onChange={(e) => scrub.onChange(Number(e.target.value))} aria-label="replay position" />
          <button type="button" className="link" onClick={() => scrub.onChange(null)}>
            live
          </button>
        </div>
      ) : null}

      <div className="standing">
        <div className="standing-row">
          <span className="standing-label">suspicion of you</span>
          <span className="standing-value">{prob(standing)}</span>
          <span className={`standing-trend ${trend > 0.005 ? "bad" : trend < -0.005 ? "good" : ""}`}>{Math.abs(trend) > 0.005 ? `${signed(trend)} today` : "flat today"}</span>
          <span className="standing-base dim" title="a player with nothing against them: hidden wolves among the living others">baseline {prob(baseline)}</span>
        </div>
        <div className="meter" role="meter" aria-valuemin={0} aria-valuemax={1} aria-valuenow={standing} aria-label="mean suspicion of you">
          <i style={{ width: `${Math.round(standing * 100)}%` }} />
          <b style={{ left: `${baseline * 100}%` }} title={`baseline ${prob(baseline)}: hidden wolves among the living others`} />
        </div>
      </div>

      {hard ? (
        <div className="hard-note">
          Hard mode hides the board. Only the mean belief in you is shown; the villagers still see everything.
        </div>
      ) : (
        <>
          <div className="board-wrap">
            <table className="board">
              <thead>
                <tr>
                  <th className="corner">
                    <span>thinks</span>
                    <span>about</span>
                  </th>
                  {players.map((p) => (
                    <th key={p.id} className={`${p.id === HUMAN ? "you" : ""}${p.alive ? "" : " dead"}`}>
                      <img src={sprite(p.name)} alt="" width={36} height={36} />
                      <span>{p.id === HUMAN ? "you" : p.name}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {minds.map((m) => (
                  <tr key={m}>
                    <th>
                      <img src={sprite(players[m].name)} alt="" width={28} height={28} />
                      <span>{players[m].name}</span>
                    </th>
                    {players.map((p) => {
                      if (p.id === m) return <td key={p.id} className="cell self" aria-label="self" />;
                      if (!p.alive) {
                        return (
                          <td key={p.id} className="cell dead">
                            <img src={sprite(p.role)} alt={p.role} width={22} height={22} />
                          </td>
                        );
                      }
                      const v = board[m][p.id];
                      const u = last.get(`${m}:${p.id}`);
                      const shifted = renormalisedStep(game, m, p.id, upTo);
                      // The arrow is the change in displayed probability at the last signal that hit this cell.
                      const moved = u ? (displayedStep(game, m, p.id, u.at) ?? 0) : 0;
                      const sel = selected?.mind === m && selected.about === p.id;
                      const hot = v >= 0.55;
                      return (
                        <td key={p.id} className={`cell${p.id === HUMAN ? " you" : ""}${sel ? " sel" : ""}${hot ? " hot" : ""}`} style={{ "--pct": `${Math.round(Math.min(1, v) * 88)}%` } as React.CSSProperties}>
                          <button type="button" onClick={() => onSelect({ mind: m, about: p.id })} title={`${players[m].name} on ${p.id === HUMAN ? "you" : p.name}: ${prob(v)}`}>
                            <span className="v">{prob(v)}</span>
                            {shifted !== null ? (
                              <span key={`r${upTo}`} className="d renorm fresh" title="moved because the row was renormalised, not by a signal about this player">
                                {shifted > 0 ? "↑" : "↓"}
                                {Math.abs(shifted).toFixed(2).slice(1)}
                              </span>
                            ) : u && Math.abs(moved) >= 0.005 ? (
                              <span key={u.at} className={`d ${moved > 0 ? "up" : "down"}${u.at === upTo ? " fresh" : ""}`} title={`${u.signal}: ${signed(u.delta)} in log-odds`}>
                                {moved > 0 ? "▲" : "▼"}
                                {Math.abs(moved).toFixed(2).slice(1)}
                              </span>
                            ) : (
                              <span className="d none">·</span>
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="why">
            {selected && board[selected.mind] ? (
              <>
                <div className="why-head">
                  <span>
                    {players[selected.mind].name} on {selected.about === HUMAN ? "you" : players[selected.about].name}
                  </span>
                  <span className="why-value">{players[selected.about].alive ? prob(board[selected.mind][selected.about]) : players[selected.about].role}</span>
                </div>
                {trace.length === 0 ? (
                  <div className="why-line dim">= no signal has crossed a threshold yet; the prior is two wolves among seven</div>
                ) : (
                  trace.map((st) => (
                    <div key={st.at} className={`why-step${st.renormalised ? " renorm" : st.after > st.before ? " up" : " down"}`}>
                      <div className="why-step-head">
                        <span>
                          d{st.day} · {stepBy(st, game)} · {prob(st.before)} → {prob(st.after)}
                        </span>
                        <b>{signedProb(st.after - st.before)}</b>
                      </div>
                      {st.renormalised ? (
                        <div className="why-line renorm" title="the row is shifted so it sums to the hidden wolves; when one cell moves, the rest move with it">
                          = {st.because}
                        </div>
                      ) : (
                        st.updates.map((u, i) => (
                          <div key={i} className="why-line">
                            = {describe(u)}
                          </div>
                        ))
                      )}
                    </div>
                  ))
                )}
              </>
            ) : (
              <div className="why-line dim">= click a cell to see why it moved</div>
            )}
          </div>
        </>
      )}
    </>
  );
}
