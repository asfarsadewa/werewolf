import { describe, expect, it } from "vitest";
import { DISPLAY_CAP, credibility, logit, normalised, priorLogOdds, rowOffset, sigmoid, standing } from "../src/engine/belief";
import { movements, renormalisedStep } from "../src/engine/explain";
import { openQuestionFor } from "../src/engine/facts";
import { createGame, reduce } from "../src/engine/game";
import { LOG_ODDS_MAX, LOG_ODDS_MIN, PERSONALITY, THRESHOLDS } from "../src/engine/personality";
import { HUMAN } from "../src/engine/roster";
import type { GameState } from "../src/engine/types";
import { FIXTURE_LINES, accuseBare, accuseWithEvidence, measure } from "./fixtures";

const L = FIXTURE_LINES;
const id = (s: GameState, name: string) => s.players.findIndex((p) => p.name === name);
const say = (s: GameState, m: ReturnType<typeof measure>) => reduce(s, { t: "human", text: "x", m }, L);

/** Updates caused by the last message, for one mind about one player. */
function updatesFor(s: GameState, mind: number, about: number) {
  const at = s.log.length - 1;
  return s.updates.filter((u) => u.at === at && u.mind === mind && u.about === about);
}

describe("prior and normalisation", () => {
  it("starts uniform: two wolves among seven others", () => {
    expect(priorLogOdds(8, 2)).toBeCloseTo(Math.log(0.4), 3);
    const s = createGame("norm");
    const row = normalised(s.minds[1], s.players);
    expect(row.reduce((a, b) => a + b, 0)).toBeCloseTo(2, 2);
    expect(row[1]).toBe(0);
  });

  it("keeps the expected wolf count after arbitrary log-odds", () => {
    const s = createGame("sum");
    const mind = s.minds[3];
    mind.logOdds = mind.logOdds.map((_, i) => ((i * 7919) % 13) - 6);
    const row = normalised(mind, s.players);
    expect(row.reduce((a, b) => a + b, 0)).toBeCloseTo(2, 2);
    expect(Math.max(...row)).toBeLessThanOrEqual(0.99);
  });

  it("shifts the row by a common offset: log-odds differences survive, and the offset is what makes the sum", () => {
    const s = createGame("shift");
    const mind = s.minds[3];
    mind.logOdds = mind.logOdds.map((_, i) => [0.4, -1.2, 1.8, 0, -0.5, 0.9, -2, 0.2][i]);
    const row = normalised(mind, s.players);
    const c = rowOffset(mind, s.players);
    const ids = s.players.filter((p) => p.id !== mind.id).map((p) => p.id);
    expect(ids.reduce((sum, id) => sum + row[id], 0)).toBeCloseTo(2, 2);
    for (const a of ids) {
      for (const b of ids) {
        if (row[a] >= DISPLAY_CAP || row[b] >= DISPLAY_CAP) continue;
        expect(logit(row[a]) - logit(row[b])).toBeCloseTo(mind.logOdds[a] - mind.logOdds[b], 1);
      }
    }
    for (const id of ids) expect(row[id]).toBeCloseTo(sigmoid(mind.logOdds[id] + c), 2);
    // A uniform row needs no shift at all.
    expect(rowOffset(createGame("flat").minds[1], s.players)).toBeCloseTo(0, 3);
  });

  it("drops the target sum when a wolf is dead", () => {
    const s = createGame("dead");
    const wolf = s.players.find((p) => p.role === "wolf")!;
    wolf.alive = false;
    const row = normalised(s.minds[wolf.id === 1 ? 2 : 1], s.players);
    expect(row.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 2);
  });
});

