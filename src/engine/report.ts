// The end-of-game report: what the numbers say about how you played.

import { normalised } from "./belief";
import { standingStep } from "./explain";
import { messages } from "./facts";
import { THRESHOLDS } from "./personality";
import { HUMAN } from "./roster";
import type { GameState, Role, Winner } from "./types";

export interface Report {
  winner: Winner;
  humanRole: Role;
  humanWon: boolean;
  humanSurvived: boolean;
  days: number;
  wolves: string[];
  seer: string;
  messages: number;
  /** Messages by the human that contradicted an earlier statement. */
  contradictions: number;
  /** Human messages that dodged something pending. */
  deflections: number;
  /** The human message after which the table's mean suspicion of the human rose most; delta in probability. */
  costliest: { text: string; day: number; delta: number } | null;
  /** The human message after which it fell most. */
  best: { text: string; day: number; delta: number } | null;
  /** Living AI minds' final belief in the human, by name. */
  finalStanding: { name: string; belief: number }[];
  /** The villager whose belief in the human was highest on average. */
  leastTrusting: { name: string; mean: number } | null;
  mostTrusting: { name: string; mean: number } | null;
  /** Human votes that hit a wolf, out of votes cast. */
  votes: { cast: number; onWolves: number };
  /** Questions the human never answered. */
  requestsMade: number;
}

export function buildReport(state: GameState): Report {
  const human = state.players[HUMAN];
  const winner = state.winner ?? "wolves";
  const humanWon = human.role === "wolf" ? winner === "wolves" : winner === "village";
  const mine = messages(state).filter((m) => m.speaker === HUMAN && m.measurements);
  const contradictions = mine.filter((m) => m.measurements!.nouls.contradicts_own_claim >= THRESHOLDS.contradicts_own_claim || m.measurements!.nouls.contradicts_fact >= THRESHOLDS.contradicts_fact).length;
  const deflections = mine.filter((m) => m.measurements!.nouls.deflects >= THRESHOLDS.deflects).length;

  // How the table's mean suspicion of the human moved after each of their messages, in probability.
  let costliest: Report["costliest"] = null;
  let best: Report["best"] = null;
  for (let at = 1; at < state.log.length; at++) {
    const e = state.log[at];
    if (e.kind !== "message" || e.speaker !== HUMAN) continue;
    const step = standingStep(state, HUMAN, at);
    if (step === null) continue;
    const delta = Math.round(step * 100) / 100;
    if (delta > 0 && (!costliest || delta > costliest.delta)) costliest = { text: e.text, day: e.day, delta };
    if (delta < 0 && (!best || delta < best.delta)) best = { text: e.text, day: e.day, delta };
  }

  const finalStanding = Object.values(state.minds)
    .filter((m) => state.players[m.id].alive)
    .map((m) => ({ name: state.players[m.id].name, belief: normalised(m, state.players)[HUMAN] }));

  // Mean belief in the human over the history, per mind.
  const means: { name: string; mean: number }[] = [];
  for (const mind of Object.values(state.minds)) {
    let sum = 0;
    let n = 0;
    for (const b of state.history) {
      const row = b[mind.id];
      if (!row) continue;
      sum += row[HUMAN];
      n++;
    }
    if (n) means.push({ name: state.players[mind.id].name, mean: Math.round((sum / n) * 1000) / 1000 });
  }
  means.sort((a, b) => b.mean - a.mean);

  const votes = state.log.filter((e) => e.kind === "vote" && e.voter === HUMAN && e.target !== null);
  const onWolves = votes.filter((e) => e.kind === "vote" && e.target !== null && state.players[e.target].role === "wolf").length;

  return {
    winner,
    humanRole: human.role,
    humanWon,
    humanSurvived: human.alive,
    days: state.day,
    wolves: state.players.filter((p) => p.role === "wolf").map((p) => p.name),
    seer: state.players.find((p) => p.role === "seer")!.name,
    messages: mine.length,
    contradictions,
    deflections,
    costliest,
    best,
    finalStanding,
    leastTrusting: means[0] ?? null,
    mostTrusting: means.length ? means[means.length - 1] : null,
    votes: { cast: votes.length, onWolves },
    requestsMade: mine.filter((m) => m.measurements!.nouls.asks_question >= THRESHOLDS.asks_question).length,
  };
}
