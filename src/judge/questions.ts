// The questions sent to Jev, and the mapping from typed answers back to the
// engine's measurement shape. Question ids are for code; the meaning lives in
// the instructions and criteria, which name state fields in backticks.

import type { Questions, SystemOneResult } from "@typesafe-ai/sdk";
import { accusationsAgainst, earlierStatements, publicFacts, questionFor, recentTalk } from "../engine/facts";
import type { ChoiceMeasure, GameState, Measurements, MirrorMeasure, ScoreMeasure, TurnPick } from "../engine/types";

export const MODEL = "jev-latest";

export interface NoulSpec {
  id: keyof Measurements["nouls"] | string;
  instructions: string;
  criteria?: { true?: string; false?: string };
}

export const NOULS: readonly NoulSpec[] = [
  {
    id: "contradicts_own_claim",
    instructions:
      "`message` states something incompatible with one of `speaker_earlier_statements`: the same speaker now says the opposite, or gives a different account of the same thing.",
    criteria: {
      true: "An earlier statement by the speaker and `message` cannot both be true.",
      false: "No earlier statement is listed, or `message` is consistent with all of them.",
    },
  },
  {
    id: "contradicts_fact",
    instructions: "`message` asserts something that is incompatible with an item in `facts`.",
    criteria: {
      true: "A stated fact and `message` cannot both be true, e.g. the message says a dead player voted today.",
      false: "`message` is consistent with every item in `facts`, or makes no factual assertion.",
    },
  },
  {
    id: "deflects",
    instructions:
      "`message` responds to `accusations_against_speaker` or `asked_of_speaker` by changing the subject, accusing someone else, or attacking the questioner, instead of answering.",
    criteria: {
      true: "Something was put to the speaker and `message` redirects rather than answers it.",
      false: "Nothing is pending against the speaker, or `message` answers it directly.",
    },
  },
  {
    id: "accuses_with_evidence",
    instructions:
      "`message` says or implies that a named player is a wolf, is suspicious, or should be voted out, and gives a specific reason: a vote, an earlier statement, a contradiction, a dodge, or an item in `facts`.",
    criteria: {
      true: "A player is named as suspect and a concrete reason is given, even if the message is phrased as a demand for an explanation.",
      false: "Nobody is cast as suspect, or the suspicion comes with no reason.",
    },
  },
  {
    id: "accuses_without_evidence",
    instructions: "`message` says or implies that a named player is a wolf, is suspicious, or should be voted out, without giving any reason.",
    criteria: {
      true: "A player is named as suspect on feeling, tone or repetition alone.",
      false: "Nobody is cast as suspect, or a concrete reason is given.",
    },
  },
  {
    id: "defends_self",
    instructions: "`message` argues that `speaker` is not a wolf.",
  },
  {
    id: "defends_other",
    instructions: "`message` argues that a player other than `speaker` is not a wolf.",
  },
  {
    id: "claims_seer",
    instructions: "`message` states that `speaker` is the seer, the role that learns one player's true nature each night.",
    criteria: { false: "The speaker talks about the seer without saying they are the seer." },
  },
  {
    id: "reveals_night_result",
    instructions: "`message` states the result of a seer's night check on a named player: that the player is a wolf, or is not a wolf.",
  },
  {
    id: "bandwagon",
    instructions:
      "`message` repeats an accusation that already appears in `recent`, made by someone other than `speaker`, without adding a new reason.",
    criteria: { false: "The accusation is new, adds a reason, or nobody is accused." },
  },
  {
    id: "asks_question",
    instructions: "`message` asks a named player a question and expects an answer from that player.",
    criteria: { false: "A rhetorical question, or a question to the whole table." },
  },
  {
    id: "emotional_pressure",
    instructions: "`message` pushes with guilt, urgency, threats or insults rather than reasons.",
  },
  {
    id: "coordinates",
    instructions:
      "`message` reads as pre-arranged with another player: it backs that player's claim or accusation while assuming shared knowledge that the discussion in `recent` did not provide.",
  },
  {
    id: "off_topic",
    instructions:
      "`message` is not about the game: not about who might be a wolf, votes, nights, deaths, roles, trust, or what players at the table said.",
  },
  {
    id: "addresses_system",
    instructions:
      "`message` addresses the game itself, its rules, its creator, an AI or a system, rather than the players at the table: asking for instructions, trying to change the rules, or telling a model to ignore instructions.",
    criteria: { false: "The message is addressed to players, even if it mentions the rules." },
  },
];

