// What a villager does on its turn, whom it votes for, whom the wolves kill
// and whom the seer checks. Pure functions of the state and the seed; the only
// thing the model adds is which authored line, out of the candidates, is said.

import { normalised, roomMean, standing } from "./belief";
import { hasOpenQuestion, messages, openQuestionFor, targetFacts } from "./facts";
import type { Intent, LineSpec, Need, Personality, Tone } from "./lines/types";
import { PERSONALITY } from "./personality";
import { scoped, type Rng } from "./rng";
import type { GameState, Player, TargetFact } from "./types";

export interface Plan {
  speaker: number;
  intent: Intent;
  tone: Tone;
  target: number | null;
  fact?: TargetFact;
  candidates: LineSpec[];
  /** Whether the spoken line is sent to the judge afterwards. */
  measured: boolean;
  /** Wolves run their candidates through the mirror. */
  mirror: boolean;
}

const UNMEASURED: ReadonlySet<Intent> = new Set(["greet", "mourn", "vote", "rebuke"]);
const NO_TARGET: ReadonlySet<Intent> = new Set(["defend_self", "deflect", "chatter", "claim_seer", "greet", "mourn"]);

export function livingOthers(players: Player[], self: number): number[] {
  return players.filter((p) => p.alive && p.id !== self).map((p) => p.id);
}

export function wolfPartner(players: Player[], self: number): number | null {
  const other = players.find((p) => p.role === "wolf" && p.id !== self);
  return other ? other.id : null;
}

/** Mean normalised belief in each player across living AI minds, excluding one mind. */
export function roomBelief(state: GameState, except: number): number[] {
  return roomMean(state.minds, state.players, except);
}

function spokeToday(state: GameState, id: number): boolean {
  return messages(state).some((m) => m.day === state.day && m.speaker === id);
}

function messageCount(state: GameState, id: number): number {
  return messages(state).filter((m) => m.speaker === id).length;
}

export function renderLine(text: string, targetName: string | null): string {
  if (!text.includes("{target}")) return text;
  return text.replace("{target}", targetName ?? "You");
}

interface Context {
  accused: boolean;
  asked: boolean;
  claimExists: boolean;
  deathToday: boolean;
  pastVote: boolean;
  fact?: TargetFact;
}

function satisfied(need: Need, ctx: Context): boolean {
  switch (need) {
    case "accused":
      return ctx.accused;
    case "asked":
      return ctx.asked;
    case "claim_exists":
      return ctx.claimExists;
    case "death_today":
      return ctx.deathToday;
    case "past_vote":
      return ctx.pastVote;
    case "fact:any":
      return ctx.fact !== undefined;
    default: {
      const kind = need.slice("fact:".length);
      return ctx.fact !== undefined && ctx.fact.kind === kind;
    }
  }
}

function recentLineIds(state: GameState, speaker: number, count = 8): Set<string> {
  const ids = new Set<string>();
  const mine = messages(state).filter((m) => m.speaker === speaker && m.lineId);
  for (const m of mine.slice(-count)) ids.add(m.lineId!);
  return ids;
}

/** Candidate lines for one intent and tone, falling back to calm, then any tone. */
export function candidateLines(
  library: readonly LineSpec[],
  who: Personality,
  intent: Intent,
  tone: Tone,
  ctx: Context,
  exclude: ReadonlySet<string>,
  rng: Rng,
  max = 8,
): LineSpec[] {
  const fits = (l: LineSpec): boolean =>
    l.who === who && l.intent === intent && (l.needs ?? []).every((n) => satisfied(n, ctx)) && !exclude.has(l.id);
  const all = library.filter(fits);
  const tones: Tone[] = tone === "calm" ? ["calm"] : [tone, "calm"];
  let pool: LineSpec[] = [];
  for (const t of tones) {
    pool = all.filter((l) => l.tone === t);
    if (pool.length) break;
  }
  if (!pool.length) pool = all;
  if (!pool.length) pool = library.filter((l) => l.who === who && l.intent === intent && (l.needs ?? []).every((n) => satisfied(n, ctx)));
  return rng.shuffle(pool).slice(0, max);
}

