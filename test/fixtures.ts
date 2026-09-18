// Test fixtures: a small synthetic line library and measurement factories.
// The real library is linted separately; engine tests must not depend on it.

import { INTENTS, PERSONALITIES, TONES, type Intent, type LineSpec, type Need } from "../src/engine/lines/types";
import type { ChoiceMeasure, Measurements } from "../src/engine/types";

const TEXT: Record<Intent, string> = {
  accuse_evidence: "{target}. The record says otherwise.",
  accuse_bare: "{target}. It is you.",
  defend_self: "I am not a wolf.",
  defend_other: "{target}. I believe you.",
  question: "{target}. Where were you?",
  answer: "I was at home.",
  deflect: "Why is nobody asking the others?",
  chatter: "The day is long.",
  claim_seer: "I am the seer.",
  counter_claim: "{target}. You are not the seer. I am.",
  reveal_wolf: "{target}. You came up wolf.",
  reveal_clear: "{target}. You came up clear.",
  vote: "{target}. My vote.",
  greet: "Morning, all.",
  mourn: "Someone here did that.",
  rebuke: "{target}. Talk to us, not the sky.",
};

const NEED: Partial<Record<Intent, Need[]>> = {
  accuse_evidence: ["fact:any"],
  defend_self: ["accused"],
  answer: ["asked"],
  counter_claim: ["claim_exists"],
  mourn: ["death_today"],
};

export const FIXTURE_LINES: LineSpec[] = PERSONALITIES.flatMap((who) =>
  INTENTS.flatMap((intent) =>
    TONES.flatMap((tone) =>
      [1, 2].map((n) => ({
        id: `${who}.${intent}.${tone}.${n}`,
        who,
        intent,
        tone,
        text: n === 1 ? TEXT[intent] : TEXT[intent].replace(".", ", again."),
        needs: NEED[intent],
      })),
    ),
  ),
);

export const NOUL_IDS = [
  "contradicts_own_claim",
  "contradicts_fact",
  "deflects",
  "accuses_with_evidence",
  "accuses_without_evidence",
  "defends_self",
  "defends_other",
  "claims_seer",
  "reveals_night_result",
  "bandwagon",
  "asks_question",
  "emotional_pressure",
  "coordinates",
  "off_topic",
  "addresses_system",
] as const;

function choice(choice: string, p = 0.95, others: string[] = []): ChoiceMeasure {
  const probabilities: Record<string, number> = { [choice]: p };
  const rest = (1 - p) / Math.max(1, others.length);
  for (const o of others) probabilities[o] = rest;
  return { choice, confidence: p, probabilities };
}

export interface MeasureOptions {
  nouls?: Partial<Record<(typeof NOUL_IDS)[number], number>>;
  intent?: string;
  target?: string;
  targetP?: number;
  tone?: string;
  claimed?: "wolf" | "not_wolf" | "no_result_reported";
  specificity?: number;
  persuasiveness?: number;
}

/** A quiet measurement: nothing fires. Override what you need. */
export function measure(o: MeasureOptions = {}): Measurements {
  const nouls: Record<string, number> = {};
  for (const id of NOUL_IDS) nouls[id] = o.nouls?.[id] ?? 0.05;
  return {
    nouls,
    choices: {
      intent: choice(o.intent ?? "chatter"),
      target: choice(o.target ?? "nobody", o.targetP ?? 0.9, ["nobody"]),
      tone: choice(o.tone ?? "calm"),
      claimed_result: choice(o.claimed ?? "no_result_reported"),
    },
    scores: {
      specificity: { score: o.specificity ?? 0, confidence: 1, probabilities: { [String(o.specificity ?? 0)]: 1 } },
      persuasiveness: { score: o.persuasiveness ?? 0, confidence: 1, probabilities: { [String(o.persuasiveness ?? 0)]: 1 } },
    },
  };
}

export function accuseWithEvidence(target: string, specificity = 3, persuasiveness = 2, p = 0.9): Measurements {
  return measure({ nouls: { accuses_with_evidence: p }, intent: "accuse", target, specificity, persuasiveness });
}

export function accuseBare(target: string, p = 0.85): Measurements {
  return measure({ nouls: { accuses_without_evidence: p }, intent: "accuse", target, specificity: 1, persuasiveness: 0.5 });
}
