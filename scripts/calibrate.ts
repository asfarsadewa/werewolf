// Measures the authored line library with the same judge the game uses, so
// the content can be tuned against the model rather than against taste.
//
//   npm run calibrate                 every line (about 750 requests, a cent or two)
//   npm run calibrate -- --who bel    one villager
//   npm run calibrate -- --limit 40
//
// For each line the script builds a plausible table (a target, a cited fact
// where the line needs one, a pending question or accusation where the intent
// implies one) and asks the full question set. It reports, per intent, how
// often the signal the intent is supposed to carry crosses its threshold, and
// lists every line that either misses its own signal or fires a signal that
// hurts the speaker without meaning to. The report is written to
// scripts/calibration.md and the raw answers to node_modules/.cache/calibration.json.

import { TypeSafeClient } from "@typesafe-ai/sdk";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ALL_LINES, type Intent, type LineSpec } from "../src/engine/lines";
import { THRESHOLDS } from "../src/engine/personality";
import { renderLine } from "../src/engine/policy";
import { NAMES } from "../src/engine/roster";
import { MODEL, buildJudgeQuestions, toMeasurements, type JudgeState } from "../src/judge/questions";
import type { Measurements } from "../src/engine/types";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const opt = (name: string): string | undefined => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const WHO = opt("who");
const LIMIT = Number(opt("limit") ?? Infinity);
const CONCURRENCY = Number(opt("concurrency") ?? 6);

/** The signal each intent exists to carry, and its threshold. */
const CARRIES: Partial<Record<Intent, keyof typeof THRESHOLDS>> = {
  accuse_evidence: "accuses_with_evidence",
  accuse_bare: "accuses_without_evidence",
  defend_self: "defends_self",
  defend_other: "defends_other",
  question: "asks_question",
  claim_seer: "claims_seer",
  counter_claim: "claims_seer",
  reveal_wolf: "reveals_night_result",
  reveal_clear: "reveals_night_result",
  deflect: "deflects",
};

/** Signals that cost the speaker; only `deflect` lines mean to carry one. */
const SELF_HARM: (keyof typeof THRESHOLDS)[] = ["contradicts_own_claim", "contradicts_fact", "deflects", "bandwagon", "coordinates", "emotional_pressure"];

const CAP = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** A table for the line to be said at. The target is Kip unless the speaker is Kip. */
function stateFor(line: LineSpec): JudgeState {
  const speaker = CAP(line.who);
  const target = line.who === "kip" ? "Bel" : "Kip";
  const other = line.who === "mara" ? "Rook" : "Mara";
  const message = renderLine(line.text, target);
  const needs = line.needs ?? [];
  const facts = ["Day 2.", "Night 1: Ines was killed; Ines was a villager.", "Day 1 vote: Tomas 3, Kip 2, Sol 1; nobody was eliminated."];
  if (needs.includes("fact:vote")) facts.push(`Day 1 vote: Tomas 4, Kip 2; Tomas was eliminated and was a villager.`);
  if (needs.includes("claim_exists") || needs.includes("fact:claim")) facts.push(`${target} claimed to be the seer on day 2.`);
  // The note the table would see under an evidence line, worded as the engine words it.
  let cited: string | null = null;
  if (needs.includes("fact:vote")) cited = `${target} voted for Tomas on day 1; Tomas was a villager.`;
  else if (needs.includes("fact:contradiction") || needs.includes("fact:any")) cited = `${target} changed their story today: contradiction 0.86.`;
  else if (needs.includes("fact:deflect")) cited = `${target} dodged a direct question today: deflects 0.81.`;
  else if (needs.includes("fact:bandwagon")) cited = `${target} repeated an accusation without adding anything: bandwagon 0.78.`;
  else if (needs.includes("fact:quiet")) cited = `${target} has said nothing today.`;
  else if (needs.includes("fact:claim")) cited = `${target} claimed to be the seer; so did ${other}.`;
  const recent: string[] = [`${other}: Someone here is lying and I would like to know who.`];
  if (needs.includes("fact:contradiction")) recent.push(`${target}: I was with Sol all night.`, `${target}: I never said I was with anyone.`);
  if (needs.includes("fact:deflect")) recent.push(`${other}: ${target}, where were you last night?`, `${target}: Why is nobody asking ${other} that?`);
  if (needs.includes("fact:bandwagon")) recent.push(`${other}: I think it is Sol.`, `${target}: Yes, Sol. Definitely Sol.`);
  if (needs.includes("fact:quiet")) recent.push(`${other}: ${target} has not said a word today.`);
  const accusations: string[] = [];
  let asked: string | null = null;
  if (needs.includes("accused") || line.intent === "deflect") accusations.push(`${other}: ${speaker}, your story does not add up. I think you are a wolf.`);
  if (needs.includes("asked") || line.intent === "deflect") asked = `${other}: ${speaker}, where were you last night?`;
  if (line.intent === "reveal_wolf" || line.intent === "reveal_clear") facts.push(`${speaker} claimed to be the seer on day 2.`);
  return {
    speaker,
    message,
    players: NAMES.filter((n) => n !== "Ines"),
    facts,
    speaker_earlier_statements: line.intent === "counter_claim" ? [] : [`Day 1: I was home all night.`],
    recent,
    accusations_against_speaker: accusations,
    asked_of_speaker: asked,
    cited_fact: line.intent === "accuse_evidence" ? cited : null,
  };
}

