// Explains what the board shows. A cell moves for one of two reasons: a
// belief update aimed at it, recorded in `state.updates`, or the row being
// renormalised after some other cell moved (or the table changed), which
// leaves no update behind. This module reads both from the history so the
// board can answer "why" for every change, as D10 requires.

import { round } from "./belief";
import type { BeliefUpdate, GameState } from "./types";

export type Movement =
  | { kind: "direct"; at: number; update: BeliefUpdate }
  | {
      kind: "renormalised";
      at: number;
      day: number;
      /** Change in the displayed probability. */
      delta: number;
      /** What moved the row: the largest update elsewhere in it, or a change at the table. */
      because: string;
    };

/** The displayed value of one cell after log entry `at`, or undefined when the row did not exist. */
export function cellAt(state: GameState, mind: number, about: number, at: number): number | undefined {
  return state.history[at]?.[mind]?.[about];
}

/** Why a row moved at `at` when the cell itself had no update. */
export function renormalisationCause(state: GameState, mind: number, at: number): string {
  const name = (id: number) => (id === 0 ? "you" : state.players[id].name);
  const e = state.log[at];
  if (e?.kind === "tally" && e.eliminated !== null) return `after ${name(e.eliminated)} left the table`;
  if (e?.kind === "dawn" && e.killed !== null) return `after ${name(e.killed)} left the table`;
  const inRow = state.updates.filter((u) => u.mind === mind && u.at === at);
  if (inRow.length) {
    const big = inRow.reduce((a, b) => (Math.abs(b.delta) > Math.abs(a.delta) ? b : a));
    const sign = big.delta > 0 ? "+" : "−";
    return `after ${name(big.about)} ${sign}${Math.abs(big.delta).toFixed(2)} (${big.signal})`;
  }
  return "after the row was rescaled";
}

/**
 * Every change to one cell up to `upTo`, oldest first: direct updates, and
 * renormalisations wherever the displayed value moved without one.
 */
export function movements(state: GameState, mind: number, about: number, upTo: number): Movement[] {
  const direct = state.updates.filter((u) => u.mind === mind && u.about === about && u.at <= upTo);
  const directAt = new Set(direct.map((u) => u.at));
  const out: Movement[] = direct.map((u) => ({ kind: "direct", at: u.at, update: u }));
  for (let at = 1; at <= upTo && at < state.history.length; at++) {
    if (directAt.has(at)) continue;
    const prev = cellAt(state, mind, about, at - 1);
    const cur = cellAt(state, mind, about, at);
    if (prev === undefined || cur === undefined) continue;
    const delta = round(cur - prev);
    if (Math.abs(delta) < 0.005) continue;
    const day = state.log[at]?.day ?? state.day;
    out.push({ kind: "renormalised", at, day, delta, because: renormalisationCause(state, mind, at) });
  }
  return out.sort((a, b) => a.at - b.at);
}

/** The displayed change of a cell across one log entry, when it had no update of its own. */
export function renormalisedStep(state: GameState, mind: number, about: number, at: number): number | null {
  if (at <= 0) return null;
  if (state.updates.some((u) => u.mind === mind && u.about === about && u.at === at)) return null;
  const prev = cellAt(state, mind, about, at - 1);
  const cur = cellAt(state, mind, about, at);
  if (prev === undefined || cur === undefined) return null;
  const delta = round(cur - prev);
  return Math.abs(delta) < 0.005 ? null : delta;
}
