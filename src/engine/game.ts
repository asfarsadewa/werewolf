// The state machine. `createGame` deals from a seed; `reduce` folds one
// action; `nextStep` says what the orchestrator must do. Replaying the same
// seed and actions reproduces every belief.

import { apply, credibility, fix, logit, normalised, priorLogOdds, roomMean, round, standing } from "./belief";
import { messages, targetFacts, targetOf } from "./facts";
import type { LineSpec } from "./lines/types";
import { CLAIM_LIAR_PENALTY, HUMAN_MESSAGES_PER_DAY, PERSONALITY, ROUNDS_PER_DAY, THRESHOLDS } from "./personality";
import { aiVotes, livingOthers, planTurn, renderLine, seerCheck, wolfKill } from "./policy";
import { scoped } from "./rng";
import { HUMAN, SEATS } from "./roster";
import type { Action, Board, GameState, LogEntry, Measurements, Mind, Player, QueueItem, Role, Step, Winner } from "./types";

export const ENGINE_VERSION = 1;
const WOLVES = 2;

export interface GameOptions {
  /** Force the human's role, for tests and the terminal game. */
  humanRole?: Role;
}

function dealRoles(seed: string, opts: GameOptions): Role[] {
  const rng = scoped(seed, "deal");
  const roles: Role[] = ["wolf", "wolf", "seer", "villager", "villager", "villager", "villager", "villager"];
  let dealt = rng.shuffle(roles);
  if (opts.humanRole && dealt[HUMAN] !== opts.humanRole) {
    const j = dealt.indexOf(opts.humanRole);
    [dealt[HUMAN], dealt[j]] = [dealt[j], dealt[HUMAN]];
  }
  dealt = [...dealt];
  return dealt;
}

function newMind(id: number, players: Player[]): Mind {
  const prior = priorLogOdds(players.length, WOLVES);
  return {
    id,
    personality: SEATS[id].personality!,
    logOdds: players.map(() => prior),
    grudges: players.map(() => 0),
    accusedToday: [],
    checks: {},
    claimed: false,
    unrevealed: [],
  };
}

export function board(state: GameState): Board {
  const out: Board = {};
  for (const mind of Object.values(state.minds)) {
    if (!state.players[mind.id].alive) continue;
    out[mind.id] = normalised(mind, state.players);
  }
  return out;
}

function dayQueue(state: GameState, killed: number | null): QueueItem[] {
  const rng = scoped(state.seed, "queue", state.day);
  const living = Object.keys(state.minds)
    .map(Number)
    .filter((id) => state.players[id].alive);
  const queue: QueueItem[] = [];
  if (state.day === 1) {
    for (const id of rng.shuffle(living).slice(0, 3)) queue.push({ speaker: id, event: "greet" });
  } else if (killed !== null) {
    for (const id of rng.shuffle(living).slice(0, 2)) queue.push({ speaker: id, event: "mourn" });
  }
  for (let r = 0; r < ROUNDS_PER_DAY; r++) for (const id of rng.shuffle(living)) queue.push({ speaker: id });
  return queue;
}

export function createGame(seed: string, opts: GameOptions = {}): GameState {
  const roles = dealRoles(seed, opts);
  const players: Player[] = SEATS.map((s) => ({ id: s.id, name: s.name, role: roles[s.id], alive: true, personality: s.personality }));
  const minds: Record<number, Mind> = {};
  for (const p of players) if (p.id !== HUMAN) minds[p.id] = newMind(p.id, players);
  const state: GameState = {
    seed,
    version: ENGINE_VERSION,
    day: 1,
    phase: "day",
    players,
    minds,
    log: [{ kind: "dawn", day: 1, killed: null }],
    updates: [],
    claims: [],
    claimedResults: [],
    queue: [],
    humanMessagesLeft: HUMAN_MESSAGES_PER_DAY,
    rebuke: false,
    votes: {},
    night: null,
    winner: null,
    history: [],
  };
  state.queue = dayQueue(state, null);
  snapshot(state);
  return state;
}

function snapshot(state: GameState): void {
  const b = board(state);
  while (state.history.length < state.log.length) state.history.push(b);
}