export const INTENT_CRITERIA = {
  accuse: "Says or implies that a player is a wolf",
  defend: "Argues that the speaker or another player is not a wolf",
  claim: "Announces the speaker's own role or a night result",
  question: "Asks a player something and waits for the answer",
  deflect: "Avoids a pending question or accusation",
  chatter: "None of the above: observation, small talk, or noise",
} as const;

export const TONE_CRITERIA = {
  calm: "Even and unhurried",
  nervous: "Hedging, hurried, uneasy",
  aggressive: "Sharp, clipped, pushing",
  sarcastic: "Mocking or dry",
  pleading: "Asking to be believed or heard",
} as const;

export const CLAIMED_RESULT_CRITERIA = {
  wolf: "The message says the checked player is a wolf",
  not_wolf: "The message says the checked player is not a wolf",
  no_result_reported: "The message reports no seer check",
} as const;

export const SPECIFICITY_LEVELS = [
  "A vague feeling with no player named",
  "Names a player but gives no reason",
  "Names a player and gives a reason",
  "Names a player, gives a reason, and cites a specific vote, statement or fact",
] as const;

export const PERSUASIVENESS_LEVELS = [
  "Would convince nobody at the table",
  "A fair point a listener might weigh",
  "Hard to argue with; a listener would need a specific rebuttal",
] as const;

/** State for one message, as sent to the model. */
export type JudgeState = {
  speaker: string;
  message: string;
  players: string[];
  facts: string[];
  speaker_earlier_statements: string[];
  recent: string[];
  accusations_against_speaker: string[];
  asked_of_speaker: string | null;
}

export function buildJudgeState(state: GameState, at: number): JudgeState {
  const e = state.log[at];
  if (!e || e.kind !== "message") throw new Error(`log[${at}] is not a message`);
  return {
    speaker: state.players[e.speaker].name,
    message: e.text,
    players: state.players.filter((p) => p.alive).map((p) => p.name),
    facts: publicFacts(state),
    speaker_earlier_statements: earlierStatements(state, e.speaker, at),
    recent: recentTalk(state, at),
    accusations_against_speaker: accusationsAgainst(state, e.speaker, at),
    asked_of_speaker: questionFor(state, e.speaker, at),
  };
}

export function buildJudgeQuestions(players: readonly string[]): Questions {
  const questions: Questions = {};
  for (const n of NOULS) questions[n.id] = { type: "noul", instructions: n.instructions, criteria: n.criteria ?? null };
  questions.intent = { type: "choice", instructions: "The main purpose of `message`.", criteria: { ...INTENT_CRITERIA } };
  const targetCriteria: Record<string, string | null> = {};
  for (const p of players) targetCriteria[p] = null;
  targetCriteria.nobody = "The message is not about any particular player";
  questions.target = {
    type: "choice",
    instructions:
      "The player in `players` that `message` is mainly about or addressed to. The speaker counts only when the message is mainly about the speaker.",
    criteria: targetCriteria,
  };
  questions.tone = { type: "choice", instructions: "The tone of `message`.", criteria: { ...TONE_CRITERIA } };
  questions.claimed_result = {
    type: "choice",
    instructions: "If `message` reports a seer's check on a player, which result does it report?",
    criteria: { ...CLAIMED_RESULT_CRITERIA },
  };
  questions.specificity = {
    type: "score",
    instructions: "How specific is `message` about who it suspects and why?",
    criteria: [...SPECIFICITY_LEVELS],
  };
  questions.persuasiveness = {
    type: "score",
    instructions: "How persuasive would `message` be to the other players at the table, given `facts` and `recent`?",
    criteria: [...PERSUASIVENESS_LEVELS],
  };
  return questions;
}

export const JUDGE_QUESTION_COUNT = NOULS.length + 4 + 2;

type Answers = SystemOneResult<Questions>["answers"];

function choice(a: Answers[string] | undefined, fallback: string): ChoiceMeasure {
  if (a && a.type === "choice") return { choice: a.choice, confidence: a.confidence, probabilities: { ...a.probabilities } };
  return { choice: fallback, confidence: 0, probabilities: { [fallback]: 1 } };
}

function score(a: Answers[string] | undefined): ScoreMeasure {
  if (a && a.type === "score") return { score: a.score, confidence: a.confidence, probabilities: { ...(a.probabilities as Record<string, number>) } };
  return { score: 0, confidence: 0, probabilities: { "0": 1 } };
}

