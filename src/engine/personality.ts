// Weights are personality; thresholds are engine constants. Both live here
// and nowhere else, and both are tested. Units are log-odds.

import type { Personality, Tone } from "./lines/types";

export interface Weights {
  /** Accusation that cites a fact. */
  evidence: number;
  /** Accusation with no reason given. */
  bare: number;
  /** Discount applied to bare accusations: delta *= (1 - skepticism). */
  skepticism: number;
  /** Speaker contradicted their own earlier statement. */
  contradiction: number;
  /** Speaker dodged a question or accusation. */
  deflect: number;
  /** Speaker repeated an accusation without adding anything. */
  bandwagon: number;
  /** Speaker sounded pre-arranged with another player. */
  coordination: number;
  /** Speaker leaned on guilt, urgency or insult. */
  pressure: number;
  /** Someone vouched for a player. */
  defence: number;
  /** A player argued for their own innocence. */
  selfDefence: number;
  /** Voted for a player later revealed as a villager (or wolf, negated). */
  voteMemory: number;
  /** Suspicion returned to whoever accuses this mind. */
  grudge: number;
  /** Pull toward the room's average belief. */
  herd: number;
  /** Nightly nudge against the quietest player. */
  quiet: number;
  /** Trust extended to a lone seer claim. */
  claimTrust: number;
  /** Suspicion spread over rival seer claimants. */
  claimConflict: number;
  /** Weight given to a trusted seer's announced result. */
  seerResult: number;
}

export interface PersonalitySpec {
  id: Personality;
  weights: Weights;
  /** Belief at or above which the villager accuses. */
  accuseAt: number;
  /** Belief at or below which the villager will vouch for someone under fire. */
  defendAt: number;
  /** Default tone, and tones under pressure. */
  tones: { base: Tone; accused: Tone; cornered: Tone; accusing: Tone };
}

const BASE: Weights = {
  evidence: 1.6,
  bare: 0.5,
  skepticism: 0.3,
  contradiction: 1.1,
  deflect: 0.8,
  bandwagon: 0.4,
  coordination: 0.4,
  pressure: 0.3,
  defence: 0.9,
  selfDefence: 0.5,
  voteMemory: 0.6,
  grudge: 0,
  herd: 0,
  quiet: 0.25,
  claimTrust: 0.8,
  claimConflict: 0.7,
  seerResult: 2.5,
};

function scale(w: Weights, k: number, keep: (keyof Weights)[] = []): Weights {
  const out = { ...w };
  for (const key of Object.keys(out) as (keyof Weights)[]) {
    if (key === "skepticism" || keep.includes(key)) continue;
    out[key] = Math.round(out[key] * k * 100) / 100;
  }
  return out;
}

export const PERSONALITY: Record<Personality, PersonalitySpec> = {
  mara: {
    id: "mara",
    weights: { ...BASE, evidence: 2.2, bare: 0.15, skepticism: 0.6, contradiction: 1.2, pressure: 0.1 },
    accuseAt: 0.5,
    defendAt: 0.12,
    tones: { base: "calm", accused: "calm", cornered: "aggressive", accusing: "calm" },
  },
  tomas: {
    id: "tomas",
    weights: { ...BASE, bare: 0.9, skepticism: 0, bandwagon: 0.1, defence: 0.6, herd: 0.6 },
    accuseAt: 0.42,
    defendAt: 0.15,
    tones: { base: "nervous", accused: "nervous", cornered: "pleading", accusing: "aggressive" },
  },
  bel: {
    id: "bel",
    weights: { ...BASE, skepticism: 0.7, deflect: 1.5, bare: 0.3, pressure: 0.6, contradiction: 1.0 },
    accuseAt: 0.48,
    defendAt: 0.1,
    tones: { base: "sarcastic", accused: "sarcastic", cornered: "aggressive", accusing: "sarcastic" },
  },
  ines: {
    id: "ines",
    weights: { ...BASE, defence: 1.6, selfDefence: 0.9, bare: 0.35, deflect: 0.5, skepticism: 0.4 },
    accuseAt: 0.52,
    defendAt: 0.2,
    tones: { base: "calm", accused: "nervous", cornered: "pleading", accusing: "calm" },
  },
  kip: {
    id: "kip",
    weights: { ...BASE, grudge: 0.9, bare: 0.6, pressure: 0.2, skepticism: 0.2 },
    accuseAt: 0.45,
    defendAt: 0.12,
    tones: { base: "aggressive", accused: "aggressive", cornered: "pleading", accusing: "aggressive" },
  },
  rook: {
    id: "rook",
    weights: { ...BASE, contradiction: 1.9, voteMemory: 1.0, bare: 0.3, evidence: 1.7, skepticism: 0.5 },
    accuseAt: 0.5,
    defendAt: 0.12,
    tones: { base: "calm", accused: "calm", cornered: "nervous", accusing: "calm" },
  },
  sol: {
    id: "sol",
    weights: { ...scale(BASE, 0.55, ["voteMemory", "seerResult"]), voteMemory: 0.9, skepticism: 0.5 },
    accuseAt: 0.58,
    defendAt: 0.12,
    tones: { base: "calm", accused: "calm", cornered: "calm", accusing: "aggressive" },
  },
};

/** Probability at or above which a signal counts. Below it contributes nothing. */
export const THRESHOLDS = {
  accuses_with_evidence: 0.7,
  accuses_without_evidence: 0.7,
  contradicts_own_claim: 0.65,
  contradicts_fact: 0.65,
  deflects: 0.7,
  bandwagon: 0.7,
  coordinates: 0.6,
  emotional_pressure: 0.8,
  defends_other: 0.7,
  defends_self: 0.7,
  claims_seer: 0.8,
  reveals_night_result: 0.8,
  asks_question: 0.6,
  off_topic: 0.7,
  addresses_system: 0.7,
  /** A target counts only when the Choice puts at least this much on a name. */
  target: 0.4,
} as const;

export type Signal = keyof typeof THRESHOLDS;

/**
 * Whom to accuse or vote for is a utility over the living others, the same
 * for every mind: own belief blended with the room's. Wolves subtract a
 * shield from their partner, so the partner must lead the runner-up by this
 * margin before a wolf turns on them. Once the partner alone leads the cast
 * votes with at least BUS_LEAD, the shield is pointless and the wolf votes
 * with the room; a tie is not a lead.
 */
export const TARGET_ROOM_WEIGHT = 0.2;
export const PARTNER_SHIELD = 0.12;
export const BUS_LEAD = 2;

/** Log-odds bounds; beliefs never become certainties by accumulation. */
export const LOG_ODDS_MIN = -6;
export const LOG_ODDS_MAX = 6;

/** Credibility of a speaker in a listener's eyes never drops below this. */
export const MIN_CREDIBILITY = 0.25;

/** Rounds of AI speech per day, and the human's message budget per day. */
export const ROUNDS_PER_DAY = 2;
export const HUMAN_MESSAGES_PER_DAY = 3;
export const MAX_MESSAGE_CHARS = 280;

/** Trust effects of claims are applied relative to this many log-odds. */
export const CLAIM_LIAR_PENALTY = 3;
