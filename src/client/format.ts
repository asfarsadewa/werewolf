// Small formatting helpers shared by the screens.

import { THRESHOLDS, type Measurements, type Player } from "../engine";

export const sprite = (name: string, size: 128 | 512 = 128): string => `/sprites/${name.toLowerCase()}${size === 128 ? "-128" : ""}.webp`;

/** A probability as two decimals without the leading zero: .62 */
export function prob(p: number): string {
  if (p >= 0.995) return ".99";
  if (p <= 0.005) return ".00";
  return p.toFixed(2).slice(1);
}

export function signed(d: number, places = 2): string {
  const s = Math.abs(d).toFixed(places);
  return d >= 0 ? `+${s}` : `−${s}`;
}

export function roleWord(role: Player["role"]): string {
  return role === "wolf" ? "a wolf" : role === "seer" ? "the seer" : "a villager";
}

export type SignalKind = "bad" | "good" | "claim" | "neutral";

const KIND: Record<string, SignalKind> = {
  contradicts_own_claim: "bad",
  contradicts_fact: "bad",
  deflects: "bad",
  bandwagon: "bad",
  coordinates: "bad",
  emotional_pressure: "bad",
  addresses_system: "bad",
  off_topic: "bad",
  accuses_with_evidence: "neutral",
  accuses_without_evidence: "neutral",
  defends_self: "good",
  defends_other: "good",
  claims_seer: "claim",
  reveals_night_result: "claim",
  asks_question: "neutral",
};

export interface Fired {
  id: string;
  p: number;
  threshold: number;
  kind: SignalKind;
}

/** Signals at or above their threshold, strongest first. */
export function fired(m: Measurements): Fired[] {
  const out: Fired[] = [];
  for (const [id, threshold] of Object.entries(THRESHOLDS)) {
    if (id === "target") continue;
    const p = m.nouls[id];
    if (p !== undefined && p >= threshold) out.push({ id, p, threshold, kind: KIND[id] ?? "neutral" });
  }
  return out.sort((a, b) => b.p - a.p);
}

/** Every signal with its probability, for the details view. */
export function allSignals(m: Measurements): Fired[] {
  const out: Fired[] = [];
  for (const [id, threshold] of Object.entries(THRESHOLDS)) {
    if (id === "target") continue;
    const p = m.nouls[id];
    if (p !== undefined) out.push({ id, p, threshold, kind: KIND[id] ?? "neutral" });
  }
  return out.sort((a, b) => b.p - a.p);
}

export const plural = (n: number, word: string): string => `${n} ${word}${n === 1 ? "" : "s"}`;