export function nextStep(state: GameState): Step {
  if (state.phase === "over") return { kind: "over", winner: state.winner! };
  if (state.phase === "day") {
    if (state.queue.length) return { kind: "ai_turn", speaker: state.queue[0].speaker };
    if (state.humanMessagesLeft > 0 && state.players[HUMAN].alive) return { kind: "human_turn", optional: true };
    return { kind: "vote" };
  }
  if (state.phase === "vote") return { kind: "vote" };
  const needs: ("kill" | "check")[] = [];
  const human = state.players[HUMAN];
  if (human.alive && human.role === "wolf" && state.night?.kill == null) needs.push("kill");
  if (human.alive && human.role === "seer" && state.night?.check == null) needs.push("check");
  return { kind: "night", needs };
}

export class EngineError extends Error {}

function clone<T>(x: T): T {
  return structuredClone(x);
}

function livingWolves(players: Player[]): number {
  return players.filter((p) => p.alive && p.role === "wolf").length;
}

function checkWin(state: GameState): boolean {
  const wolves = livingWolves(state.players);
  const others = state.players.filter((p) => p.alive && p.role !== "wolf").length;
  let winner: Winner | null = null;
  if (wolves === 0) winner = "village";
  else if (wolves >= others) winner = "wolves";
  if (!winner) return false;
  state.winner = winner;
  state.phase = "over";
  state.log.push({ kind: "over", day: state.day, winner });
  return true;
}

/** Adds a message and, if it has measurements, applies them. */
function pushMessage(state: GameState, entry: Extract<LogEntry, { kind: "message" }>): number {
  state.log.push(entry);
  return state.log.length - 1;
}

function revealed(players: Player[], id: number): boolean {
  return !players[id].alive;
}

