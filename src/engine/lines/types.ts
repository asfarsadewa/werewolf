// Authored line library: the only words a villager can say. A line is chosen
// by code (intent, tone, preconditions) and, when several fit, by a Choice.
// Nothing here is ever generated at runtime.

export const PERSONALITIES = ["mara", "tomas", "bel", "ines", "kip", "rook", "sol"] as const;
export type Personality = (typeof PERSONALITIES)[number];

export const TONES = ["calm", "nervous", "aggressive", "sarcastic", "pleading"] as const;
export type Tone = (typeof TONES)[number];

/** Core intents need every tone with at least two lines each, per personality. */
export const CORE_INTENTS = [
  "accuse_evidence",
  "accuse_bare",
  "defend_self",
  "defend_other",
  "question",
  "answer",
  "deflect",
  "chatter",
] as const;

/** Event intents need calm, nervous and aggressive with at least one line each. */
export const EVENT_INTENTS = [
  "claim_seer",
  "counter_claim",
  "reveal_wolf",
  "reveal_clear",
  "vote",
  "greet",
  "mourn",
  "rebuke",
] as const;

export const INTENTS = [...CORE_INTENTS, ...EVENT_INTENTS] as const;
export type Intent = (typeof INTENTS)[number];

/**
 * Preconditions a line needs from the game state before it is a candidate.
 * `fact:*` kinds are compiled by code and shown under the line as a note.
 */
export const NEEDS = [
  "fact:vote", // target voted to eliminate a player later revealed as a villager
  "fact:contradiction", // target contradicted their own earlier claim today
  "fact:deflect", // target dodged a direct question today
  "fact:bandwagon", // target repeated an accusation without adding anything
  "fact:quiet", // target has said nothing today
  "fact:claim", // target has claimed to be the seer
  "fact:any", // any of the above
  "accused", // the speaker was accused today
  "asked", // a question was put to the speaker
  "claim_exists", // someone else has claimed seer
  "death_today", // someone died last night
  "past_vote", // at least one vote has been held
] as const;
export type Need = (typeof NEEDS)[number];

export interface LineSpec {
  /** Stable id: `${who}.${intent}.${tone}.${n}`; voice clips are keyed by it. */
  id: string;
  who: Personality;
  intent: Intent;
  tone: Tone;
  /**
   * The spoken text. At most one slot, `{target}`, and only as a leading
   * vocative: the text must start with `{target}.` or `{target},`. Names never
   * appear anywhere else; facts are rendered by code as a note under the line.
   */
  text: string;
  /** All of these must hold for the line to be a candidate. */
  needs?: readonly Need[];
}