describe("the confidence gate", () => {
  it("a signal just below its threshold changes nothing", () => {
    const s0 = createGame("gate");
    const kip = id(s0, "Kip");
    const s = say(s0, measure({ nouls: { accuses_with_evidence: THRESHOLDS.accuses_with_evidence - 0.01, accuses_without_evidence: 0.69, contradicts_own_claim: 0.64, deflects: 0.69 }, target: "Kip", specificity: 3, persuasiveness: 2 }));
    expect(s.updates.filter((u) => u.about === kip || u.about === HUMAN)).toHaveLength(0);
    expect(normalised(s.minds[1], s.players)[kip]).toBeCloseTo(2 / 7, 2);
  });

  it("a signal at its threshold counts", () => {
    const s0 = createGame("gate2");
    const s = say(s0, measure({ nouls: { accuses_with_evidence: THRESHOLDS.accuses_with_evidence }, target: "Kip", specificity: 3, persuasiveness: 2 }));
    expect(updatesFor(s, 1, id(s, "Kip"))).toHaveLength(1);
  });

  it("a target the Choice is unsure about is ignored", () => {
    const s0 = createGame("target");
    const s = say(s0, measure({ nouls: { accuses_with_evidence: 0.95 }, target: "Kip", targetP: 0.3, specificity: 3, persuasiveness: 2 }));
    expect(s.updates.filter((u) => u.about === id(s, "Kip"))).toHaveLength(0);
  });
});

describe("accusations", () => {
  it("evidence moves every villager by its own weight, specificity, persuasiveness and the speaker's credibility", () => {
    const s0 = createGame("evidence");
    const s = say(s0, accuseWithEvidence("Kip", 3, 2, 0.9));
    const kip = id(s, "Kip");
    for (const mind of Object.values(s.minds)) {
      if (mind.id === kip) continue;
      const w = PERSONALITY[mind.personality].weights;
      const cred = 1 - 2 / 7;
      const [u] = updatesFor(s, mind.id, kip);
      expect(u.signal).toBe("accuses_with_evidence");
      expect(u.p).toBe(0.9);
      expect(u.threshold).toBe(THRESHOLDS.accuses_with_evidence);
      expect(u.weight).toBe(w.evidence);
      expect(u.delta).toBeCloseTo(w.evidence * 1 * 1 * cred, 2);
      expect(u.factors.map((f) => f.name)).toEqual(["specificity", "persuasiveness", "credibility"]);
      expect(u.after).toBeCloseTo(priorLogOdds(8, 2) + u.delta, 2);
    }
    // Mara moves most on evidence; Sol least.
    const mara = updatesFor(s, id(s, "Mara"), kip)[0].delta;
    const sol = updatesFor(s, id(s, "Sol"), kip)[0].delta;
    expect(mara).toBeGreaterThan(sol);
  });

  it("scales with specificity and persuasiveness", () => {
    const s0 = createGame("scale");
    const a = say(s0, accuseWithEvidence("Kip", 3, 2));
    const b = say(s0, accuseWithEvidence("Kip", 1.5, 1));
    const kip = id(a, "Kip");
    expect(updatesFor(b, 1, kip)[0].delta).toBeCloseTo(updatesFor(a, 1, kip)[0].delta * 0.5 * 0.5, 2);
  });

  it("bare accusations are discounted by skepticism and barely move Mara", () => {
    const s0 = createGame("bare");
    const s = say(s0, accuseBare("Kip"));
    const kip = id(s, "Kip");
    const mara = updatesFor(s, id(s, "Mara"), kip)[0];
    const tomas = updatesFor(s, id(s, "Tomas"), kip)[0];
    const wm = PERSONALITY.mara.weights;
    const wt = PERSONALITY.tomas.weights;
    const cred = 1 - 2 / 7;
    expect(mara.delta).toBeCloseTo(wm.bare * (1 - wm.skepticism) * cred, 2);
    expect(tomas.delta).toBeCloseTo(wt.bare * (1 - wt.skepticism) * cred, 2);
    expect(tomas.delta).toBeGreaterThan(mara.delta * 5);
  });

  it("a suspected speaker is less credible", () => {
    let s = createGame("cred");
    const kip = id(s, "Kip");
    const bel = id(s, "Bel");
    // Make Bel suspicious of the human first.
    s.minds[bel].logOdds[HUMAN] = 2;
    const before = credibility(s.minds[bel], HUMAN, s.players);
    expect(before).toBeLessThan(0.5);
    s = say(s, accuseWithEvidence("Kip"));
    const u = updatesFor(s, bel, kip)[0];
    expect(u.factors.find((f) => f.name === "credibility")!.value).toBeCloseTo(before, 2);
    expect(u.delta).toBeCloseTo(PERSONALITY.bel.weights.evidence * before, 2);
  });

  it("the accused holds a grudge only if their personality does", () => {
    const s0 = createGame("grudge");
    const s = say(s0, accuseBare("Kip"));
    const kip = id(s, "Kip");
    const g = updatesFor(s, kip, HUMAN).find((u) => u.signal === "grudge");
    expect(g).toBeDefined();
    expect(g!.delta).toBe(PERSONALITY.kip.weights.grudge);
    expect(s.minds[kip].accusedToday).toEqual([HUMAN]);
    expect(s.minds[kip].grudges[HUMAN]).toBe(1);
    const s2 = say(s0, accuseBare("Mara"));
    expect(updatesFor(s2, id(s2, "Mara"), HUMAN).find((u) => u.signal === "grudge")).toBeUndefined();
  });
});