/** The core: every AI mind updates from one measured message. */
export function applyMeasurements(state: GameState, at: number, m: Measurements): void {
  const e = state.log[at];
  if (!e || e.kind !== "message") throw new EngineError(`log[${at}] is not a message`);
  e.measurements = m;
  const players = state.players;
  const names = players.map((p) => p.name);
  const speaker = e.speaker;
  const day = e.day;
  const target = targetOf(e, m.choices.target, names);
  const validTarget = target !== null && players[target].alive && target !== speaker ? target : null;
  const n = m.nouls;
  const specificity = m.scores.specificity.score / 3;
  const persuasiveness = m.scores.persuasiveness.score / 2;
  const evidence = n.accuses_with_evidence >= THRESHOLDS.accuses_with_evidence;
  const bare = !evidence && n.accuses_without_evidence >= THRESHOLDS.accuses_without_evidence;

  // Bookkeeping that does not depend on personality.
  if (validTarget !== null && (evidence || bare)) {
    const t = state.minds[validTarget];
    if (t) {
      if (!t.accusedToday.includes(speaker)) t.accusedToday.push(speaker);
      t.grudges[speaker] += 1;
    }
  }
  if (speaker === HUMAN) {
    state.rebuke = n.addresses_system >= THRESHOLDS.addresses_system || n.off_topic >= THRESHOLDS.off_topic;
  }

  // Claims.
  let newClaim = false;
  if (n.claims_seer >= THRESHOLDS.claims_seer && !state.claims.some((c) => c.claimant === speaker)) {
    state.claims.push({ claimant: speaker, day, at });
    newClaim = true;
    const mind = state.minds[speaker];
    if (mind) mind.claimed = true;
  }
  const livingClaimants = state.claims.map((c) => c.claimant).filter((c) => players[c].alive);
  let newResult: { target: number; wolf: boolean } | null = null;
  if (n.reveals_night_result >= THRESHOLDS.reveals_night_result && validTarget !== null && m.choices.claimed_result.choice !== "no_result_reported") {
    const wolf = m.choices.claimed_result.choice === "wolf";
    if (!state.claimedResults.some((r) => r.claimant === speaker && r.target === validTarget)) {
      state.claimedResults.push({ claimant: speaker, target: validTarget, wolf, day, at });
      newResult = { target: validTarget, wolf };
      const mind = state.minds[speaker];
      if (mind) mind.unrevealed = mind.unrevealed.filter((id) => id !== validTarget);
    }
  }
  const trustedSeer = livingClaimants.length === 1 && !state.claimedResults.some((r) => r.claimant === livingClaimants[0] && contradicted(state, r)) ? livingClaimants[0] : null;

  for (const mind of Object.values(state.minds)) {
    if (!players[mind.id].alive || mind.id === speaker) continue;
    const w = PERSONALITY[mind.personality].weights;
    const cred = credibility(mind, speaker, players);
    const note = (about: number, signal: keyof typeof THRESHOLDS | string, p: number, threshold: number, weight: number, delta: number, factors: { name: string; value: number }[] = []) =>
      apply(state.updates, at, day, { mind, about, by: speaker, signal, p, threshold, weight, factors, delta });

    // What the speaker said about a target.
    if (validTarget !== null && validTarget !== mind.id) {
      if (evidence) {
        const delta = w.evidence * specificity * Math.max(0.25, persuasiveness) * cred;
        note(validTarget, "accuses_with_evidence", n.accuses_with_evidence, THRESHOLDS.accuses_with_evidence, w.evidence, delta, [
          { name: "specificity", value: specificity },
          { name: "persuasiveness", value: Math.max(0.25, persuasiveness) },
          { name: "credibility", value: cred },
        ]);
      } else if (bare) {
        const delta = w.bare * (1 - w.skepticism) * cred;
        note(validTarget, "accuses_without_evidence", n.accuses_without_evidence, THRESHOLDS.accuses_without_evidence, w.bare, delta, [
          { name: "1 - skepticism", value: 1 - w.skepticism },
          { name: "credibility", value: cred },
        ]);
      }
      if (n.defends_other >= THRESHOLDS.defends_other) {
        const delta = -w.defence * Math.max(0.25, persuasiveness) * cred;
        note(validTarget, "defends_other", n.defends_other, THRESHOLDS.defends_other, w.defence, delta, [
          { name: "persuasiveness", value: Math.max(0.25, persuasiveness) },
          { name: "credibility", value: cred },
        ]);
      }
    }

    // What the speaker revealed about themselves.
    if (n.contradicts_own_claim >= THRESHOLDS.contradicts_own_claim) {
      note(speaker, "contradicts_own_claim", n.contradicts_own_claim, THRESHOLDS.contradicts_own_claim, w.contradiction, w.contradiction);
    }
    if (n.contradicts_fact >= THRESHOLDS.contradicts_fact) {
      note(speaker, "contradicts_fact", n.contradicts_fact, THRESHOLDS.contradicts_fact, w.contradiction, w.contradiction * 1.5, [{ name: "fact multiplier", value: 1.5 }]);
    }
    if (n.deflects >= THRESHOLDS.deflects) note(speaker, "deflects", n.deflects, THRESHOLDS.deflects, w.deflect, w.deflect);
    if (n.bandwagon >= THRESHOLDS.bandwagon) note(speaker, "bandwagon", n.bandwagon, THRESHOLDS.bandwagon, w.bandwagon, w.bandwagon);
    if (n.coordinates >= THRESHOLDS.coordinates) note(speaker, "coordinates", n.coordinates, THRESHOLDS.coordinates, w.coordination, w.coordination);
    if (n.emotional_pressure >= THRESHOLDS.emotional_pressure) note(speaker, "emotional_pressure", n.emotional_pressure, THRESHOLDS.emotional_pressure, w.pressure, w.pressure);
    if (n.defends_self >= THRESHOLDS.defends_self && n.deflects < THRESHOLDS.deflects) {
      const delta = -w.selfDefence * persuasiveness;
      note(speaker, "defends_self", n.defends_self, THRESHOLDS.defends_self, w.selfDefence, delta, [{ name: "persuasiveness", value: persuasiveness }]);
    }
    if (validTarget === mind.id && (evidence || bare) && w.grudge > 0) {
      note(speaker, "grudge", evidence ? n.accuses_with_evidence : n.accuses_without_evidence, evidence ? THRESHOLDS.accuses_with_evidence : THRESHOLDS.accuses_without_evidence, w.grudge, w.grudge, [
        { name: "accusations from them", value: mind.grudges[speaker] },
      ]);
    }

    // Seer claims and announced results.
    if (newClaim) {
      if (livingClaimants.length === 1) {
        note(speaker, "claims_seer", n.claims_seer, THRESHOLDS.claims_seer, w.claimTrust, -w.claimTrust);
      } else {
        for (const c of livingClaimants) {
          if (c === mind.id) continue;
          const factors = c === speaker ? [] : [{ name: "earlier trust withdrawn", value: w.claimTrust }];
          const delta = c === speaker ? w.claimConflict : w.claimConflict + w.claimTrust;
          note(c, "seer_claim_conflict", n.claims_seer, THRESHOLDS.claims_seer, w.claimConflict, delta, factors);
        }
      }
    }
    if (newResult && trustedSeer === speaker && newResult.target !== mind.id) {
      const delta = (newResult.wolf ? 1 : -1) * w.seerResult * cred;
      note(newResult.target, newResult.wolf ? "seer_says_wolf" : "seer_says_clear", n.reveals_night_result, THRESHOLDS.reveals_night_result, w.seerResult, delta, [{ name: "credibility", value: cred }]);
    }

    // The herd drifts toward the room.
    if (w.herd > 0) {
      const room = roomMean(state.minds, players, mind.id);
      for (const id of livingOthers(players, mind.id)) {
        const mean = Math.min(0.98, Math.max(0.02, room[id]));
        const delta = w.herd * 0.5 * (logit(mean) - mind.logOdds[id]);
        if (Math.abs(delta) >= 0.02) {
          apply(state.updates, at, day, { mind, about: id, by: speaker, signal: "herd", p: mean, threshold: 0, weight: w.herd, factors: [{ name: "room mean", value: mean }], delta });
        }
      }
    }
  }
}

