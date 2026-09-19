// Belief arithmetic. Every change goes through `apply`, which records the
// signal, probability, threshold, weight, factors and delta, so the board can
// always answer "why".

import { LOG_ODDS_MAX, LOG_ODDS_MIN, MIN_CREDIBILITY } from "./personality";
import type { BeliefUpdate, Factor, Mind, Player } from "./types";

export const sigmoid = (x: number): number => 1 / (1 + Math.exp(-x));
export const logit = (p: number): number => Math.log(p / (1 - p));

export const clampLogOdds = (x: number): number => Math.min(LOG_ODDS_MAX, Math.max(LOG_ODDS_MIN, x));

export const round = (x: number, places = 3): number => {
  const k = 10 ** places;
  return Math.round(x * k) / k;
};

export interface Pending {
  mind: Mind;
  about: number;
  by: number;
  signal: string;
  p: number;
  threshold: number;
  weight: number;
  factors: Factor[];
  delta: number;
}

/**
 * Applies one update to a mind and returns its record. A zero delta is not
 * recorded: below-threshold signals leave no trace because nothing happened.
 */
export function apply(updates: BeliefUpdate[], at: number, day: number, u: Pending): void {
  const delta = round(u.delta);
  if (delta === 0 || !Number.isFinite(delta)) return;
  const before = u.mind.logOdds[u.about];
  const after = clampLogOdds(before + delta);
  u.mind.logOdds[u.about] = after;
  updates.push({
    at,
    day,
    mind: u.mind.id,
    about: u.about,
    by: u.by,
    signal: u.signal,
    p: round(u.p),
    threshold: u.threshold,
    weight: u.weight,
    factors: u.factors.map((f) => ({ name: f.name, value: round(f.value) })),
    delta: round(after - before),
    after: round(after),
  });
}

/** Sets a belief outright (revealed roles, seer results). */
export function fix(updates: BeliefUpdate[], at: number, day: number, mind: Mind, about: number, wolf: boolean, signal: string, by = -1): void {
  const target = wolf ? LOG_ODDS_MAX : LOG_ODDS_MIN;
  const before = mind.logOdds[about];
  if (before === target) return;
  mind.logOdds[about] = target;
  updates.push({
    at,
    day,
    mind: mind.id,
    about,
    by,
    signal,
    p: 1,
    threshold: 1,
    weight: 0,
    factors: [],
    delta: round(target - before),
    after: target,
  });
}

/** How much a listener discounts what a speaker says: 1 minus suspicion, floored. */
export function credibility(mind: Mind, speaker: number, players: Player[]): number {
  if (speaker === mind.id || speaker < 0) return 1;
  const p = normalised(mind, players)[speaker] ?? 0;
  return Math.max(MIN_CREDIBILITY, 1 - p);
}

/** Wolves still hidden: total wolves minus those revealed dead. */
export function hiddenWolves(players: Player[]): number {
  return players.filter((p) => p.role === "wolf" && p.alive).length;
}

/** No displayed belief exceeds this; certainty comes only from a revealed role. */
export const DISPLAY_CAP = 0.99;

/**
 * The common log-odds offset that makes a mind's row sum to the number of
 * hidden wolves: the c with sum_i min(CAP, sigmoid(l_i + c)) = wolves over
 * the living others. A shift, not a scale, so differences between cells stay
 * exactly what the evidence made them; found by bisection, the sum being
 * monotone in c.
 */
export function rowOffset(mind: Mind, players: Player[]): number {
  const living = players.filter((p) => p.alive && p.id !== mind.id).map((p) => p.id);
  if (living.length === 0) return 0;
  const target = Math.min(hiddenWolves(players), living.length * DISPLAY_CAP);
  const sum = (c: number): number => living.reduce((s, id) => s + Math.min(DISPLAY_CAP, sigmoid(mind.logOdds[id] + c)), 0);
  let lo = -40;
  let hi = 40;
  if (sum(lo) >= target) return lo;
  if (sum(hi) <= target) return hi;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (sum(mid) < target) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/**
 * Displayed beliefs: sigmoid of each living other's log-odds plus the row's
 * common offset, so the row sums to the number of hidden wolves and no cell
 * exceeds DISPLAY_CAP. Raising one cell therefore lowers the rest of the row;
 * `movements` in explain.ts reports that as a renormalisation.
 */
export function normalised(mind: Mind, players: Player[]): number[] {
  const out = new Array<number>(players.length).fill(0);
  const living = players.filter((p) => p.alive && p.id !== mind.id).map((p) => p.id);
  if (living.length === 0) return out;
  const c = rowOffset(mind, players);
  for (const id of living) out[id] = round(Math.min(DISPLAY_CAP, sigmoid(mind.logOdds[id] + c)));
  return out;
}

/** Mean belief in `about` across living AI minds other than `about`. */
export function standing(minds: Record<number, Mind>, players: Player[], about: number): number {
  let sum = 0;
  let n = 0;
  for (const mind of Object.values(minds)) {
    if (mind.id === about) continue;
    if (!players[mind.id].alive) continue;
    sum += normalised(mind, players)[about];
    n++;
  }
  return n ? round(sum / n) : 0;
}

/**
 * The room's mean belief in each player across living AI minds, excluding
 * one mind and, for each player, that player's own row.
 */
export function roomMean(minds: Record<number, Mind>, players: Player[], except: number): number[] {
  const sums = new Array<number>(players.length).fill(0);
  const counts = new Array<number>(players.length).fill(0);
  for (const mind of Object.values(minds)) {
    if (mind.id === except || !players[mind.id].alive) continue;
    const b = normalised(mind, players);
    for (let i = 0; i < b.length; i++) {
      if (i === mind.id) continue;
      sums[i] += b[i];
      counts[i] += 1;
    }
  }
  return sums.map((s, i) => (counts[i] ? s / counts[i] : 0));
}

/** Uniform prior: wolves among the others. */
export function priorLogOdds(playerCount: number, wolves: number): number {
  const p = wolves / (playerCount - 1);
  return round(logit(p));
}