interface Row {
  id: string;
  intent: Intent;
  text: string;
  carries: string | null;
  carried: number | null;
  target: string;
  targetP: number;
  harm: { id: string; p: number }[];
  m: Measurements;
}

async function main(): Promise<void> {
  const client = new TypeSafeClient({ timeout: 20_000, retry: { maxRetries: 2 } });
  const lines = ALL_LINES.filter((l) => !WHO || l.who === WHO).slice(0, LIMIT);
  console.log(`measuring ${lines.length} lines with ${MODEL}`);
  const rows: Row[] = [];
  let done = 0;
  let tokens = 0;
  const queue = [...lines];
  const worker = async () => {
    for (;;) {
      const line = queue.shift();
      if (!line) return;
      const state = stateFor(line);
      const r = await client.systemOne({ state, questions: buildJudgeQuestions(state.players), model: MODEL });
      tokens += r.usage.input_tokens + r.usage.output_tokens;
      const m = toMeasurements(r.answers);
      const carries = CARRIES[line.intent] ?? null;
      const harm = SELF_HARM.filter((s) => !(line.intent === "deflect" && s === "deflects"))
        .map((s) => ({ id: s, p: m.nouls[s] }))
        .filter((h) => h.p >= THRESHOLDS[h.id as keyof typeof THRESHOLDS]);
      rows.push({
        id: line.id,
        intent: line.intent,
        text: state.message,
        carries,
        carried: carries ? m.nouls[carries] : null,
        target: m.choices.target.choice,
        targetP: m.choices.target.probabilities[m.choices.target.choice] ?? 0,
        harm,
        m,
      });
      done++;
      if (done % 50 === 0) console.log(`${done}/${lines.length}`);
    }
  };
  await Promise.all(new Array(Math.min(CONCURRENCY, queue.length)).fill(0).map(worker));
  rows.sort((a, b) => a.id.localeCompare(b.id));

  const cacheDir = path.join(root, "node_modules", ".cache");
  await mkdir(cacheDir, { recursive: true });
  await writeFile(path.join(cacheDir, "calibration.json"), JSON.stringify(rows, null, 1));

  // Report.
  const out: string[] = [`# Line calibration`, ``, `${rows.length} lines, ${tokens} tokens, model ${MODEL}, ${new Date().toISOString().slice(0, 10)}.`, ``];
  out.push(`## Does each intent carry its signal?`, ``, `| intent | signal | threshold | lines | crossing | median p |`, `| --- | --- | --- | --- | --- | --- |`);
  const byIntent = new Map<Intent, Row[]>();
  for (const r of rows) byIntent.set(r.intent, [...(byIntent.get(r.intent) ?? []), r]);
  const misses: Row[] = [];
  for (const [intent, rs] of [...byIntent.entries()].sort()) {
    const carries = CARRIES[intent];
    if (!carries) continue;
    const t = THRESHOLDS[carries];
    const ps = rs.map((r) => r.carried ?? 0).sort((a, b) => a - b);
    const crossing = ps.filter((p) => p >= t).length;
    out.push(`| ${intent} | ${carries} | ${t.toFixed(2)} | ${rs.length} | ${crossing} (${Math.round((100 * crossing) / rs.length)}%) | ${ps[Math.floor(ps.length / 2)].toFixed(2)} |`);
    for (const r of rs) if ((r.carried ?? 0) < t) misses.push(r);
  }
  out.push(``, `## Lines that miss their own signal`, ``);
  for (const r of misses) out.push(`- \`${r.id}\` ${r.carries} ${r.carried!.toFixed(2)}: ${r.text}`);
  const targeted = rows.filter((r) => r.text.startsWith("Kip") || r.text.startsWith("Bel"));
  const wrongTarget = targeted.filter((r) => !r.text.startsWith(r.target) || r.targetP < THRESHOLDS.target);
  out.push(``, `## Addressed lines whose target was not read (${wrongTarget.length} of ${targeted.length})`, ``);
  for (const r of wrongTarget) out.push(`- \`${r.id}\` target ${r.target} ${r.targetP.toFixed(2)}: ${r.text}`);
  const harmful = rows.filter((r) => r.harm.length);
  out.push(``, `## Lines that hurt their speaker without meaning to (${harmful.length})`, ``);
  for (const r of harmful) out.push(`- \`${r.id}\` ${r.harm.map((h) => `${h.id} ${h.p.toFixed(2)}`).join(", ")}: ${r.text}`);
  const report = out.join("\n") + "\n";
  await writeFile(path.join(root, "scripts", "calibration.md"), report);
  console.log(report.split("\n").slice(0, 20).join("\n"));
  console.log(`... full report in scripts/calibration.md; ${misses.length} misses, ${wrongTarget.length} wrong targets, ${harmful.length} self-harming`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