describe("what a speaker gives away", () => {
  it("a contradiction raises suspicion of the speaker in every mind", () => {
    const s = say(createGame("contra"), measure({ nouls: { contradicts_own_claim: 0.8 } }));
    for (const mind of Object.values(s.minds)) {
      const [u] = updatesFor(s, mind.id, HUMAN);
      expect(u.signal).toBe("contradicts_own_claim");
      expect(u.delta).toBe(PERSONALITY[mind.personality].weights.contradiction);
    }
    expect(updatesFor(s, id(s, "Rook"), HUMAN)[0].delta).toBeGreaterThan(updatesFor(s, id(s, "Ines"), HUMAN)[0].delta);
  });

  it("contradicting a fact costs one and a half times as much", () => {
    const s = say(createGame("fact"), measure({ nouls: { contradicts_fact: 0.9 } }));
    const u = updatesFor(s, 1, HUMAN)[0];
    expect(u.delta).toBeCloseTo(PERSONALITY.mara.weights.contradiction * 1.5, 3);
    expect(u.factors).toEqual([{ name: "fact multiplier", value: 1.5 }]);
  });

  it("deflecting hurts most with Bel", () => {
    const s = say(createGame("deflect"), measure({ nouls: { deflects: 0.85 } }));
    const bel = updatesFor(s, id(s, "Bel"), HUMAN)[0].delta;
    const ines = updatesFor(s, id(s, "Ines"), HUMAN)[0].delta;
    expect(bel).toBe(PERSONALITY.bel.weights.deflect);
    expect(bel).toBeGreaterThan(ines * 2);
  });

  it("a persuasive self-defence lowers suspicion, a deflecting one does not", () => {
    const good = say(createGame("self"), measure({ nouls: { defends_self: 0.9 }, persuasiveness: 2 }));
    const u = updatesFor(good, id(good, "Ines"), HUMAN)[0];
    expect(u.signal).toBe("defends_self");
    expect(u.delta).toBeCloseTo(-PERSONALITY.ines.weights.selfDefence, 3);
    const dodge = say(createGame("self2"), measure({ nouls: { defends_self: 0.9, deflects: 0.8 }, persuasiveness: 2 }));
    expect(updatesFor(dodge, id(dodge, "Ines"), HUMAN).map((x) => x.signal)).toEqual(["deflects"]);
  });

  it("vouching for someone lowers suspicion of them, weighted by persuasiveness", () => {
    const s = say(createGame("vouch"), measure({ nouls: { defends_other: 0.9 }, target: "Kip", persuasiveness: 1 }));
    const u = updatesFor(s, id(s, "Ines"), id(s, "Kip"))[0];
    expect(u.signal).toBe("defends_other");
    expect(u.delta).toBeCloseTo(-PERSONALITY.ines.weights.defence * 0.5 * (1 - 2 / 7), 2);
  });

  it("Tomas drifts toward the room", () => {
    const s = say(createGame("herd"), accuseWithEvidence("Kip"));
    const tomas = id(s, "Tomas");
    const herd = updatesFor(s, tomas, id(s, "Kip")).find((u) => u.signal === "herd");
    expect(herd).toBeDefined();
    expect(herd!.weight).toBe(PERSONALITY.tomas.weights.herd);
    for (const mind of Object.values(s.minds)) {
      if (mind.id === tomas) continue;
      expect(s.updates.some((u) => u.mind === mind.id && u.signal === "herd")).toBe(false);
    }
  });

  it("questions and rebukes are bookkeeping, not belief", () => {
    const s = say(createGame("ask"), measure({ nouls: { asks_question: 0.9, addresses_system: 0.9 }, target: "Rook", intent: "question" }));
    expect(openQuestionFor(s, id(s, "Rook"))).toEqual({ by: HUMAN, at: s.log.length - 1 });
    expect(s.rebuke).toBe(true);
    expect(s.updates).toHaveLength(0);
  });
});

