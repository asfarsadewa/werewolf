import { describe, expect, it } from "vitest";
import { createGame, reduce } from "../src/engine/game";
import { PERSONALITY } from "../src/engine/personality";
import { aiVotes, planTurn, renderLine, seerCheck, voteLine, wolfKill, wolfPartner } from "../src/engine/policy";
import { HUMAN } from "../src/engine/roster";
import type { GameState } from "../src/engine/types";
import { FIXTURE_LINES, accuseBare, accuseWithEvidence, measure } from "./fixtures";

const L = FIXTURE_LINES;
const id = (s: GameState, name: string) => s.players.findIndex((p) => p.name === name);
const say = (s: GameState, m: ReturnType<typeof measure>) => reduce(s, { t: "human", text: "x", m }, L);

/** A seed where the named players are plain villagers. */
function seedWhere(pred: (s: GameState) => boolean, opts?: Parameters<typeof createGame>[1]): GameState {
  for (let i = 0; i < 500; i++) {
    const s = createGame(`seed-${i}`, opts);
    if (pred(s)) return s;
  }
  throw new Error("no seed matched");
}

describe("planTurn", () => {
  it("accuses with evidence when a fact about the suspect exists", () => {
    let s = seedWhere((g) => g.players[id(g, "Mara")].role === "villager" && g.players[id(g, "Kip")].role === "villager", { humanRole: "villager" });
    const mara = id(s, "Mara");
    const kip = id(s, "Kip");
    // Kip contradicts himself today (measured), and the human accuses him with evidence: Mara's belief rises.
    s.queue.unshift({ speaker: kip });
    s = reduce(s, { t: "ai", speaker: kip, lineId: "kip.chatter.calm.1", target: null, m: measure({ nouls: { contradicts_own_claim: 0.9 } }) }, L);
    s = say(s, accuseWithEvidence("Kip"));
    s = say(s, accuseWithEvidence("Kip"));
    const plan = planTurn(s, mara, L);
    expect(plan.intent).toBe("accuse_evidence");
    expect(plan.target).toBe(kip);
    expect(plan.fact?.kind).toBe("contradiction");
    expect(plan.measured).toBe(true);
    expect(plan.candidates.length).toBeGreaterThan(0);
    expect(plan.candidates.every((c) => c.intent === "accuse_evidence" && c.who === "mara")).toBe(true);
  });

  it("accuses bare when suspicious without a fact", () => {
    let s = seedWhere((g) => g.players[id(g, "Tomas")].role === "villager", { humanRole: "villager" });
    const tomas = id(s, "Tomas");
    const other = s.players.find((p) => p.id !== HUMAN && p.id !== tomas && p.role !== "wolf")!;
    s.minds[tomas].logOdds[other.id] = 1.5;
    const plan = planTurn(s, tomas, L);
    expect(plan.intent).toBe("accuse_bare");
    expect(plan.target).toBe(other.id);
  });

  it("defends itself when accused, unless it is Kip, who often bites back", () => {
    let s = seedWhere((g) => g.players[id(g, "Ines")].role === "villager" && g.players[id(g, "Kip")].role === "villager", { humanRole: "villager" });
    const ines = id(s, "Ines");
    s = say(s, accuseBare("Ines"));
    const plan = planTurn(s, ines, L);
    expect(plan.intent).toBe("defend_self");
    expect(plan.target).toBeNull();
    expect(plan.candidates.every((c) => c.needs?.includes("accused"))).toBe(true);

    const intents = new Set<string>();
    for (let i = 0; i < 12; i++) {
      let k = say(seedWhere((g) => g.players[id(g, "Kip")].role === "villager", { humanRole: "villager" }), accuseBare("Kip"));
      k = { ...k, log: [...k.log, ...new Array(i).fill({ kind: "rule", day: 1, text: "pad" })] } as GameState;
      intents.add(planTurn(k, id(k, "Kip"), L).intent);
    }
    expect(intents.has("accuse_bare")).toBe(true);
  });

  it("answers an open question", () => {
    let s = seedWhere((g) => g.players[id(g, "Rook")].role === "villager", { humanRole: "villager" });
    s = say(s, measure({ nouls: { asks_question: 0.9 }, intent: "question", target: "Rook" }));
    const plan = planTurn(s, id(s, "Rook"), L);
    expect(plan.intent).toBe("answer");
  });

  it("the seer claims after finding a wolf, then reveals", () => {
    let s = seedWhere((g) => g.players[HUMAN].role === "villager");
    const seer = s.players.find((p) => p.role === "seer")!.id;
    const wolf = s.players.find((p) => p.role === "wolf")!.id;
    s.minds[seer].checks[wolf] = true;
    s.minds[seer].unrevealed = [wolf];
    let plan = planTurn(s, seer, L);
    expect(plan.intent).toBe("claim_seer");
    s.minds[seer].claimed = true;
    plan = planTurn(s, seer, L);
    expect(plan.intent).toBe("reveal_wolf");
    expect(plan.target).toBe(wolf);
  });

  it("the seer counter-claims a false claimant", () => {
    let s = seedWhere((g) => g.players[HUMAN].role === "villager");
    const seer = s.players.find((p) => p.role === "seer")!.id;
    s = say(s, measure({ nouls: { claims_seer: 0.9 }, intent: "claim" }));
    const plan = planTurn(s, seer, L);
    expect(plan.intent).toBe("counter_claim");
    expect(plan.target).toBe(HUMAN);
  });

  it("questions the quiet when nothing is pressing", () => {
    const s = seedWhere((g) => g.players[id(g, "Sol")].role === "villager", { humanRole: "villager" });
    const plan = planTurn(s, id(s, "Sol"), L);
    expect(["question", "chatter"]).toContain(plan.intent);
    if (plan.intent === "question") expect(plan.target).not.toBeNull();
  });

  it("does not pile a second question on someone still owed an answer", () => {
    let s = createGame("pile", { humanRole: "villager" });
    s.queue = s.queue.filter((q) => !q.event);
    const [first, second] = [s.queue[0].speaker, s.queue[1].speaker];
    const line = L.find((l) => l.who === s.players[first].personality && l.intent === "question")!;
    s = reduce(s, { t: "ai", speaker: first, lineId: line.id, target: HUMAN, m: measure({ nouls: { asks_question: 0.9 }, intent: "question", target: "Stranger" }) }, L);
    const plan = planTurn(s, second, L);
    expect(plan.intent === "question" && plan.target === HUMAN).toBe(false);
  });

  it("an authored question opens a question even when the judge scored it low", () => {
    let s = createGame("lowq", { humanRole: "villager" });
    s.queue = s.queue.filter((q) => !q.event);
    const [first, second] = [s.queue[0].speaker, s.queue[1].speaker];
    const line = L.find((l) => l.who === s.players[first].personality && l.intent === "question")!;
    // Ask the human with a measurement that did not fire, then ask another villager the same way.
    s = reduce(s, { t: "ai", speaker: first, lineId: line.id, target: HUMAN, m: measure() }, L);
    expect(planTurn(s, second, L).target === HUMAN && planTurn(s, second, L).intent === "question").toBe(false);
    const third = s.queue[1].speaker;
    const line2 = L.find((l) => l.who === s.players[second].personality && l.intent === "question")!;
    s = reduce(s, { t: "ai", speaker: second, lineId: line2.id, target: third, m: measure() }, L);
    expect(s.minds[third].asked).toEqual({ by: second, at: s.log.length - 1 });
    expect(planTurn(s, third, L).intent).toBe("answer");
  });

  it("rebukes the human who talks to the game", () => {
    let s = createGame("rebuke", { humanRole: "villager" });
    s = say(s, measure({ nouls: { addresses_system: 0.95 } }));
    const plan = planTurn(s, s.queue[0].speaker, L);
    expect(plan.intent).toBe("rebuke");
    expect(plan.target).toBe(HUMAN);
    expect(plan.measured).toBe(false);
  });

  it("event turns pick one unmeasured line", () => {
    const s = createGame("greet");
    const first = s.queue[0];
    expect(first.event).toBe("greet");
    const plan = planTurn(s, first.speaker, L, "greet");
    expect(plan.intent).toBe("greet");
    expect(plan.candidates).toHaveLength(1);
    expect(plan.measured).toBe(false);
    expect(plan.mirror).toBe(false);
  });

  it("wolves mirror their candidates and ride the room", () => {
    let s = seedWhere((g) => g.players[HUMAN].role === "villager");
    const wolf = s.players.find((p) => p.role === "wolf")!.id;
    const partner = wolfPartner(s.players, wolf)!;
    // The room suspects a villager; the wolf's own pretend mind suspects its partner most.
    const victim = s.players.find((p) => p.id !== HUMAN && p.role === "villager")!.id;
    for (const m of Object.values(s.minds)) if (m.id !== wolf) m.logOdds[victim] = 1.2;
    s.minds[wolf].logOdds[partner] = 2;
    const plan = planTurn(s, wolf, L);
    expect(plan.target).not.toBe(partner);
    expect(plan.target).toBe(victim);
    expect(plan.mirror).toBe(true);
  });

  it("never repeats a line it said recently when others exist", () => {
    let s = createGame("norepeat", { humanRole: "villager" });
    const speaker = s.queue.find((q) => !q.event)!.speaker;
    s.queue = [{ speaker }, { speaker }];
    const first = planTurn(s, speaker, L);
    s = reduce(s, { t: "ai", speaker, lineId: first.candidates[0].id, target: first.target, m: measure() }, L);
    const second = planTurn(s, speaker, L);
    expect(second.candidates.map((c) => c.id)).not.toContain(first.candidates[0].id);
  });
});

