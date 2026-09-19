import { describe, expect, it } from "vitest";
import { ALL_LINES } from "../src/engine/lines";
import { NAMES } from "../src/engine/roster";
import { SESSION_TTL_MS, issueSession, verifySession } from "../src/worker/session";
import { parseHostnames, verifyTurnstile } from "../src/worker/turnstile";
import { ValidationError, normalize, parseJudgeRequest, parseSessionRequest, parseTurnRequest } from "../src/worker/validate";

const SECRET = "a-long-enough-secret-for-tests-0123456789";

describe("sessions", () => {
  it("issues a token that verifies until it expires", async () => {
    const now = 1_700_000_000_000;
    const { token, session } = await issueSession(SECRET, now);
    expect(token.split(".")).toHaveLength(2);
    expect(session.exp).toBe(now + SESSION_TTL_MS);
    const ok = await verifySession(SECRET, token, now + 1000);
    expect(ok).toEqual(session);
    expect(await verifySession(SECRET, token, session.exp)).toBeNull();
  });

  it("rejects tampering, the wrong secret and junk", async () => {
    const { token } = await issueSession(SECRET);
    const [payload, sig] = token.split(".");
    expect(await verifySession(SECRET, `${payload}x.${sig}`)).toBeNull();
    expect(await verifySession(SECRET, `${payload}.${sig.slice(0, -2)}aa`)).toBeNull();
    expect(await verifySession("another-secret-that-is-long-enough", token)).toBeNull();
    expect(await verifySession(SECRET, "")).toBeNull();
    expect(await verifySession(SECRET, 42)).toBeNull();
    expect(await verifySession(SECRET, "not-a-token")).toBeNull();
    expect(await verifySession(SECRET, "a".repeat(600))).toBeNull();
  });

  it("refuses a weak secret", async () => {
    await expect(issueSession("short")).rejects.toThrow(/too short/);
  });
});

describe("normalize", () => {
  it("collapses whitespace and strips control characters", () => {
    expect(normalize("  hello\r\n\r\n\r\nworld  ")).toBe("hello\n\nworld");
    expect(normalize("a \t b")).toBe("a b");
  });
});

describe("parseSessionRequest", () => {
  it("needs a turnstile token", () => {
    expect(parseSessionRequest({ token: "t" })).toEqual({ token: "t" });
    expect(() => parseSessionRequest({})).toThrow(/token missing/);
    expect(() => parseSessionRequest({ token: "x".repeat(3000) })).toThrow(/too long/);
    expect(() => parseSessionRequest(null)).toThrow(ValidationError);
  });
});

describe("parseJudgeRequest", () => {
  const good = {
    session: "s",
    state: {
      speaker: "Stranger",
      message: "Kip, why did you vote for Ines?",
      players: [...NAMES],
      facts: ["Day 2."],
      speaker_earlier_statements: [],
      recent: ["Kip: I was home."],
      accusations_against_speaker: [],
      asked_of_speaker: null,
    },
  };

  it("accepts a well formed request", () => {
    const r = parseJudgeRequest(good);
    expect(r.session).toBe("s");
    expect(r.state.message).toBe(good.state.message);
    expect(r.state.players).toEqual(NAMES);
  });

  it("bounds every field and insists on roster names", () => {
    expect(() => parseJudgeRequest({ ...good, session: undefined })).toThrow(/session/);
    expect(() => parseJudgeRequest({ ...good, state: { ...good.state, speaker: "Eve" } })).toThrow(/player name/);
    expect(() => parseJudgeRequest({ ...good, state: { ...good.state, message: "" } })).toThrow(/empty/);
    expect(() => parseJudgeRequest({ ...good, state: { ...good.state, message: "x".repeat(281) } })).toThrow(/at most 280/);
    expect(() => parseJudgeRequest({ ...good, state: { ...good.state, players: ["Kip", "Kip"] } })).toThrow(/distinct/);
    expect(() => parseJudgeRequest({ ...good, state: { ...good.state, players: [] } })).toThrow(/living/);
    expect(() => parseJudgeRequest({ ...good, state: { ...good.state, facts: new Array(13).fill("f") } })).toThrow(/too many/);
    expect(() => parseJudgeRequest({ ...good, state: { ...good.state, recent: ["y".repeat(400)] } })).toThrow(/too long/);
    expect(() => parseJudgeRequest({ ...good, state: { ...good.state, asked_of_speaker: 5 } })).toThrow(/asked_of_speaker/);
    expect(() => parseJudgeRequest({ ...good, state: { ...good.state, facts: "Day 2." } })).toThrow(/array/);
  });

  it("defaults optional arrays to empty", () => {
    const r = parseJudgeRequest({ session: "s", state: { speaker: "Kip", message: "hi", players: ["Kip", "Stranger"] } });
    expect(r.state.facts).toEqual([]);
    expect(r.state.asked_of_speaker).toBeNull();
    expect(r.state.cited_fact).toBeNull();
  });

  it("carries a bounded cited fact", () => {
    const withFact = parseJudgeRequest({ ...good, state: { ...good.state, cited_fact: "Kip voted for Ines on day 1; Ines was a villager." } });
    expect(withFact.state.cited_fact).toBe("Kip voted for Ines on day 1; Ines was a villager.");
    expect(parseJudgeRequest({ ...good, state: { ...good.state, cited_fact: "   " } }).state.cited_fact).toBeNull();
    expect(() => parseJudgeRequest({ ...good, state: { ...good.state, cited_fact: 7 } })).toThrow(/cited_fact/);
    expect(() => parseJudgeRequest({ ...good, state: { ...good.state, cited_fact: "x".repeat(201) } })).toThrow(/too long/);
  });
});