function contradicted(state: GameState, r: { target: number; wolf: boolean }): boolean {
  const t = state.players[r.target];
  return revealed(state.players, r.target) && (t.role === "wolf") !== r.wolf;
}

/** A role became public: fix beliefs, settle claims, remember votes. */
function reveal(state: GameState, id: number, at: number): void {
  const players = state.players;
  const p = players[id];
  const day = state.day;
  for (const mind of Object.values(state.minds)) {
    if (mind.id === id) continue;
    fix(state.updates, at, day, mind, id, p.role === "wolf", "role_revealed");
  }
  // Liars: a claimed result the reveal contradicts.
  for (const r of state.claimedResults) {
    if (r.target !== id || !players[r.claimant].alive || (p.role === "wolf") === r.wolf) continue;
    for (const mind of Object.values(state.minds)) {
      if (mind.id === r.claimant || !players[mind.id].alive) continue;
      apply(state.updates, at, day, {
        mind,
        about: r.claimant,
        by: -1,
        signal: "false_seer_result",
        p: 1,
        threshold: 1,
        weight: CLAIM_LIAR_PENALTY,
        factors: [],
        delta: CLAIM_LIAR_PENALTY,
      });
      const rival = state.claims.find((c) => c.claimant !== r.claimant && players[c.claimant].alive);
      if (rival && rival.claimant !== mind.id) {
        const w = PERSONALITY[mind.personality].weights;
        apply(state.updates, at, day, { mind, about: rival.claimant, by: -1, signal: "rival_claim_vindicated", p: 1, threshold: 1, weight: w.claimTrust, factors: [], delta: -w.claimTrust });
      }
    }
  }
  // A dead claimant's rival becomes the trusted seer; nothing to do, trust follows from livingClaimants.
  // Votes for the revealed player.
  const votes = state.log.filter((e): e is Extract<LogEntry, { kind: "vote" }> => e.kind === "vote" && e.target === id);
  for (const v of votes) {
    if (!players[v.voter].alive) continue;
    for (const mind of Object.values(state.minds)) {
      if (mind.id === v.voter || !players[mind.id].alive) continue;
      const w = PERSONALITY[mind.personality].weights;
      const delta = p.role === "wolf" ? -w.voteMemory : w.voteMemory;
      apply(state.updates, at, day, {
        mind,
        about: v.voter,
        by: -1,
        signal: p.role === "wolf" ? "voted_for_a_wolf" : "voted_for_a_villager",
        p: 1,
        threshold: 1,
        weight: w.voteMemory,
        factors: [{ name: "day", value: v.day }],
        delta,
      });
    }
  }
}

