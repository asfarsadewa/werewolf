// Compiles what the log says into the small, exact strings the judge sees and
// the facts a villager can cite. No model involved; everything here is public
// information any player at the table would know.

import { THRESHOLDS } from "./personality";
import type { GameState, LogEntry, TargetFact } from "./types";

const ROLE_WORD = { wolf: "a wolf", seer: "the seer", villager: "a villager" } as const;

type Message = Extract<LogEntry, { kind: "message" }>;

export function messages(state: GameState): Message[] {
  return state.log.filter((e): e is Message => e.kind === "message");
}

export function name(state: GameState, id: number | null | undefined): string {
  return id === null || id === undefined || id < 0 ? "nobody" : state.players[id].name;
}

/** Public facts, chronological, trimmed to the most recent few. */
export function publicFacts(state: GameState, limit = 8): string[] {
  const out: string[] = [];
  for (const e of state.log) {
    if (e.kind === "dawn" && e.day > 1) {
      out.push(e.killed === null ? `Night ${e.day - 1}: nobody died.` : `Night ${e.day - 1}: ${name(state, e.killed)} was killed.`);
    } else if (e.kind === "tally") {
      const parts = Object.entries(e.counts)
        .filter(([, n]) => n > 0)
        .sort((a, b) => b[1] - a[1])
        .map(([id, n]) => `${name(state, Number(id))} ${n}`)
        .join(", ");
      if (e.eliminated === null) out.push(`Day ${e.day} vote: ${parts || "no votes"}; nobody was eliminated.`);
      else out.push(`Day ${e.day} vote: ${parts}; ${name(state, e.eliminated)} was eliminated and was ${ROLE_WORD[e.role ?? "villager"]}.`);
    }
  }
  for (const c of state.claims) out.push(`${name(state, c.claimant)} claimed to be the seer on day ${c.day}.`);
  for (const r of state.claimedResults) {
    out.push(`${name(state, r.claimant)} said ${name(state, r.target)} is ${r.wolf ? "a wolf" : "not a wolf"} (day ${r.day}).`);
  }
  const recent = out.slice(-limit);
  return [`Day ${state.day}.`, ...recent];
}

/** What the speaker said before this message, most recent last. */
export function earlierStatements(state: GameState, speaker: number, before: number, limit = 5): string[] {
  const out: string[] = [];
  for (let i = 0; i < before && i < state.log.length; i++) {
    const e = state.log[i];
    if (e.kind === "message" && e.speaker === speaker) out.push(`Day ${e.day}: ${e.text}`);
  }
  return out.slice(-limit);
}

/** The last few things anyone said before this message. */
export function recentTalk(state: GameState, before: number, limit = 6): string[] {
  const out: string[] = [];
  for (let i = 0; i < before && i < state.log.length; i++) {
    const e = state.log[i];
    if (e.kind === "message") out.push(`${name(state, e.speaker)}: ${e.text}`);
  }
  return out.slice(-limit);
}

function accusedIn(m: Message, target: number, names: readonly string[]): boolean {
  const ms = m.measurements;
  if (ms) {
    const t = targetOf(m, ms.choices.target, names);
    if (t !== target) return false;
    return (
      ms.nouls.accuses_with_evidence >= THRESHOLDS.accuses_with_evidence ||
      ms.nouls.accuses_without_evidence >= THRESHOLDS.accuses_without_evidence
    );
  }
  return m.target === target && (m.intent === "accuse_evidence" || m.intent === "accuse_bare");
}

/** Resolves the judge's target Choice to a player id, or null. */
export function targetOf(_m: Message, choice: { choice: string; probabilities: Record<string, number> }, names?: readonly string[]): number | null {
  const n = choice.choice;
  if (n === "nobody") return null;
  const p = choice.probabilities[n] ?? 0;
  if (p < THRESHOLDS.target) return null;
  if (names) {
    const i = names.indexOf(n);
    return i >= 0 ? i : null;
  }
  return null;
}

/** Accusations made against `speaker` today, as "Name: text". */
export function accusationsAgainst(state: GameState, speaker: number, before: number, limit = 4): string[] {
  const out: string[] = [];
  const names = state.players.map((p) => p.name);
  for (let i = 0; i < before && i < state.log.length; i++) {
    const e = state.log[i];
    if (e.kind !== "message" || e.day !== state.day || e.speaker === speaker) continue;
    const t = e.measurements ? targetOf(e, e.measurements.choices.target, names) : (e.target ?? null);
    if (t !== speaker) continue;
    if (accusedIn(e, speaker, names)) out.push(`${name(state, e.speaker)}: ${e.text}`);
  }
  return out.slice(-limit);
}