describe("parseTurnRequest", () => {
  const mara = ALL_LINES.filter((l) => l.who === "mara");
  const targeted = mara.find((l) => l.text.startsWith("{target}"))!;
  const plain = mara.find((l) => !l.text.includes("{target}"))!;
  const base = { session: "s", state: { speaker: "Mara", facts: [], recent: [] } };

  it("renders authored candidates for the speaker with the target filled", () => {
    const r = parseTurnRequest({ ...base, candidates: [targeted.id, plain.id], target: "Kip", mirror: true });
    expect(r.candidateIds).toEqual([targeted.id, plain.id]);
    expect(r.state.candidates[0].startsWith("Kip")).toBe(true);
    expect(r.state.candidates[1]).toBe(plain.text);
    expect(r.mirror).toBe(true);
    expect(parseTurnRequest({ ...base, candidates: [plain.id] }).mirror).toBe(false);
    expect(r.state.cited_fact).toBeNull();
    const cited = parseTurnRequest({ ...base, state: { ...base.state, cited_fact: "Kip has said nothing today." }, candidates: [plain.id] });
    expect(cited.state.cited_fact).toBe("Kip has said nothing today.");
  });

  it("rejects unknown lines, other villagers' lines, missing targets and duplicates", () => {
    expect(() => parseTurnRequest({ ...base, candidates: ["mara.nope.calm.1"] })).toThrow(/authored/);
    const bel = ALL_LINES.find((l) => l.who === "bel" && !l.text.includes("{target}"))!;
    expect(() => parseTurnRequest({ ...base, candidates: [bel.id] })).toThrow(/does not belong/);
    expect(() => parseTurnRequest({ ...base, candidates: [targeted.id] })).toThrow(/needs a target/);
    expect(() => parseTurnRequest({ ...base, candidates: [plain.id, plain.id] })).toThrow(/distinct/);
    expect(() => parseTurnRequest({ ...base, candidates: [] })).toThrow(/1 to 8/);
    expect(() => parseTurnRequest({ ...base, candidates: new Array(9).fill(plain.id) })).toThrow(/1 to 8/);
    expect(() => parseTurnRequest({ ...base, candidates: [targeted.id], target: "Mara" })).toThrow(/themselves/);
    expect(() => parseTurnRequest({ ...base, candidates: [targeted.id], target: "Eve" })).toThrow(/player name/);
  });
});

describe("parseHostnames", () => {
  it("splits, trims and lowercases", () => {
    expect([...parseHostnames(" Example.com, localhost ,")]).toEqual(["example.com", "localhost"]);
    expect(parseHostnames(undefined).size).toBe(0);
  });
});

describe("verifyTurnstile", () => {
  const hosts = new Set(["example.com"]);
  const respond = (body: unknown, status = 200) => async () => new Response(JSON.stringify(body), { status });
  const base = { secret: "s", token: "tok", expectedAction: "start", expectedHostnames: hosts };

  it("passes when success, action and hostname all match", async () => {
    const r = await verifyTurnstile({ ...base, fetchImpl: respond({ success: true, action: "start", hostname: "example.com" }) });
    expect(r).toEqual({ ok: true, hostname: "example.com" });
  });

  it("fails closed on mismatches and errors", async () => {
    expect((await verifyTurnstile({ ...base, fetchImpl: respond({ success: true, action: "login", hostname: "example.com" }) })).reason).toBe("action mismatch");
    expect((await verifyTurnstile({ ...base, fetchImpl: respond({ success: true, action: "start", hostname: "evil.com" }) })).reason).toBe("hostname mismatch");
    expect((await verifyTurnstile({ ...base, fetchImpl: respond({ success: false, "error-codes": ["timeout-or-duplicate"] }) })).reason).toBe("timeout-or-duplicate");
    expect((await verifyTurnstile({ ...base, fetchImpl: respond({}, 500) })).reason).toBe("siteverify 500");
    expect((await verifyTurnstile({ ...base, fetchImpl: async () => { throw new Error("boom"); } })).reason).toBe("siteverify unreachable");
    expect((await verifyTurnstile({ ...base, token: "" })).reason).toBe("token invalid");
    expect((await verifyTurnstile({ ...base, secret: "" })).reason).toBe("secret not configured");
    expect((await verifyTurnstile({ ...base, expectedHostnames: new Set() })).reason).toBe("hostnames not configured");
  });

  it("accepts a testing-key result without action or hostname checks", async () => {
    const r = await verifyTurnstile({
      ...base,
      fetchImpl: respond({ success: true, hostname: "example.com", metadata: { result_with_testing_key: true } }),
    });
    expect(r).toEqual({ ok: true, hostname: "example.com", testing: true });
  });
});
