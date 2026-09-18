// Core engine types. The engine is pure: a game is a seed plus an ordered
// stream of actions, and folding the stream reproduces every number.

import type { Intent, Personality, Tone } from "./lines/types";

export type Role = "wolf" | "seer" | "villager";
export type Phase = "day" | "vote" | "night" | "over";
export type Winner = "village" | "wolves";

export interface Player {
  id: number;
  name: string;
  role: Role;
  alive: boolean;
  personality?: Personality;
}

/** One typed answer set for one message, as the judge returns it. */
export interface ChoiceMeasure {
  choice: string;
  confidence: number;
  probabilities: Record<string, number>;
}

export interface ScoreMeasure {
  score: number;
  confidence: number;
  probabilities: Record<string, number>;
}

export interface Measurements {
  nouls: Record<string, number>;
  choices: { intent: ChoiceMeasure; target: ChoiceMeasure; tone: ChoiceMeasure; claimed_result: ChoiceMeasure };
  scores: { specificity: ScoreMeasure; persuasiveness: ScoreMeasure };
}

/** The wolf's mirror, per candidate line. */
export interface MirrorMeasure {
  rehearsed: number;
  contradicts: number;
  suspicious: number;
}

export interface TurnPick {
  /** Probability the Choice put on each candidate, by index. */
  probabilities: number[];
  mirror?: MirrorMeasure[];
}

/** One factor in a belief update, shown in the why-trace. */
export interface Factor {
  name: string;
  value: number;
}

/** A single change to one villager's belief about one player. */
export interface BeliefUpdate {
  /** Index into `GameState.log`. */
  at: number;
  day: number;
  /** The mind that changed. */
  mind: number;
  /** The player whose suspicion changed. */
  about: number;
  /** Who caused it (the speaker, or -1 for a rule with no speaker). */
  by: number;
  signal: string;
  p: number;
  threshold: number;
  weight: number;
  factors: Factor[];
  delta: number;
  /** Log-odds after the update. */
  after: number;
}

export interface Claim {
  claimant: number;
  day: number;
  at: number;
}

export interface ClaimedResult {
  claimant: number;
  target: number;
  wolf: boolean;
  day: number;
  at: number;
}

export interface Mind {
  id: number;
  personality: Personality;
  /** P(wolf) as log-odds, per player id. Own entry is unused. */
  logOdds: number[];
  /** Accusations received per player id, for grudges. */
  grudges: number[];
  /** Player ids that accused this mind today. */
  accusedToday: number[];
  /** Seer only: checked player id -> wolf. */
  checks: Record<number, boolean>;
  /** Seer only: has claimed. */
  claimed: boolean;
  /** Seer only: check results not yet announced. */
  unrevealed: number[];
}

export type FactKind = "vote" | "contradiction" | "deflect" | "bandwagon" | "quiet" | "claim";

/** A fact about a target that an accusation can cite; rendered as a note. */
export interface TargetFact {
  kind: FactKind;
  about: number;
  text: string;
  /** How specific the citation is, 1..3, feeds the accusation's weight. */
  strength: number;
}

export type LogEntry =
  | {
      kind: "message";
      day: number;
      speaker: number;
      text: string;
      /** Authored line id for AI speech; undefined for the human. */
      lineId?: string;
      intent?: Intent;
      tone?: Tone;
      target?: number;
      /** The fact cited, when the line accuses with evidence. */
      fact?: TargetFact;
      measurements?: Measurements;
      pick?: TurnPick;
      candidates?: string[];
      /** Whether this message is sent to the judge. */
      measured: boolean;
    }
  | { kind: "dawn"; day: number; killed: number | null }
  | { kind: "vote"; day: number; voter: number; target: number | null }
  | { kind: "tally"; day: number; counts: Record<number, number>; eliminated: number | null; role?: Role }
  | { kind: "night"; day: number }
  | { kind: "check"; day: number; seer: number; target: number; wolf: boolean }
  | { kind: "rule"; day: number; text: string }
  | { kind: "over"; day: number; winner: Winner };

/** The public board: rows are AI minds, cells are normalised P(wolf). */
export type Board = Record<number, number[]>;

export interface QueueItem {
  speaker: number;
  /** Unmeasured event speech; undefined for a normal turn. */
  event?: "greet" | "mourn";
}

export interface GameState {
  seed: string;
  version: number;
  day: number;
  phase: Phase;
  players: Player[];
  minds: Record<number, Mind>;
  log: LogEntry[];
  updates: BeliefUpdate[];
  claims: Claim[];
  claimedResults: ClaimedResult[];
  /** Speaking order for the current day: event lines first, then rounds. */
  queue: QueueItem[];
  humanMessagesLeft: number;
  /** The human talked to the game rather than the table; next speaker rebukes. */
  rebuke: boolean;
  /** Pending votes for the current day. */
  votes: Record<number, number | null>;
  /** Night choices awaiting the human, when the human has a night role. */
  night: { kill: number | null; check: number | null } | null;
  winner: Winner | null;
  /** Board snapshot after every log entry, for replay. */
  history: Board[];
}

/** Everything the client must persist to replay a game exactly. */
export type Action =
  | { t: "human"; text: string; m?: Measurements }
  | { t: "ai"; speaker: number; lineId: string; target: number | null; m?: Measurements; pick?: TurnPick }
  | { t: "measure"; at: number; m: Measurements }
  | { t: "vote"; target: number | null }
  | { t: "call_vote" }
  | { t: "night"; kill?: number; check?: number };

export interface Recording {
  seed: string;
  version: number;
  actions: Action[];
}

/** What the orchestrator must do next. */
export type Step =
  | { kind: "ai_turn"; speaker: number }
  | { kind: "human_turn"; optional: boolean }
  | { kind: "vote" }
  | { kind: "night"; needs: ("kill" | "check")[] }
  | { kind: "over"; winner: Winner };