/** Whether a question put to `id` is still waiting for an answer. */
export function hasOpenQuestion(state: GameState, id: number): boolean {
  const mind = state.minds[id];
  if (mind) return mind.asked !== null;
  // The human has no mind: look for a question aimed at them since they last spoke today.
  const names = state.players.map((p) => p.name);
  let open = false;
  for (const e of state.log) {
    if (e.kind !== "message" || e.day !== state.day) continue;
    if (e.speaker === id) {
      open = false;
      continue;
    }
    // An authored question counts as one whatever the judge made of it; a
    // measured message counts when the question signal crossed its threshold.
    if (e.intent === "question" && e.target === id) open = true;
    else if (e.measurements) {
      const t = targetOf(e, e.measurements.choices.target, names);
      if (t === id && e.measurements.nouls.asks_question >= THRESHOLDS.asks_question) open = true;
    }
  }
  return open;
}

/** The open question put to `speaker`, if any. */
export function questionFor(state: GameState, speaker: number): string | null {
  const mind = state.minds[speaker];
  if (!mind?.asked) return null;
  const e = state.log[mind.asked.at];
  return e && e.kind === "message" ? `${name(state, e.speaker)}: ${e.text}` : null;
}

/** Facts a villager can cite against `target`, strongest first. */
export function targetFacts(state: GameState, target: number): TargetFact[] {
  const out: TargetFact[] = [];
  const who = name(state, target);
  const names = state.players.map((p) => p.name);

  // Votes for players later revealed as villagers or the seer.
  for (const e of state.log) {
    if (e.kind !== "vote" || e.voter !== target || e.target === null) continue;
    const victim = state.players[e.target];
    if (victim.alive || victim.role === "wolf") continue;
    const tally = state.log.find((t) => t.kind === "tally" && t.day === e.day && t.eliminated === e.target);
    if (!tally) continue;
    out.push({
      kind: "vote",
      about: target,
      strength: 3,
      text: `${who} voted for ${victim.name} on day ${e.day}; ${victim.name} was ${ROLE_WORD[victim.role]}.`,
    });
    break;
  }

  // Measured behaviour today.
  let contradiction: number | null = null;
  let deflect: number | null = null;
  let bandwagon: number | null = null;
  let spokeToday = false;
  for (const e of state.log) {
    if (e.kind !== "message" || e.speaker !== target) continue;
    if (e.day === state.day) spokeToday = true;
    const ms = e.measurements;
    if (!ms || e.day !== state.day) continue;
    if (ms.nouls.contradicts_own_claim >= THRESHOLDS.contradicts_own_claim) {
      contradiction = Math.max(contradiction ?? 0, ms.nouls.contradicts_own_claim);
    }
    if (ms.nouls.contradicts_fact >= THRESHOLDS.contradicts_fact) {
      contradiction = Math.max(contradiction ?? 0, ms.nouls.contradicts_fact);
    }
    if (ms.nouls.deflects >= THRESHOLDS.deflects) deflect = Math.max(deflect ?? 0, ms.nouls.deflects);
    if (ms.nouls.bandwagon >= THRESHOLDS.bandwagon) bandwagon = Math.max(bandwagon ?? 0, ms.nouls.bandwagon);
  }
  if (contradiction !== null) {
    out.push({ kind: "contradiction", about: target, strength: 3, text: `${who} changed their story today: contradiction ${contradiction.toFixed(2)}.` });
  }
  if (deflect !== null) {
    out.push({ kind: "deflect", about: target, strength: 2, text: `${who} dodged a direct question today: deflects ${deflect.toFixed(2)}.` });
  }
  if (bandwagon !== null) {
    out.push({ kind: "bandwagon", about: target, strength: 1, text: `${who} repeated an accusation without adding anything: bandwagon ${bandwagon.toFixed(2)}.` });
  }

  // Rival seer claims.
  const claimants = state.claims.map((c) => c.claimant).filter((c) => state.players[c].alive);
  if (claimants.includes(target) && claimants.length > 1) {
    const other = claimants.find((c) => c !== target)!;
    out.push({ kind: "claim", about: target, strength: 2, text: `${who} claimed to be the seer; so did ${names[other]}.` });
  }

  // Silence, once the table has had a round.
  const todayMessages = messages(state).filter((m) => m.day === state.day).length;
  if (!spokeToday && todayMessages >= 4) {
    out.push({ kind: "quiet", about: target, strength: 1, text: `${who} has said nothing today.` });
  }

  return out.sort((a, b) => b.strength - a.strength);
}
