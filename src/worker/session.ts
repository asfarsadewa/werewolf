// Game sessions. Turnstile is verified once when a game starts; the Worker
// then issues a signed, short-lived token that every judgment carries. Tokens
// are stateless: payload plus HMAC-SHA256, base64url, split by a dot.

export const SESSION_TTL_MS = 2 * 60 * 60 * 1000;

export interface Session {
  /** Random session id; the rate limiter keys on it. */
  sid: string;
  /** Expiry, milliseconds since the epoch. */
  exp: number;
}

const enc = new TextEncoder();

function b64url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function unb64url(s: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]*$/.test(s)) return null;
  const padded = s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (s.length % 4)) % 4);
  try {
    const bin = atob(padded);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  } catch {
    return null;
  }
}

async function key(secret: string) {
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export async function issueSession(secret: string, now = Date.now(), ttlMs = SESSION_TTL_MS): Promise<{ token: string; session: Session }> {
  if (!secret || secret.length < 16) throw new Error("session secret too short");
  const sid = b64url(crypto.getRandomValues(new Uint8Array(12)));
  const session: Session = { sid, exp: now + ttlMs };
  const payload = enc.encode(JSON.stringify(session));
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", await key(secret), payload));
  return { token: `${b64url(payload)}.${b64url(sig)}`, session };
}

/** Returns the session when the token is well formed, signed and unexpired. */
export async function verifySession(secret: string, token: unknown, now = Date.now()): Promise<Session | null> {
  if (typeof token !== "string" || token.length > 512 || !secret) return null;
  const dot = token.indexOf(".");
  if (dot <= 0) return null;
  const payload = unb64url(token.slice(0, dot));
  const sig = unb64url(token.slice(dot + 1));
  if (!payload || !sig) return null;
  const ok = await crypto.subtle.verify("HMAC", await key(secret), sig, payload);
  if (!ok) return null;
  let session: Session;
  try {
    session = JSON.parse(new TextDecoder().decode(payload)) as Session;
  } catch {
    return null;
  }
  if (typeof session.sid !== "string" || typeof session.exp !== "number") return null;
  if (session.exp <= now) return null;
  return session;
}
