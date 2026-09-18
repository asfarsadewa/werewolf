import { describe, expect, it } from "vitest";
import { createGame, reduce } from "../src/engine/game";
import { NAMES } from "../src/engine/roster";
import {
  JUDGE_QUESTION_COUNT,
  NOULS,
  buildJudgeQuestions,
  buildJudgeState,
  buildTurnQuestions,
  buildTurnState,
  mirrorPick,
  toMeasurements,
  toTurnPick,
} from "../src/judge/questions";
import { FIXTURE_LINES, NOUL_IDS, accuseWithEvidence, measure } from "./fixtures";

const L = FIXTURE_LINES;

describe("questions", () => {
  it("asks every signal the engine consumes, plus four choices and two scores", () => {
    const q = buildJudgeQuestions(NAMES);
    expect(Object.keys(q)).toHaveLength(JUDGE_QUESTION_COUNT);
    for (const id of NOUL_IDS) expect(q[id]?.type).toBe("noul");
    expect(NOULS.map((n) => n.id).sort()).toEqual([...NOUL_IDS].sort());
    for (const id of ["intent", "target", "tone", "claimed_result"]) expect(q[id]?.type).toBe("choice");
    for (const id of ["specificity", "persuasiveness"]) expect(q[id]?.type).toBe("score");
    const target = q.target;
    expect(target.type === "choice" && Object.keys(target.criteria)).toEqual([...NAMES, "nobody"]);
  });

  it("names state fields in backticks and never leaves an instruction empty", () => {
    const q = buildJudgeQuestions(NAMES);
    for (const [id, question] of Object.entries(q)) {
      const text = JSON.stringify(question.instructions);
      expect(text.length, id).toBeGreaterThan(20);
      expect(text, id).toMatch(/`[a-z_]+`/);
    }
  });

  it("builds a compact state from the log", () => {
    let s = createGame("state", { humanRole: "villager" });
    s = reduce(s, { t: "human", text: "Kip, why did you go quiet?", m: measure({ nouls: { asks_question: 0.9 }, target: "Kip", intent: "question" }) }, L);
    s = reduce(s, { t: "human", text: "I was with Tomas.", m: measure() }, L);
    const js = buildJudgeState(s, s.log.length - 1);
    expect(js.speaker).toBe("Stranger");
    expect(js.message).toBe("I was with Tomas.");
    expect(js.players).toEqual([...NAMES]);
    expect(js.facts[0]).toBe("Day 1.");
    expect(js.speaker_earlier_statements).toEqual(["Day 1: Kip, why did you go quiet?"]);
    expect(js.recent).toEqual(["Stranger: Kip, why did you go quiet?"]);
    expect(js.accusations_against_speaker).toEqual([]);
    expect(js.asked_of_speaker).toBeNull();
    // Kip's turn state carries the open question.
    const kip = s.players.findIndex((p) => p.name === "Kip");
    const ts = buildTurnState(s, kip, ["Here."]);
    expect(ts.asked_of_speaker).toBe("Stranger: Kip, why did you go quiet?");
    expect(ts.candidates).toEqual(["Here."]);
  });

  it("lists accusations against the speaker", () => {
    let s = createGame("accused", { humanRole: "villager" });
    s = reduce(s, { t: "human", text: "Kip voted badly.", m: accuseWithEvidence("Kip") }, L);
    const kip = s.players.findIndex((p) => p.name === "Kip");
    const ts = buildTurnState(s, kip, ["No."]);
    expect(ts.accusations_against_speaker).toEqual(["Stranger: Kip voted badly."]);
  });
});

describe("answers", () => {
  it("map onto the measurement shape with probabilities in range", () => {
    const answers = {
      contradicts_own_claim: { type: "noul", noul: 0.12 },
      deflects: { type: "noul", noul: 0.81 },
      intent: { type: "choice", choice: "deflect", confidence: 0.7, probabilities: { deflect: 0.8, chatter: 0.2 } },
      target: { type: "choice", choice: "Kip", confidence: 0.9, probabilities: { Kip: 0.95, nobody: 0.05 } },
      specificity: { type: "score", score: 1.4, confidence: 0.5, probabilities: { "1": 0.6, "2": 0.4 }, legend: {} },
    } as const;
    const m = toMeasurements(answers as never);
    expect(m.nouls.deflects).toBe(0.81);
    expect(m.nouls.contradicts_own_claim).toBe(0.12);
    expect(m.nouls.bandwagon).toBe(0);
    expect(m.choices.intent.choice).toBe("deflect");
    expect(m.choices.target.probabilities.Kip).toBe(0.95);
    expect(m.choices.tone.choice).toBe("calm");
    expect(m.choices.claimed_result.choice).toBe("no_result_reported");
    expect(m.scores.specificity.score).toBe(1.4);
    expect(m.scores.persuasiveness.score).toBe(0);
    for (const v of Object.values(m.nouls)) expect(v).toBeGreaterThanOrEqual(0);
    for (const v of Object.values(m.nouls)) expect(v).toBeLessThanOrEqual(1);
  });
});

describe("turn questions and the mirror", () => {
  it("asks a pick over candidates, and three nouls per candidate for wolves", () => {
    const c = ["A.", "B.", "C."];
    expect(Object.keys(buildTurnQuestions(c, false))).toEqual(["pick"]);
    const q = buildTurnQuestions(c, true);
    expect(Object.keys(q)).toHaveLength(1 + 3 * 3);
    expect(q.pick.type === "choice" && Object.keys(q.pick.criteria)).toEqual(["0", "1", "2"]);
    expect(JSON.stringify(q.suspicious_2.instructions)).toContain("candidates[2]");
  });

  it("the wolf picks the least suspicious line, the villager the best fit", () => {
    const answers = {
      pick: { type: "choice", choice: "0", confidence: 0.5, probabilities: { "0": 0.6, "1": 0.3, "2": 0.1 } },
      rehearsed_0: { type: "noul", noul: 0.2 },
      contradicts_0: { type: "noul", noul: 0.7 },
      suspicious_0: { type: "noul", noul: 0.8 },
      rehearsed_1: { type: "noul", noul: 0.1 },
      contradicts_1: { type: "noul", noul: 0.05 },
      suspicious_1: { type: "noul", noul: 0.2 },
      rehearsed_2: { type: "noul", noul: 0.9 },
      contradicts_2: { type: "noul", noul: 0.1 },
      suspicious_2: { type: "noul", noul: 0.3 },
    } as const;
    const wolf = toTurnPick(answers as never, 3, true);
    expect(wolf.probabilities).toEqual([0.6, 0.3, 0.1]);
    expect(wolf.mirror).toHaveLength(3);
    expect(mirrorPick(wolf)).toBe(1);
    const villager = toTurnPick(answers as never, 3, false);
    expect(villager.mirror).toBeUndefined();
    expect(mirrorPick(villager)).toBe(0);
  });
});