describe("claims", () => {
  it("a lone seer claim earns trust", () => {
    const s = say(createGame("claim"), measure({ nouls: { claims_seer: 0.9 }, intent: "claim" }));
    expect(s.claims).toEqual([{ claimant: HUMAN, day: 1, at: s.log.length - 1 }]);
    const u = updatesFor(s, id(s, "Sol"), HUMAN)[0];
    expect(u.signal).toBe("claims_seer");
    expect(u.delta).toBe(-PERSONALITY.sol.weights.claimTrust);
  });

  it("a second claim spreads suspicion over both claimants and withdraws the first's trust", () => {
    let s = say(createGame("counter"), measure({ nouls: { claims_seer: 0.9 }, intent: "claim" }));
    const rook = id(s, "Rook");
    // Rook counter-claims through an AI turn recorded as a measured message.
    s.queue.unshift({ speaker: rook });
    s = reduce(s, { t: "ai", speaker: rook, lineId: "rook.claim_seer.calm.1", target: null, m: measure({ nouls: { claims_seer: 0.95 }, intent: "claim" }) }, L);
    expect(s.claims.map((c) => c.claimant)).toEqual([HUMAN, rook]);
    const w = PERSONALITY.mara.weights;
    const mara = id(s, "Mara");
    const onHuman = updatesFor(s, mara, HUMAN)[0];
    const onRook = updatesFor(s, mara, rook)[0];
    expect(onHuman.signal).toBe("seer_claim_conflict");
    expect(onHuman.delta).toBeCloseTo(w.claimConflict + w.claimTrust, 3);
    expect(onRook.delta).toBeCloseTo(w.claimConflict, 3);
  });

  it("a trusted seer's result moves the table hard", () => {
    let s = say(createGame("result"), measure({ nouls: { claims_seer: 0.9 }, intent: "claim" }));
    const cred = credibility(s.minds[id(s, "Bel")], HUMAN, s.players);
    s = say(s, measure({ nouls: { reveals_night_result: 0.9 }, intent: "claim", target: "Kip", claimed: "wolf" }));
    const kip = id(s, "Kip");
    expect(s.claimedResults).toHaveLength(1);
    const u = updatesFor(s, id(s, "Bel"), kip)[0];
    expect(u.signal).toBe("seer_says_wolf");
    expect(u.delta).toBeCloseTo(PERSONALITY.bel.weights.seerResult * cred, 2);
  });

  it("a false result is exposed when the role is revealed", () => {
    let s = say(createGame("liar", { humanRole: "villager" }), measure({ nouls: { claims_seer: 0.9 }, intent: "claim" }));
    const villager = s.players.find((p) => p.id !== HUMAN && p.role === "villager")!;
    s = say(s, measure({ nouls: { reveals_night_result: 0.9 }, intent: "claim", target: villager.name, claimed: "wolf" }));
    // Eliminate that villager.
    s.queue = [];
    s = reduce(s, { t: "vote", target: villager.id }, L);
    for (const k of Object.keys(s.votes)) s.votes[Number(k)] = villager.id;
    if (s.phase === "vote") s = reduce(s, { t: "vote", target: villager.id }, L);
    const liar = s.updates.filter((u) => u.signal === "false_seer_result" && u.about === HUMAN);
    expect(liar.length).toBeGreaterThan(0);
    expect(liar[0].delta).toBe(3);
  });
});

