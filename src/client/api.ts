// The Worker's three endpoints. The browser never holds a model key; it holds
// a game session token issued after one Turnstile check.

import type { Measurements, TurnPick } from "../engine";
import type { JudgeState, TurnState } from "../judge/questions";

export interface Config {
  siteKey: string;
  maxChars: number;
  version: string;
  model: string;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function parse<T>(r: Response): Promise<T> {
  const data: unknown = await r.json().catch(() => null);
  if (!r.ok) {
    const err = (data as { error?: { code?: string; message?: string } } | null)?.error;
    throw new ApiError(r.status, err?.code ?? "http", err?.message ?? `request failed (${r.status})`);
  }
  return data as T;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  return parse<T>(
    await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

export async function fetchConfig(): Promise<Config> {
  return parse<Config>(await fetch("/api/config", { headers: { Accept: "application/json" } }));
}

export async function startSession(token: string): Promise<{ session: string; expiresAt: number }> {
  return post("/api/session", { token });
}

export interface JudgeResponse {
  measurements: Measurements;
  model: string;
  ms: number;
  usage: { input_tokens: number; output_tokens: number };
}

export async function judge(session: string, state: JudgeState): Promise<JudgeResponse> {
  return post("/api/judge", { session, state });
}

export interface TurnResponse {
  pick: TurnPick;
  model: string;
  ms: number;
  usage: { input_tokens: number; output_tokens: number };
}

export async function turn(
  session: string,
  state: Omit<TurnState, "candidates">,
  candidates: string[],
  target: string | null,
  mirror: boolean,
): Promise<TurnResponse> {
  return post("/api/turn", { session, state, candidates, target, mirror });
}

/** A human-readable reason for a failed call. */
export function describeError(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.status === 429) return "the table is talking too fast; wait a moment";
    if (e.status === 401) return "the game session expired; start a new game";
    if (e.status === 503 || e.status === 504) return "the model is busy; retrying";
    return e.message;
  }
  return e instanceof Error ? e.message : "something failed";
}