describe("votes, kills and checks", () => {
  it("AI wolves never vote for their partner and villagers vote their top suspect", () => {
    for (const seed of ["v1", "v2", "v3"]) {
      let s = createGame(seed, { humanRole: "villager" });
      for (const m of Object.values(s.minds)) m.logOdds = m.logOdds.map((_, i) => (i * 3 + m.id) % 5);
      const votes = aiVotes(s);
      expect(votes).toHaveLength(7);
      for (const v of votes) {
        const voter = s.players[v.voter];
        if (voter.role === "wolf") expect(v.target).not.toBe(wolfPartner(s.players, v.voter));
        expect(v.target).not.toBe(v.voter);
        if (v.target !== null) expect(s.players[v.target].alive).toBe(true);
      }
    }
  });

  it("Tomas votes with the plurality when his own suspect is not clear", () => {
    const s = createGame("herdvote", { humanRole: "villager" });
    const tomas = id(s, "Tomas");
    const votes = aiVotes(s);
    const before = votes.slice(0, votes.findIndex((v) => v.voter === tomas));
    if (before.length >= 2) {
      const counts = new Map<number | null, number>();
      for (const v of before) counts.set(v.target, (counts.get(v.target) ?? 0) + 1);
      const lead = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
      expect(votes.find((v) => v.voter === tomas)!.target).toBe(lead);
    }
    expect(PERSONALITY.tomas.weights.herd).toBeGreaterThan(0);
  });

  it("wolves kill a non-wolf, preferring the villager who has them figured out", () => {
    let s = createGame("kill", { humanRole: "villager" });
    const wolves = s.players.filter((p) => p.role === "wolf").map((p) => p.id);
    const sharp = s.players.find((p) => p.id !== HUMAN && p.role === "villager")!.id;
    for (const w of wolves) s.minds[sharp].logOdds[w] = 4;
    const kill = wolfKill(s);
    expect(kill).toBe(sharp);
    expect(wolves).not.toContain(kill);
  });

  it("wolves come for the human who accused one of them with evidence", () => {
    let s = createGame("hunt", { humanRole: "villager" });
    const wolfName = s.players.find((p) => p.role === "wolf")!.name;
    s = say(s, accuseWithEvidence(wolfName));
    expect(wolfKill(s)).toBe(HUMAN);
  });

  it("the seer checks its top suspect and never twice", () => {
    const s = createGame("check", { humanRole: "villager" });
    const seer = s.players.find((p) => p.role === "seer")!.id;
    const suspect = s.players.find((p) => p.id !== seer && p.id !== HUMAN)!.id;
    s.minds[seer].logOdds[suspect] = 3;
    expect(seerCheck(s, seer)).toBe(suspect);
    s.minds[seer].checks[suspect] = false;
    expect(seerCheck(s, seer)).not.toBe(suspect);
  });

  it("vote lines address the target", () => {
    const s = createGame("voteline");
    const line = voteLine(s, 1, 2, L)!;
    expect(line.intent).toBe("vote");
    expect(renderLine(line.text, "Tomas")).toMatch(/^Tomas[.,]/);
  });
});

describe("renderLine", () => {
  it("fills the vocative and leaves other text alone", () => {
    expect(renderLine("{target}. Sit down.", "Kip")).toBe("Kip. Sit down.");
    expect(renderLine("Nobody move.", "Kip")).toBe("Nobody move.");
  });
});