describe("reveals and memory", () => {
  it("a revealed role fixes everyone's belief and voters are remembered", () => {
    let s = createGame("reveal", { humanRole: "villager" });
    const victim = s.players.find((p) => p.id !== HUMAN && p.role === "villager")!;
    s.queue = [];
    s = reduce(s, { t: "call_vote" }, L);
    for (const k of Object.keys(s.votes)) s.votes[Number(k)] = victim.id;
    s = reduce(s, { t: "vote", target: victim.id }, L);
    expect(s.players[victim.id].alive).toBe(false);
    for (const mind of Object.values(s.minds)) {
      if (mind.id === victim.id) continue;
      expect(mind.logOdds[victim.id]).toBe(LOG_ODDS_MIN);
      // Everyone voted for a villager: every other mind remembers it.
      const memory = s.updates.filter((u) => u.mind === mind.id && u.signal === "voted_for_a_villager" && u.about === HUMAN);
      expect(memory).toHaveLength(1);
      expect(memory[0].delta).toBe(PERSONALITY[mind.personality].weights.voteMemory);
    }
    expect(s.updates.some((u) => u.signal === "role_revealed" && u.about === victim.id && u.after === LOG_ODDS_MIN)).toBe(true);
  });

  it("voting for a wolf earns trust", () => {
    let s = createGame("goodvote", { humanRole: "villager" });
    const wolf = s.players.find((p) => p.role === "wolf")!;
    s.queue = [];
    s = reduce(s, { t: "call_vote" }, L);
    for (const k of Object.keys(s.votes)) s.votes[Number(k)] = wolf.id;
    s = reduce(s, { t: "vote", target: wolf.id }, L);
    const memory = s.updates.filter((u) => u.signal === "voted_for_a_wolf" && u.about === HUMAN);
    expect(memory.length).toBe(Object.values(s.minds).filter((m) => s.players[m.id].alive).length);
    expect(memory[0].delta).toBeLessThan(0);
    expect(s.updates.some((u) => u.signal === "role_revealed" && u.about === wolf.id && u.after === LOG_ODDS_MAX)).toBe(true);
  });

  it("silence at the end of the day costs the quiet", () => {
    let s = createGame("quiet", { humanRole: "villager" });
    s.queue = [];
    s = reduce(s, { t: "human", text: "hello", m: measure() }, L);
    s = reduce(s, { t: "call_vote" }, L);
    const silence = s.updates.filter((u) => u.signal === "silence");
    expect(silence.length).toBeGreaterThan(0);
    expect(silence.some((u) => u.about === HUMAN)).toBe(false);
  });
});