function endOfDay(state: GameState, at: number): void {
  // Silence costs a little: anyone who said nothing all day draws suspicion.
  const living = state.players.filter((p) => p.alive).map((p) => p.id);
  const counts = new Map<number, number>(living.map((id) => [id, 0]));
  for (const m of messages(state)) if (m.day === state.day && counts.has(m.speaker)) counts.set(m.speaker, counts.get(m.speaker)! + 1);
  const quiet = living.filter((id) => counts.get(id) === 0);
  if (quiet.length === 0 || quiet.length >= living.length) return;
  for (const mind of Object.values(state.minds)) {
    if (!state.players[mind.id].alive) continue;
    const w = PERSONALITY[mind.personality].weights;
    for (const id of quiet) {
      if (id === mind.id) continue;
      apply(state.updates, at, state.day, { mind, about: id, by: -1, signal: "silence", p: 1, threshold: 1, weight: w.quiet, factors: [{ name: "messages today", value: 0 }], delta: w.quiet });
    }
  }
}

function enterVote(state: GameState): void {
  state.phase = "vote";
  state.votes = {};
  for (const v of aiVotes(state)) state.votes[v.voter] = v.target;
  endOfDay(state, state.log.length - 1);
}

function tally(state: GameState, humanVote: number | null): void {
  const day = state.day;
  const human = state.players[HUMAN];
  const order = [...Object.keys(state.votes).map(Number)];
  if (human.alive) {
    state.votes[HUMAN] = humanVote;
    order.push(HUMAN);
  }
  for (const voter of order) state.log.push({ kind: "vote", day, voter, target: state.votes[voter] ?? null });
  const counts: Record<number, number> = {};
  for (const voter of order) {
    const t = state.votes[voter];
    if (t !== null && t !== undefined) counts[t] = (counts[t] ?? 0) + 1;
  }
  let eliminated: number | null = null;
  let top = 0;
  let tie = false;
  for (const [id, n] of Object.entries(counts)) {
    if (n > top) {
      top = n;
      eliminated = Number(id);
      tie = false;
    } else if (n === top) tie = true;
  }
  if (tie || top === 0) eliminated = null;
  const entry: Extract<LogEntry, { kind: "tally" }> = { kind: "tally", day, counts, eliminated };
  if (eliminated !== null) {
    entry.role = state.players[eliminated].role;
    state.players[eliminated].alive = false;
  }
  state.log.push(entry);
  const at = state.log.length - 1;
  if (eliminated !== null) reveal(state, eliminated, at);
  state.votes = {};
  if (checkWin(state)) return;
  state.phase = "night";
  state.night = { kill: null, check: null };
  state.log.push({ kind: "night", day });
}

function resolveNight(state: GameState, choice: { kill?: number; check?: number }): void {
  const players = state.players;
  const human = players[HUMAN];
  const day = state.day;
  // Seer check first, so the seer learns about the victim too.
  const seer = players.find((p) => p.role === "seer" && p.alive);
  if (seer) {
    const target = seer.id === HUMAN ? (choice.check ?? null) : seerCheck(state, seer.id);
    if (target !== null && players[target].alive && target !== seer.id) {
      const wolf = players[target].role === "wolf";
      state.log.push({ kind: "check", day, seer: seer.id, target, wolf });
      const mind = state.minds[seer.id];
      if (mind) {
        mind.checks[target] = wolf;
        mind.unrevealed.push(target);
        fix(state.updates, state.log.length - 1, day, mind, target, wolf, "seer_check", seer.id);
      }
    }
  }
  let kill: number | null;
  if (human.alive && human.role === "wolf") {
    kill = choice.kill ?? null;
    if (kill !== null && (!players[kill].alive || players[kill].role === "wolf")) kill = null;
  } else {
    kill = wolfKill(state);
  }
  if (kill !== null) players[kill].alive = false;
  state.day += 1;
  state.log.push({ kind: "dawn", day: state.day, killed: kill });
  const at = state.log.length - 1;
  if (kill !== null) reveal(state, kill, at);
  state.night = null;
  if (checkWin(state)) return;
  state.phase = "day";
  state.humanMessagesLeft = HUMAN_MESSAGES_PER_DAY;
  state.rebuke = false;
  for (const mind of Object.values(state.minds)) mind.accusedToday = [];
  state.queue = dayQueue(state, kill);
}