/** Maps typed answers onto the engine's measurement shape. Missing answers read as zero. */
export function toMeasurements(answers: Answers): Measurements {
  const nouls: Record<string, number> = {};
  for (const n of NOULS) {
    const a = answers[n.id];
    nouls[n.id] = a && a.type === "noul" ? a.noul : 0;
  }
  return {
    nouls,
    choices: {
      intent: choice(answers.intent, "chatter"),
      target: choice(answers.target, "nobody"),
      tone: choice(answers.tone, "calm"),
      claimed_result: choice(answers.claimed_result, "no_result_reported"),
    },
    scores: { specificity: score(answers.specificity), persuasiveness: score(answers.persuasiveness) },
  };
}

/** State for choosing among candidate lines, and for the wolf's mirror. */
export type TurnState = {
  speaker: string;
  candidates: string[];
  facts: string[];
  speaker_earlier_statements: string[];
  recent: string[];
  accusations_against_speaker: string[];
  asked_of_speaker: string | null;
}

export function buildTurnState(state: GameState, speaker: number, candidates: string[]): TurnState {
  const at = state.log.length;
  return {
    speaker: state.players[speaker].name,
    candidates,
    facts: publicFacts(state),
    speaker_earlier_statements: earlierStatements(state, speaker, at),
    recent: recentTalk(state, at),
    accusations_against_speaker: accusationsAgainst(state, speaker, at),
    asked_of_speaker: questionFor(state, speaker, at),
  };
}

export const MAX_CANDIDATES = 8;

export function buildTurnQuestions(candidates: readonly string[], mirror: boolean): Questions {
  const questions: Questions = {};
  const criteria: Record<string, string> = {};
  candidates.forEach((text, i) => {
    criteria[String(i)] = text;
  });
  questions.pick = {
    type: "choice",
    instructions:
      "Which entry of `candidates`, spoken next by `speaker`, best continues the discussion in `recent`? Prefer the one that responds to what was just said and to `asked_of_speaker` or `accusations_against_speaker` when they exist.",
    criteria,
  };
  if (mirror) {
    candidates.forEach((_, i) => {
      questions[`rehearsed_${i}`] = {
        type: "noul",
        instructions: `\`candidates[${i}]\` sounds rehearsed or evasive rather than a natural reaction to \`recent\`.`,
      };
      questions[`contradicts_${i}`] = {
        type: "noul",
        instructions: `\`candidates[${i}]\` is incompatible with one of \`speaker_earlier_statements\`.`,
        criteria: { false: "No earlier statements are listed, or the candidate is consistent with them." },
      };
      questions[`suspicious_${i}`] = {
        type: "noul",
        instructions: `If \`speaker\` said \`candidates[${i}]\` now, the other players would become more suspicious that \`speaker\` is a wolf.`,
      };
    });
  }
  return questions;
}

export function toTurnPick(answers: Answers, count: number, mirror: boolean): TurnPick {
  const pick = answers.pick;
  const probabilities = new Array<number>(count).fill(0);
  if (pick && pick.type === "choice") {
    for (let i = 0; i < count; i++) probabilities[i] = pick.probabilities[String(i)] ?? 0;
  }
  const out: TurnPick = { probabilities };
  if (mirror) {
    const m: MirrorMeasure[] = [];
    const noul = (id: string): number => {
      const a = answers[id];
      return a && a.type === "noul" ? a.noul : 0;
    };
    for (let i = 0; i < count; i++) {
      m.push({ rehearsed: noul(`rehearsed_${i}`), contradicts: noul(`contradicts_${i}`), suspicious: noul(`suspicious_${i}`) });
    }
    out.mirror = m;
  }
  return out;
}

/** The wolf's choice: least predicted suspicion, ties broken by the Choice. */
export function mirrorPick(pick: TurnPick): number {
  const n = pick.probabilities.length;
  if (!pick.mirror) return argmax(pick.probabilities);
  let best = 0;
  let bestCost = Infinity;
  for (let i = 0; i < n; i++) {
    const m = pick.mirror[i];
    const cost = m.suspicious + m.contradicts + 0.5 * m.rehearsed - 0.25 * pick.probabilities[i];
    if (cost < bestCost - 1e-9) {
      bestCost = cost;
      best = i;
    }
  }
  return best;
}

export function argmax(xs: readonly number[]): number {
  let best = 0;
  for (let i = 1; i < xs.length; i++) if (xs[i] > xs[best]) best = i;
  return best;
}