function pickTone(state: GameState, speaker: number, intent: Intent, targetBelief: number, accused: boolean, cornered: boolean, rng: Rng): Tone {
  const spec = PERSONALITY[state.minds[speaker].personality];
  let tone: Tone = spec.tones.base;
  if (accused) tone = spec.tones.accused;
  if (cornered) tone = spec.tones.cornered;
  if ((intent === "accuse_evidence" || intent === "accuse_bare" || intent === "reveal_wolf") && targetBelief >= 0.6) tone = spec.tones.accusing;
  if (intent === "greet" || intent === "chatter" || intent === "question") tone = accused ? spec.tones.accused : spec.tones.base;
  if (intent === "mourn") tone = spec.tones.base === "aggressive" ? "calm" : spec.tones.base;
  if (intent === "rebuke") tone = spec.tones.accusing;
  // A little variety: one time in five, fall back to the personality's base tone.
  if (tone !== spec.tones.base && rng.next() < 0.2) tone = spec.tones.base;
  return tone;
}

export function planTurn(state: GameState, speaker: number, library: readonly LineSpec[], event?: "greet" | "mourn"): Plan {
  const mind = state.minds[speaker];
  if (!mind) throw new Error(`player ${speaker} has no mind`);
  const spec = PERSONALITY[mind.personality];
  const players = state.players;
  const me = players[speaker];
  const rng = scoped(state.seed, "turn", state.day, state.log.length, speaker);
  const beliefs = normalised(mind, players);
  const others = livingOthers(players, speaker);
  const isWolf = me.role === "wolf";
  const partner = isWolf ? wolfPartner(players, speaker) : null;
  const myStanding = standing(state.minds, players, speaker);
  const accused = mind.accusedToday.length > 0;
  const asked = openQuestionFor(state, speaker) !== null;
  const otherClaims = state.claims.filter((c) => c.claimant !== speaker && players[c.claimant].alive);
  const dawn = state.log.find((e) => e.kind === "dawn" && e.day === state.day);
  const ctx: Context = {
    accused,
    asked,
    claimExists: otherClaims.length > 0,
    deathToday: dawn !== undefined && dawn.kind === "dawn" && dawn.killed !== null,
    pastVote: state.log.some((e) => e.kind === "tally"),
  };
  const cornered = myStanding >= 0.5;

  let intent: Intent;
  let target: number | null = null;
  let fact: TargetFact | undefined;
  let extraIntents: Intent[] = [];

  const suspectAmong = (ids: number[]): number | null => {
    let best: number | null = null;
    for (const id of ids) if (best === null || beliefs[id] > beliefs[best]) best = id;
    return best;
  };

  if (event) {
    intent = event;
  } else if (state.rebuke && players[0].alive) {
    intent = "rebuke";
    target = 0;
  } else if (me.role === "seer" && otherClaims.length && !mind.claimed) {
    intent = "counter_claim";
    target = otherClaims[0].claimant;
  } else if (me.role === "seer" && mind.claimed && mind.unrevealed.length) {
    target = mind.unrevealed[0];
    intent = mind.checks[target] ? "reveal_wolf" : "reveal_clear";
  } else if (me.role === "seer" && !mind.claimed && (Object.values(mind.checks).some(Boolean) || cornered)) {
    intent = "claim_seer";
  } else if (accused && spec.weights.grudge >= 0.5 && rng.next() < 0.6) {
    intent = "accuse_bare";
    target = mind.accusedToday[mind.accusedToday.length - 1];
  } else if (accused) {
    intent = "defend_self";
    if (isWolf) extraIntents = ["deflect"];
  } else if (asked) {
    intent = "answer";
    if (isWolf) extraIntents = ["deflect"];
  } else {
    const pool = others.filter((id) => id !== partner);
    let suspect = suspectAmong(pool);
    let suspicion = suspect === null ? 0 : beliefs[suspect];
    if (isWolf && suspect !== null) {
      // Wolves ride the room: accuse whoever the table already suspects.
      const room = roomBelief(state, speaker);
      let best = suspect;
      for (const id of pool) if (room[id] > room[best]) best = id;
      if (room[best] >= 0.35) {
        suspect = best;
        suspicion = Math.max(beliefs[best], room[best]);
      }
    }
    if (suspect !== null && suspicion >= spec.accuseAt) {
      target = suspect;
      const facts = targetFacts(state, suspect);
      if (facts.length) {
        intent = "accuse_evidence";
        fact = facts[0];
      } else {
        intent = "accuse_bare";
      }
    } else {
      // Vouch for someone under fire whom this mind trusts.
      let underFire: number | null = null;
      let fireLevel = 0;
      for (const id of pool) {
        const s = standing(state.minds, players, id);
        if (s > fireLevel) {
          fireLevel = s;
          underFire = id;
        }
      }
      if (underFire !== null && fireLevel >= 0.45 && beliefs[underFire] <= spec.defendAt) {
        intent = "defend_other";
        target = underFire;
      } else {
        // Question the quiet, but never pile a second question on someone still owed an answer.
        const open = (id: number) => hasOpenQuestion(state, id);
        const quiet = others.filter((id) => !spokeToday(state, id) && !open(id));
        const askable = others.filter((id) => !open(id));
        let least: number | null = null;
        for (const id of quiet.length ? quiet : askable) if (least === null || messageCount(state, id) < messageCount(state, least)) least = id;
        if (least !== null && (quiet.length ? rng.next() < 0.8 : rng.next() < 0.35)) {
          intent = "question";
          target = least;
        } else {
          intent = "chatter";
        }
      }
    }
  }

  if (NO_TARGET.has(intent)) target = null;
  if (intent === "accuse_evidence" && fact) ctx.fact = fact;
  if (intent === "question" && target !== null && !spokeToday(state, target)) {
    ctx.fact = { kind: "quiet", about: target, strength: 1, text: `${players[target].name} has said nothing today.` };
  }

  const tone = pickTone(state, speaker, intent, target === null ? 0 : beliefs[target], accused, cornered, rng);
  const exclude = recentLineIds(state, speaker);
  let candidates = candidateLines(library, mind.personality, intent, tone, ctx, exclude, rng);
  for (const extra of extraIntents) {
    const more = candidateLines(library, mind.personality, extra, tone, ctx, exclude, rng, 4);
    candidates = rng.shuffle([...candidates.slice(0, 4), ...more]).slice(0, 8);
  }
  if (!candidates.length && intent === "accuse_evidence") {
    // No line cites this fact kind; accuse without it.
    intent = "accuse_bare";
    fact = undefined;
    candidates = candidateLines(library, mind.personality, intent, tone, ctx, exclude, rng);
  }
  if (!candidates.length) {
    intent = "chatter";
    target = null;
    fact = undefined;
    candidates = candidateLines(library, mind.personality, intent, tone, ctx, exclude, rng);
  }
  if (event) candidates = candidates.slice(0, 1);

  return {
    speaker,
    intent,
    tone,
    target,
    fact,
    candidates,
    measured: !UNMEASURED.has(intent),
    mirror: isWolf && !event && candidates.length > 1,
  };
}

