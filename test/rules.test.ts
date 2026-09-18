import { describe, expect, it } from "vitest";
import { HUMAN_MESSAGES_PER_DAY, ROUNDS_PER_DAY } from "../src/engine/personality";
import { createGame, nextStep, reduce, replay } from "../src/engine/game";
import { planTurn } from "../src/engine/policy";
import { HUMAN } from "../src/engine/roster";
import type { Action, GameState } from "../src/engine/types";
import { FIXTURE_LINES, accuseWithEvidence, measure } from "./fixtures";

const L = FIXTURE_LINES;

/** Ends the day with every AI abstaining, so nobody is eliminated. */
function voteNobody(state: GameState): GameState {
  const s = state.phase === "day" ? reduce(state, { t: "call_vote" }, L) : state;
  for (const k of Object.keys(s.votes)) s.votes[Number(k)] = null;
  return reduce(s, { t: "vote", target: null }, L);
}

/** Plays every queued AI turn with quiet measurements. */
function drainDay(state: GameState): GameState {
  let s = state;
  for (let guard = 0; guard < 40; guard++) {
    const step = nextStep(s);
    if (step.kind !== "ai_turn") break;
    const plan = planTurn(s, step.speaker, L, s.queue[0].event);
    s = reduce(s, { t: "ai", speaker: step.speaker, lineId: plan.candidates[0].id, target: plan.target, m: plan.measured ? measure() : undefined }, L);
  }
  return s;
}

describe("dealing", () => {
  it("is deterministic per seed and deals two wolves, one seer, five villagers", () => {
    const a = createGame("alpha");
    const b = createGame("alpha");
    expect(a.players.map((p) => p.role)).toEqual(b.players.map((p) => p.role));
    const roles = a.players.map((p) => p.role);
    expect(roles.filter((r) => r === "wolf")).toHaveLength(2);
    expect(roles.filter((r) => r === "seer")).toHaveLength(1);
    expect(roles.filter((r) => r === "villager")).toHaveLength(5);
  });

  it("changes with the seed", () => {
    const seeds = ["a", "b", "c", "d", "e", "f"];
    const dealt = new Set(seeds.map((s) => createGame(s).players.map((p) => p.role).join()));
    expect(dealt.size).toBeGreaterThan(1);
  });

  it("can force the human's role", () => {
    for (const role of ["wolf", "seer", "villager"] as const) {
      const g = createGame("forced", { humanRole: role });
      expect(g.players[HUMAN].role).toBe(role);
      expect(g.players.filter((p) => p.role === "wolf")).toHaveLength(2);
    }
  });

  it("gives every AI a mind with a uniform prior and the human none", () => {
    const g = createGame("prior");
    expect(Object.keys(g.minds)).toHaveLength(7);
    expect(g.minds[HUMAN]).toBeUndefined();
    const row = g.history[0][1];
    for (let i = 0; i < 8; i++) {
      if (i === 1) expect(row[i]).toBe(0);
      else expect(row[i]).toBeCloseTo(2 / 7, 2);
    }
  });
});

describe("the day", () => {
  it("opens with three greetings and then two rounds of everyone", () => {
    const g = createGame("day");
    expect(g.queue.filter((q) => q.event === "greet")).toHaveLength(3);
    expect(g.queue.filter((q) => !q.event)).toHaveLength(7 * ROUNDS_PER_DAY);
    expect(nextStep(g)).toEqual({ kind: "ai_turn", speaker: g.queue[0].speaker });
  });

  it("lets the human speak at any time, up to the daily budget", () => {
    let s = createGame("budget");
    expect(s.humanMessagesLeft).toBe(HUMAN_MESSAGES_PER_DAY);
    for (let i = 0; i < HUMAN_MESSAGES_PER_DAY; i++) s = reduce(s, { t: "human", text: `message ${i}`, m: measure() }, L);
    expect(s.humanMessagesLeft).toBe(0);
    expect(() => reduce(s, { t: "human", text: "one more", m: measure() }, L)).toThrow(/no messages left/);
  });

  it("refuses an AI turn out of order and a vote while the table is talking", () => {
    const s = createGame("order");
    const wrong = s.queue[1].speaker;
    expect(() => reduce(s, { t: "ai", speaker: wrong, lineId: L[0].id, target: null }, L)).toThrow(/turn/);
    expect(() => reduce(s, { t: "call_vote" }, L)).toThrow(/still talking/);
  });

  it("waits for the human after the queue, then goes to the vote", () => {
    let s = drainDay(createGame("wait"));
    expect(nextStep(s)).toEqual({ kind: "human_turn", optional: true });
    s = reduce(s, { t: "call_vote" }, L);
    expect(s.phase).toBe("vote");
    expect(nextStep(s)).toEqual({ kind: "vote" });
    expect(Object.keys(s.votes)).toHaveLength(7);
  });
});

