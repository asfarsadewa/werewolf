import { describe, expect, it } from "vitest";
import { standingStep } from "../src/engine/explain";
import { createGame, reduce } from "../src/engine/game";
import { buildReport } from "../src/engine/report";
import { HUMAN } from "../src/engine/roster";
import { FIXTURE_LINES, accuseWithEvidence, measure } from "./fixtures";

const L = FIXTURE_LINES;

describe("the report", () => {
  it("measures the costliest and best lines as moves in the table's mean suspicion of you", () => {
    let s = createGame("report", { humanRole: "villager" });
    s = reduce(s, { t: "human", text: "Kip voted for Ines and Ines was a villager.", m: accuseWithEvidence("Kip") }, L);
    const good = s.log.length - 1;
    s = reduce(s, { t: "human", text: "I was never with Tomas.", m: measure({ nouls: { contradicts_own_claim: 0.9 } }) }, L);
    const bad = s.log.length - 1;
    s.winner = "wolves";
    s.phase = "over";
    const r = buildReport(s);
    expect(r.costliest?.text).toBe("I was never with Tomas.");
    expect(r.costliest?.delta).toBeCloseTo(Math.round(standingStep(s, HUMAN, bad)! * 100) / 100, 2);
    expect(r.best?.text).toBe("Kip voted for Ines and Ines was a villager.");
    expect(r.best?.delta).toBeCloseTo(Math.round(standingStep(s, HUMAN, good)! * 100) / 100, 2);
    // Probability points, not log-odds: both fit inside a unit interval.
    expect(Math.abs(r.costliest!.delta)).toBeLessThan(1);
    expect(Math.abs(r.best!.delta)).toBeLessThan(1);
    expect(r.contradictions).toBe(1);
  });
});
