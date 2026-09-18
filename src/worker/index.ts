// Worker entry. Serves /api/*; everything else is a static asset. The Worker
// only judges: it verifies Turnstile once per game, issues a session token,
// and forwards bounded state plus a fixed question set to Jev.

import { APIConnectionError, APIError, TypeSafeClient, type Questions, type SystemOneResult } from "@typesafe-ai/sdk";
import { VERSION } from "../engine";
import { MAX_MESSAGE_CHARS } from "../engine/personality";
import {
  JUDGE_QUESTION_COUNT,
  MODEL,
  buildJudgeQuestions,
  buildTurnQuestions,
  toMeasurements,
  toTurnPick,
} from "../judge/questions";
import { issueSession, verifySession, type Session } from "./session";
import { parseHostnames, verifyTurnstile } from "./turnstile";
import { MAX_BODY_BYTES, ValidationError, parseJudgeRequest, parseSessionRequest, parseTurnRequest } from "./validate";

export const TURNSTILE_ACTION = "start";

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

function json(data: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), { status, headers: { ...JSON_HEADERS, ...extra } });
}

function fail(status: number, code: string, message: string, extra: Record<string, string> = {}): Response {
  return json({ error: { code, message } }, status, extra);
}

function log(level: "info" | "warn" | "error", event: string, fields: Record<string, unknown> = {}): void {
  const line = JSON.stringify({ event, ...fields });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

async function readJson(request: Request): Promise<unknown | Response> {
  const length = Number(request.headers.get("content-length") ?? "0");
  if (length > MAX_BODY_BYTES) return fail(413, "too_large", "request body too large");
  try {
    return await request.json();
  } catch {
    return fail(400, "bad_json", "body must be JSON");
  }
}

function clientIp(request: Request): string {
  return request.headers.get("cf-connecting-ip") ?? "unknown";
}

async function handleSession(request: Request, env: Env): Promise<Response> {
  const body = await readJson(request);
  if (body instanceof Response) return body;
  let req;
  try {
    req = parseSessionRequest(body);
  } catch (e) {
    if (e instanceof ValidationError) return fail(400, e.code, e.message);
    throw e;
  }
  const ip = clientIp(request);
  const { success } = await env.SESSION_LIMITER.limit({ key: ip });
  if (!success) return fail(429, "rate_limited", "too many new games; try again in a minute", { "Retry-After": "60" });

  const turnstile = await verifyTurnstile({
    secret: env.TURNSTILE_SECRET,
    token: req.token,
    remoteip: ip === "unknown" ? undefined : ip,
    expectedAction: TURNSTILE_ACTION,
    expectedHostnames: parseHostnames(env.TURNSTILE_HOSTNAMES),
  });
  if (!turnstile.ok) {
    log("warn", "turnstile_rejected", { reason: turnstile.reason, hostname: turnstile.hostname });
    return fail(403, "turnstile", `verification failed: ${turnstile.reason ?? "unknown"}`);
  }
  if (turnstile.testing) log("warn", "turnstile_testing_key", { hostname: turnstile.hostname });

  const { token, session } = await issueSession(env.SESSION_SECRET);
  log("info", "session_started", { sid: session.sid });
  return json({ session: token, expiresAt: session.exp });
}

/** Checks the session token and both rate limits; returns a Response on failure. */
async function gate(request: Request, env: Env, sessionToken: string): Promise<Session | Response> {
  const session = await verifySession(env.SESSION_SECRET, sessionToken);
  if (!session) return fail(401, "session", "the game session is missing or expired; start a new game");
  const ip = clientIp(request);
  const bySession = await env.JUDGE_LIMITER.limit({ key: `sid:${session.sid}` });
  const byIp = await env.JUDGE_LIMITER.limit({ key: `ip:${ip}` });
  if (!bySession.success || !byIp.success) {
    return fail(429, "rate_limited", "too many judgments; slow down", { "Retry-After": "10" });
  }
  return session;
}

async function ask(env: Env, state: unknown, questions: Questions): Promise<SystemOneResult<Questions> | Response> {
  const client = new TypeSafeClient({
    apiKey: env.TYPESAFE_API_KEY,
    timeout: 15_000,
    retry: { maxRetries: 1 },
    logLevel: "warn",
  });
  try {
    return await client.systemOne({ state: state as Record<string, never>, questions, model: MODEL });
  } catch (e) {
    if (e instanceof APIError) {
      log("error", "typesafe_api_error", { status: e.status, requestId: e.requestId });
      if (e.status === 429 || e.status === 529 || e.status >= 500) {
        return fail(503, "model_busy", "the model is busy; try again shortly", { "Retry-After": "10" });
      }
      return fail(502, "model_error", `model request failed (${e.status})`);
    }
    if (e instanceof APIConnectionError) {
      log("error", "typesafe_unreachable", { message: e.message });
      return fail(504, "model_timeout", "the model did not answer in time");
    }
    throw e;
  }
}

async function handleJudge(request: Request, env: Env): Promise<Response> {
  const body = await readJson(request);
  if (body instanceof Response) return body;
  let req;
  try {
    req = parseJudgeRequest(body);
  } catch (e) {
    if (e instanceof ValidationError) return fail(400, e.code, e.message);
    throw e;
  }
  const session = await gate(request, env, req.session);
  if (session instanceof Response) return session;

  const t0 = performance.now();
  const result = await ask(env, req.state, buildJudgeQuestions(req.state.players));
  if (result instanceof Response) return result;
  const ms = performance.now() - t0;
  const measurements = toMeasurements(result.answers);
  log("info", "judged", {
    sid: session.sid,
    speaker: req.state.speaker,
    chars: req.state.message.length,
    questions: JUDGE_QUESTION_COUNT,
    tokens: result.usage.input_tokens + result.usage.output_tokens,
    ms: Math.round(ms),
  });
  return json({ measurements, model: result.model, ms: Math.round(ms), usage: result.usage });
}

async function handleTurn(request: Request, env: Env): Promise<Response> {
  const body = await readJson(request);
  if (body instanceof Response) return body;
  let req;
  try {
    req = parseTurnRequest(body);
  } catch (e) {
    if (e instanceof ValidationError) return fail(400, e.code, e.message);
    throw e;
  }
  const session = await gate(request, env, req.session);
  if (session instanceof Response) return session;

  const t0 = performance.now();
  const result = await ask(env, req.state, buildTurnQuestions(req.state.candidates, req.mirror));
  if (result instanceof Response) return result;
  const ms = performance.now() - t0;
  const pick = toTurnPick(result.answers, req.state.candidates.length, req.mirror);
  log("info", "turn", {
    sid: session.sid,
    speaker: req.state.speaker,
    candidates: req.state.candidates.length,
    mirror: req.mirror,
    tokens: result.usage.input_tokens + result.usage.output_tokens,
    ms: Math.round(ms),
  });
  return json({ pick, model: result.model, ms: Math.round(ms), usage: result.usage });
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);
    try {
      if (url.pathname === "/api/health") return json({ ok: true, version: VERSION });
      if (url.pathname === "/api/config") {
        return json({ siteKey: env.TURNSTILE_SITE_KEY, maxChars: MAX_MESSAGE_CHARS, version: VERSION, model: MODEL });
      }
      if (url.pathname === "/api/session" || url.pathname === "/api/judge" || url.pathname === "/api/turn") {
        if (request.method !== "POST") return fail(405, "method_not_allowed", "POST only", { Allow: "POST" });
        if (url.pathname === "/api/session") return await handleSession(request, env);
        if (url.pathname === "/api/judge") return await handleJudge(request, env);
        return await handleTurn(request, env);
      }
      if (url.pathname.startsWith("/api/")) return fail(404, "not_found", "no such endpoint");
      return env.ASSETS.fetch(request);
    } catch (e) {
      log("error", "unhandled", { message: e instanceof Error ? e.message : String(e) });
      return fail(500, "internal", "internal error");
    }
  },
} satisfies ExportedHandler<Env>;