/** Folds one action. Returns a new state; the input is not mutated. */
export function reduce(input: GameState, action: Action, library: readonly LineSpec[]): GameState {
  const state = clone(input);
  switch (action.t) {
    case "human": {
      if (state.phase !== "day") throw new EngineError("not day");
      if (!state.players[HUMAN].alive) throw new EngineError("the dead do not speak");
      if (state.humanMessagesLeft <= 0) throw new EngineError("no messages left today");
      const at = pushMessage(state, { kind: "message", day: state.day, speaker: HUMAN, text: action.text, measured: true });
      state.humanMessagesLeft -= 1;
      if (action.m) applyMeasurements(state, at, action.m);
      break;
    }
    case "ai": {
      if (state.phase !== "day") throw new EngineError("not day");
      const item = state.queue[0];
      if (!item || item.speaker !== action.speaker) throw new EngineError(`it is not ${action.speaker}'s turn`);
      const plan = planTurn(state, action.speaker, library, item.event);
      const line = library.find((l) => l.id === action.lineId);
      if (!line) throw new EngineError(`unknown line ${action.lineId}`);
      const target = action.target;
      const text = renderLine(line.text, target === null ? null : state.players[target].name);
      const fact = plan.fact && plan.target === target ? plan.fact : target !== null && line.intent === "accuse_evidence" ? targetFacts(state, target)[0] : undefined;
      const at = pushMessage(state, {
        kind: "message",
        day: state.day,
        speaker: action.speaker,
        text,
        lineId: line.id,
        intent: line.intent,
        tone: line.tone,
        target: target ?? undefined,
        fact,
        measured: plan.measured,
        pick: action.pick,
        candidates: plan.candidates.map((c) => c.id),
      });
      state.queue.shift();
      if (line.intent === "rebuke") state.rebuke = false;
      if (line.intent === "claim_seer" || line.intent === "counter_claim") {
        const mind = state.minds[action.speaker];
        if (mind && !plan.measured) mind.claimed = true;
      }
      if (plan.measured && action.m) applyMeasurements(state, at, action.m);
      break;
    }
    case "measure": {
      applyMeasurements(state, action.at, action.m);
      break;
    }
    case "call_vote": {
      if (state.phase !== "day") throw new EngineError("not day");
      if (state.queue.length) throw new EngineError("the table is still talking");
      enterVote(state);
      break;
    }
    case "vote": {
      if (state.phase === "day") {
        if (state.queue.length) throw new EngineError("the table is still talking");
        enterVote(state);
      }
      if (state.phase !== "vote") throw new EngineError("not the vote");
      const t = action.target;
      if (t !== null && (t === HUMAN || !state.players[t].alive)) throw new EngineError("invalid vote");
      tally(state, state.players[HUMAN].alive ? t : null);
      break;
    }
    case "night": {
      if (state.phase !== "night") throw new EngineError("not night");
      resolveNight(state, action);
      break;
    }
  }
  snapshot(state);
  return state;
}

/** Replays a recording from scratch. */
export function replay(seed: string, actions: readonly Action[], library: readonly LineSpec[], opts: GameOptions = {}): GameState {
  let state = createGame(seed, opts);
  for (const a of actions) state = reduce(state, a, library);
  return state;
}

/** Convenience for the UI: your standing is the mean belief in you. */
export function humanStanding(state: GameState): number {
  return standing(state.minds, state.players, HUMAN);
}

export { round };