describe("explaining the board", () => {
  it("a cell that moved only because the row was renormalised says so, naming the cause", () => {
    const s0 = createGame("renorm", { humanRole: "villager" });
    const s = say(s0, accuseWithEvidence("Kip"));
    const at = s.log.length - 1;
    const mara = id(s, "Mara");
    const kip = id(s, "Kip");
    const ines = id(s, "Ines");
    // Kip rose by a direct update; Ines fell with no update of her own.
    expect(s.updates.some((u) => u.mind === mara && u.about === ines && u.at === at)).toBe(false);
    expect(s.history[at][mara][ines]).toBeLessThan(s.history[at - 1][mara][ines]);
    const step = renormalisedStep(s, mara, ines, at);
    expect(step).not.toBeNull();
    expect(step!).toBeLessThan(0);
    expect(step!).toBeCloseTo(s.history[at][mara][ines] - s.history[at - 1][mara][ines], 3);
    // Kip's own cell is explained by its update, not as a renormalisation.
    expect(renormalisedStep(s, mara, kip, at)).toBeNull();
    const mv = movements(s, mara, ines, at);
    expect(mv).toHaveLength(1);
    expect(mv[0].kind).toBe("renormalised");
    if (mv[0].kind === "renormalised") {
      expect(mv[0].at).toBe(at);
      expect(mv[0].because).toMatch(/^after Kip \+\d\.\d\d \(accuses_with_evidence\)$/);
    }
    expect(movements(s, mara, kip, at).map((m) => m.kind)).toEqual(["direct"]);
  });

  it("a measurement that arrives later rewrites the snapshot of the message it measured", () => {
    let s = createGame("late", { humanRole: "villager" });
    s = reduce(s, { t: "human", text: "Kip voted badly." }, L);
    const at = s.log.length - 1;
    const mara = id(s, "Mara");
    const kip = id(s, "Kip");
    const before = s.history[at][mara][kip];
    s = reduce(s, { t: "measure", at, m: accuseWithEvidence("Kip") }, L);
    expect(s.history).toHaveLength(s.log.length);
    expect(s.history[at][mara][kip]).toBeGreaterThan(before);
    expect(movements(s, mara, kip, at).map((m) => m.kind)).toEqual(["direct"]);
    // And the same game with the measurement inline lands on the same board.
    let inline = createGame("late", { humanRole: "villager" });
    inline = reduce(inline, { t: "human", text: "Kip voted badly.", m: accuseWithEvidence("Kip") }, L);
    expect(inline.history[at]).toEqual(s.history[at]);
  });

  it("every log entry carries the board as it stood after that entry", () => {
    let s = createGame("entries", { humanRole: "villager" });
    s.queue = [];
    s = reduce(s, { t: "call_vote" }, L);
    const victim = s.players.find((p) => p.id !== HUMAN && p.role === "villager")!.id;
    for (const k of Object.keys(s.votes)) s.votes[Number(k)] = victim;
    s = reduce(s, { t: "vote", target: victim }, L);
    const tallyAt = s.log.findIndex((e) => e.kind === "tally");
    const firstVoteAt = s.log.findIndex((e) => e.kind === "vote");
    const mind = Object.values(s.minds).find((m) => m.id !== victim)!.id;
    // Before the tally the victim's cell is a live number; after it, zero.
    expect(s.history[firstVoteAt][mind][victim]).toBeGreaterThan(0);
    expect(s.history[tallyAt][mind][victim]).toBe(0);
    expect(s.history).toHaveLength(s.log.length);
  });

  it("a death rescales the row and is named as the cause", () => {
    let s = createGame("death-renorm", { humanRole: "villager" });
    s.queue = [];
    s = reduce(s, { t: "call_vote" }, L);
    for (const k of Object.keys(s.votes)) s.votes[Number(k)] = null;
    s = reduce(s, { t: "vote", target: null }, L);
    s = reduce(s, { t: "night" }, L);
    const at = s.log.length - 1;
    const dawn = s.log[at];
    if (dawn.kind !== "dawn" || dawn.killed === null) return;
    const mind = Object.values(s.minds).find((m) => s.players[m.id].alive)!.id;
    const other = s.players.find((p) => p.alive && p.id !== mind && p.id !== HUMAN)!.id;
    expect(s.updates.some((u) => u.mind === mind && u.about === other && u.at === at)).toBe(false);
    const mv = movements(s, mind, other, at).filter((m) => m.at === at);
    expect(mv).toHaveLength(1);
    expect(mv[0].kind).toBe("renormalised");
    if (mv[0].kind === "renormalised") {
      expect(mv[0].delta).toBeGreaterThan(0);
      expect(mv[0].because).toBe(`after ${s.players[dawn.killed].name} left the table`);
    }
  });
});

describe("bounds and standing", () => {
  it("log-odds are clamped", () => {
    let s = createGame("clamp");
    for (let i = 0; i < 12; i++) {
      s.humanMessagesLeft = 3;
      s = say(s, measure({ nouls: { contradicts_fact: 0.99 } }));
    }
    for (const mind of Object.values(s.minds)) expect(mind.logOdds[HUMAN]).toBeLessThanOrEqual(LOG_ODDS_MAX);
    expect(standing(s.minds, s.players, HUMAN)).toBeLessThanOrEqual(0.99);
    expect(sigmoid(LOG_ODDS_MAX)).toBeGreaterThan(0.99);
  });

  it("standing is the mean belief in you across living minds", () => {
    const s = createGame("standing");
    expect(standing(s.minds, s.players, HUMAN)).toBeCloseTo(2 / 7, 2);
  });
});