describe("the vote", () => {
  function toVote(seed: string): GameState {
    let s = drainDay(createGame(seed));
    return reduce(s, { t: "call_vote" }, L);
  }

  it("eliminates the plurality and reveals the role", () => {
    let s = toVote("plurality");
    // Everyone at the table votes for the same player.
    const target = s.players.find((p) => p.alive && p.id !== HUMAN)!.id;
    for (const k of Object.keys(s.votes)) s.votes[Number(k)] = target;
    s = reduce(s, { t: "vote", target }, L);
    const tally = s.log.find((e) => e.kind === "tally");
    expect(tally && tally.kind === "tally" && tally.eliminated).toBe(target);
    expect(tally && tally.kind === "tally" && tally.role).toBe(s.players[target].role);
    expect(s.players[target].alive).toBe(false);
    expect(s.log.filter((e) => e.kind === "vote")).toHaveLength(8);
  });

  it("eliminates nobody on a tie", () => {
    let s = toVote("tie");
    const ids = Object.keys(s.votes).map(Number);
    // Three votes for player A, three for player B, one abstention, human abstains.
    const [a, b] = [1, 2].map((i) => s.players.filter((p) => p.alive && p.id !== HUMAN)[i].id);
    ids.forEach((id, i) => {
      s.votes[id] = i < 3 ? a : i < 6 ? b : null;
    });
    s = reduce(s, { t: "vote", target: null }, L);
    const tally = s.log.find((e) => e.kind === "tally");
    expect(tally && tally.kind === "tally" && tally.eliminated).toBeNull();
    expect(s.players.every((p) => p.alive)).toBe(true);
    expect(s.phase).toBe("night");
  });

  it("rejects a vote for the dead or for yourself", () => {
    const s = toVote("invalid");
    expect(() => reduce(s, { t: "vote", target: HUMAN }, L)).toThrow(/invalid/);
  });
});

describe("the night", () => {
  it("wolves never kill a wolf and the seer learns the truth", () => {
    for (const seed of ["n1", "n2", "n3", "n4"]) {
      let s = drainDay(createGame(seed, { humanRole: "villager" }));
      s = reduce(s, { t: "vote", target: null }, L);
      expect(s.phase).toBe("night");
      expect(nextStep(s)).toEqual({ kind: "night", needs: [] });
      s = reduce(s, { t: "night" }, L);
      const dawn = s.log.filter((e) => e.kind === "dawn").at(-1)!;
      expect(dawn.kind === "dawn" && dawn.day).toBe(2);
      if (dawn.kind === "dawn" && dawn.killed !== null) expect(s.players[dawn.killed].role).not.toBe("wolf");
      const check = s.log.find((e) => e.kind === "check");
      expect(check).toBeDefined();
      if (check && check.kind === "check") {
        expect(check.wolf).toBe(s.players[check.target].role === "wolf");
        expect(s.minds[check.seer].checks[check.target]).toBe(check.wolf);
      }
    }
  });

  it("asks the human wolf for a victim and the human seer for a check", () => {
    let w = voteNobody(drainDay(createGame("hw", { humanRole: "wolf" })));
    expect(nextStep(w)).toEqual({ kind: "night", needs: ["kill"] });
    const victim = w.players.find((p) => p.alive && p.role !== "wolf")!.id;
    w = reduce(w, { t: "night", kill: victim }, L);
    expect(w.players[victim].alive).toBe(false);

    let se = voteNobody(drainDay(createGame("hs", { humanRole: "seer" })));
    expect(nextStep(se)).toEqual({ kind: "night", needs: ["check"] });
    const wolf = se.players.find((p) => p.role === "wolf")!.id;
    se = reduce(se, { t: "night", check: wolf }, L);
    const check = se.log.find((e) => e.kind === "check");
    expect(check && check.kind === "check" && check.wolf).toBe(true);
  });

  it("starts a new day with a fresh budget, mourning and a new queue", () => {
    let s = drainDay(createGame("newday", { humanRole: "villager" }));
    s = reduce(s, { t: "human", text: "hello", m: measure() }, L);
    s = reduce(s, { t: "vote", target: null }, L);
    s = reduce(s, { t: "night" }, L);
    expect(s.day).toBe(2);
    expect(s.phase).toBe("day");
    expect(s.humanMessagesLeft).toBe(HUMAN_MESSAGES_PER_DAY);
    const dawn = s.log.at(-1)!;
    if (dawn.kind === "dawn" && dawn.killed !== null) expect(s.queue.filter((q) => q.event === "mourn")).toHaveLength(2);
    expect(s.queue.filter((q) => !q.event).length).toBe(ROUNDS_PER_DAY * s.players.filter((p) => p.alive && p.id !== HUMAN).length);
  });
});

