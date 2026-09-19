// Explains what the board shows. A cell moves for one of two reasons: a
// belief update aimed at it, recorded in `state.updates`, or the row being
// renormalised after some other cell moved (or the table changed), which
// leaves no update behind. This module reads both from the history so the
// board can answer "why" for every change, as D10 requires.
//
// Units: everything the board displays is probability, and so are the steps
// here (`before`, `after`, `standingStep`). The updates inside a step carry
// the log-odds mechanics that produced it.

import { round } from "./belief";
import type { BeliefUpdate, GameState } from "./types";

/** One change to one cell, at one log entry. */
export interface CellStep {
  at: number;
  day: number;
  /** Who caused it: a speaker, -1 for a rule, or null for a renormalisation. */
  by: number | null;
  /** Displayed probability before and after this entry. */
  before: number;
  after: number;
  /** The updates aimed at this cell at this entry; empty for a renormalisation. */
  updates: BeliefUpdate[];
  renormalised: boolean;
  /** For a renormalisation: what moved the row. */
  because?: string;
}

/** The displayed value of one cell after log entry `at`, or undefined when the row did not exist. */
export function cellAt(state: GameState, mind: number, about: number, at: number): number | undefined {
  return state.history[at]?.[mind]?.[about];
}

function playerName(state: GameState, id: number): string {
  return id === 0 ? "you" : state.players[id].name;
}

/** Why a row moved at `at` when the cell itself had no update. */
export function renormalisationCause(state: GameState, mind: number, at: number): string {
  const e = state.log[at];
  if (e?.kind === "tally" && e.eliminated !== null) return `after ${playerName(state, e.eliminated)} left the table`;
  if (e?.kind === "dawn" && e.killed !== null) return `after ${playerName(state, e.killed)} left the table`;
  const inRow = state.updates.filter((u) => u.mind === mind && u.at === at);
  if (inRow.length) {
    const big = inRow.reduce((a, b) => (Math.abs(b.delta) > Math.abs(a.delta) ? b : a));
    const before = cellAt(state, mind, big.about, at - 1);
    const after = cellAt(state, mind, big.about, at);
    const move = before !== undefined && after !== undefined ? ` ${fmt(before)} → ${fmt(after)}` : "";
    return `after ${playerName(state, big.about)}${move} (${big.signal})`;
  }
  return "after the row was rescaled";
}

function fmt(p: number): string {
  if (p >= 0.995) return ".99";
  if (p <= 0.005) return ".00";
  return p.toFixed(2).slice(1);
}

/**
 * Every change to one cell up to `upTo`, oldest first: a step per log entry
 * where the cell had updates aimed at it, or where its displayed value moved
 * without one (a renormalisation).
 */
export function steps(state: GameState, mind: number, about: number, upTo: number): CellStep[] {
  const byAt = new Map<number, BeliefUpdate[]>();
  for (const u of state.updates) {
    if (u.mind !== mind || u.about !== about || u.at > upTo) continue;
    byAt.set(u.at, [...(byAt.get(u.at) ?? []), u]);
  }
  const out: CellStep[] = [];
  for (let at = 0; at <= upTo && at < state.history.length; at++) {
    const cur = cellAt(state, mind, about, at);
    const prev = at > 0 ? cellAt(state, mind, about, at - 1) : undefined;
    if (cur === undefined) continue;
    const updates = byAt.get(at) ?? [];
    const day = state.log[at]?.day ?? state.day;
    if (updates.length) {
      out.push({ at, day, by: updates[0].by, before: prev ?? cur, after: cur, updates, renormalised: false });
      continue;
    }
    if (prev === undefined || Math.abs(round(cur - prev)) < 0.005) continue;
    out.push({ at, day, by: null, before: prev, after: cur, updates: [], renormalised: true, because: renormalisationCause(state, mind, at) });
  }
  return out;
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

/** The displayed change of a cell across one log entry, whatever caused it. */
export function displayedStep(state: GameState, mind: number, about: number, at: number): number | null {
  if (at <= 0) return null;
  const prev = cellAt(state, mind, about, at - 1);
  const cur = cellAt(state, mind, about, at);
  if (prev === undefined || cur === undefined) return null;
  return round(cur - prev);
}

/** Mean displayed suspicion of `about` across the rows present at log entry `at`. */
export function standingAt(state: GameState, about: number, at: number): number | null {
  const board = state.history[at];
  if (!board) return null;
  let sum = 0;
  let n = 0;
  for (const [mind, row] of Object.entries(board)) {
    if (Number(mind) === about) continue;
    sum += row[about];
    n++;
  }
  return n ? sum / n : null;
}

/** How the table's mean suspicion of `about` moved across log entry `at`. */
export function standingStep(state: GameState, about: number, at: number): number | null {
  if (at <= 0) return null;
  const prev = standingAt(state, about, at - 1);
  const cur = standingAt(state, about, at);
  if (prev === null || cur === null) return null;
  return round(cur - prev);
}