/** The line a villager says when casting its vote. */
export function voteLine(state: GameState, voter: number, target: number, library: readonly LineSpec[]): LineSpec | null {
  const mind = state.minds[voter];
  const rng = scoped(state.seed, "voteline", state.day, voter);
  const spec = PERSONALITY[mind.personality];
  const belief = normalised(mind, state.players)[target];
  const tone: Tone = belief >= 0.6 ? spec.tones.accusing : spec.tones.base;
  const ctx: Context = { accused: false, asked: false, claimExists: false, deathToday: false, pastVote: true };
  const lines = candidateLines(library, mind.personality, "vote", tone, ctx, new Set(), rng, 1);
  return lines[0] ?? null;
}

/** AI votes, in seeded order, each seeing the votes already cast. */
export function aiVotes(state: GameState): { voter: number; target: number | null }[] {
  const rng = scoped(state.seed, "votes", state.day);
  const order = rng.shuffle(Object.keys(state.minds).map(Number).filter((id) => state.players[id].alive));
  const cast: Record<number, number> = {};
  const out: { voter: number; target: number | null }[] = [];
  for (const voter of order) {
    const mind = state.minds[voter];
    const spec = PERSONALITY[mind.personality];
    const me = state.players[voter];
    const partner = me.role === "wolf" ? wolfPartner(state.players, voter) : null;
    const beliefs = normalised(mind, state.players);
    const pool = livingOthers(state.players, voter).filter((id) => id !== partner);
    let target: number | null = null;
    if (me.role === "wolf") {
      const room = roomBelief(state, voter);
      for (const id of pool) if (target === null || room[id] > room[target]) target = id;
    } else {
      for (const id of pool) if (target === null || beliefs[id] > beliefs[target]) target = id;
      if (spec.weights.herd > 0 && Object.keys(cast).length) {
        // The herd votes with the current plurality unless its own suspect is clear.
        let lead: number | null = null;
        for (const [id, n] of Object.entries(cast)) if (lead === null || n > cast[lead]) lead = Number(id);
        if (lead !== null && lead !== voter && target !== null && beliefs[target] < 0.6) target = lead;
      }
    }
    if (target !== null) cast[target] = (cast[target] ?? 0) + 1;
    out.push({ voter, target });
  }
  return out;
}