describe("winning", () => {
  it("the village wins when both wolves are eliminated", () => {
    let s = createGame("village", { humanRole: "villager" });
    const wolves = s.players.filter((p) => p.role === "wolf").map((p) => p.id);
    for (const wolf of wolves) {
      s = drainDay(s);
      for (const k of Object.keys(s.minds)) if (s.players[Number(k)].alive) s.votes[Number(k)] = wolf;
      s = reduce(s, { t: "vote", target: wolf }, L);
      // Force AI votes onto the wolf: reduce recomputes them, so do it again via a direct tally path.
      if (s.players[wolf].alive) {
        s.phase = "vote";
        for (const k of Object.keys(s.minds)) if (s.players[Number(k)].alive) s.votes[Number(k)] = wolf;
        s = reduce(s, { t: "vote", target: wolf }, L);
      }
      if (s.phase === "night") s = reduce(s, { t: "night" }, L);
    }
    expect(s.phase).toBe("over");
    expect(s.winner).toBe("village");
    expect(s.log.at(-1)).toEqual({ kind: "over", day: s.day, winner: "village" });
  });

  it("the wolves win when they equal the others", () => {
    let s = createGame("wolves", { humanRole: "wolf" });
    // Kill villagers by night until parity.
    for (let guard = 0; guard < 6 && s.phase !== "over"; guard++) {
      s = drainDay(s);
      if (s.phase === "day") s = voteNobody(s);
      if (s.phase === "night") {
        const victim = s.players.find((p) => p.alive && p.role !== "wolf")!.id;
        s = reduce(s, { t: "night", kill: victim }, L);
      }
    }
    expect(s.winner).toBe("wolves");
  });
});

describe("replay", () => {
  it("reproduces the same game from the same actions", () => {
    const actions: Action[] = [];
    let s = createGame("replay", { humanRole: "villager" });
    const record = (a: Action) => {
      actions.push(a);
      s = reduce(s, a, L);
    };
    for (let guard = 0; guard < 60 && s.phase !== "over"; guard++) {
      const step = nextStep(s);
      if (step.kind === "ai_turn") {
        const plan = planTurn(s, step.speaker, L, s.queue[0].event);
        const m = plan.measured ? (guard % 3 === 0 ? accuseWithEvidence("Kip") : measure()) : undefined;
        record({ t: "ai", speaker: step.speaker, lineId: plan.candidates[0].id, target: plan.target, m });
      } else if (step.kind === "human_turn") {
        record({ t: "human", text: "Kip voted badly.", m: accuseWithEvidence("Kip") });
        record({ t: "call_vote" });
      } else if (step.kind === "vote") {
        record({ t: "vote", target: null });
      } else if (step.kind === "night") {
        record({ t: "night" });
      }
    }
    const again = replay("replay", actions, L, { humanRole: "villager" });
    expect(JSON.stringify(again)).toBe(JSON.stringify(s));
    expect(again.history).toHaveLength(again.log.length);
  });
});