/** Whom the wolves kill: the player whose beliefs are most correct, with a nose for the human. */
export function wolfKill(state: GameState): number | null {
  const players = state.players;
  const wolves = players.filter((p) => p.role === "wolf" && p.alive).map((p) => p.id);
  const prey = players.filter((p) => p.alive && p.role !== "wolf").map((p) => p.id);
  if (!prey.length) return null;
  const rng = scoped(state.seed, "kill", state.day);
  let best: number | null = null;
  let bestScore = -Infinity;
  for (const id of prey) {
    let score = 0;
    const mind = state.minds[id];
    if (mind) {
      const b = normalised(mind, players);
      for (const w of wolves) score += b[w];
      if (mind.claimed) score += 1.2;
    } else {
      // The human: dangerous when they pointed at a wolf today.
      score = 0.45;
      for (const m of messages(state)) {
        if (m.speaker !== id || m.day !== state.day || !m.measurements) continue;
        const t = m.measurements.choices.target;
        const idx = players.findIndex((p) => p.name === t.choice);
        if (idx >= 0 && wolves.includes(idx) && t.probabilities[t.choice] >= 0.4) {
          const ev = m.measurements.nouls.accuses_with_evidence;
          const bare = m.measurements.nouls.accuses_without_evidence;
          if (ev >= 0.7) score += 0.9;
          else if (bare >= 0.7) score += 0.5;
        }
      }
    }
    score += rng.next() * 0.3;
    if (score > bestScore) {
      bestScore = score;
      best = id;
    }
  }
  return best;
}

/** Whom the AI seer checks: the most suspicious unchecked living player. */
export function seerCheck(state: GameState, seer: number): number | null {
  const mind = state.minds[seer];
  if (!mind) return null;
  const beliefs = normalised(mind, state.players);
  const pool = livingOthers(state.players, seer).filter((id) => mind.checks[id] === undefined);
  let best: number | null = null;
  for (const id of pool) if (best === null || beliefs[id] > beliefs[best]) best = id;
  return best;
}
