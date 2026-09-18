// Pre-renders every authored line as speech with Gemini TTS and writes small
// MP3 clips plus a manifest into public/voice. Nothing is synthesised at
// runtime: the game only ever plays what this script produced.
//
//   npm run voice                 render every missing clip
//   npm run voice -- --limit 6    render at most six missing clips
//   npm run voice -- --only mara  render only keys starting with "mara"
//   npm run voice -- --force      re-render even when the file exists
//   npm run voice -- --dry-run    list the work without calling anything
//
// Two kinds of clip. A body clip is a line's text with its leading vocative
// removed, keyed by line id. A vocative clip is one name spoken by one voice in
// one tone, keyed `${who}.${name}.${tone}`. The client plays vocative then body.

import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { createHash } from "node:crypto";
import { ALL_LINES, TONES, type LineSpec, type Personality, type Tone } from "../src/engine/lines";
import { SEATS } from "../src/engine/roster";

const exec = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "public", "voice");
const tmpDir = path.join(os.tmpdir(), "werewolf-voice");

const MODEL = "gemini-3.1-flash-tts-preview";
const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/interactions";
const SAMPLE_RATE = 24000;

const args = process.argv.slice(2);
const flag = (name: string): boolean => args.includes(`--${name}`);
const opt = (name: string): string | undefined => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const LIMIT = Number(opt("limit") ?? Infinity);
const ONLY = opt("only");
const FORCE = flag("force");
const DRY = flag("dry-run");
const CONCURRENCY = Number(opt("concurrency") ?? 6);
const REHASH = flag("rehash");

/** How each villager sounds: the character part of every prompt. */
const CHARACTER: Record<Personality, string> = {
  mara: "a stern village baker in her forties, low even voice, terse, unimpressed, never raises her voice",
  tomas: "an eager young shepherd in his early twenties, bright quick voice, agreeable, a little anxious to please",
  bel: "a dry sharp-tongued herbalist in her thirties, crisp precise diction, faintly amused, bored by evasions",
  ines: "a warm motherly innkeeper in her sixties, soft rounded voice, kind, patient, a little tired",
  kip: "a hot-headed woodcutter's apprentice of nineteen, rough quick voice, defensive, easily stung",
  rook: "a pedantic village clerk in his fifties, measured formal voice, dry, every word placed like a ledger entry",
  sol: "a village elder in his seventies, deep steady voice, few words, deliberate but at a normal speaking pace, never dragging",
};

/** How each tone is delivered. */
const DELIVERY: Record<Tone, string> = {
  calm: "calmly and evenly, at a normal conversational pace, without long pauses",
  nervous: "nervously, a little quick and uneven, hedging, slightly breathless",
  aggressive: "sharply, clipped and pushing, raised but not shouting",
  sarcastic: "dryly, drawling, mocking, with a faint smile you can hear",
  pleading: "softly and urgently, asking to be believed, almost begging",
};

interface Clip {
  key: string;
  who: Personality;
  voice: string;
  tone: Tone;
  text: string;
  kind: "body" | "vocative";
}

function voiceFor(who: Personality): string {
  const seat = SEATS.find((s) => s.personality === who);
  if (!seat?.voice) throw new Error(`no voice for ${who}`);
  return seat.voice;
}

/** Splits a line into its vocative slot and the body that is voiced on its own. */
export function bodyText(line: LineSpec): string {
  const m = /^\{target\}[.,]\s*/.exec(line.text);
  if (!m) return line.text;
  const rest = line.text.slice(m[0].length);
  return rest.charAt(0).toUpperCase() + rest.slice(1);
}

function clips(): Clip[] {
  const out: Clip[] = [];
  for (const line of ALL_LINES) {
    out.push({ key: line.id, who: line.who, voice: voiceFor(line.who), tone: line.tone, text: bodyText(line), kind: "body" });
  }
  for (const seat of SEATS) {
    if (!seat.personality) continue;
    for (const name of SEATS.map((s) => s.name)) {
      if (name === seat.name) continue;
      for (const tone of TONES) {
        out.push({
          key: `${seat.personality}.${name.toLowerCase()}.${tone}`,
          who: seat.personality,
          voice: seat.voice!,
          tone,
          text: `${name}.`,
          kind: "vocative",
        });
      }
    }
  }
  return out;
}

function prompt(c: Clip, alt = false): string {
  const who = CHARACTER[c.who];
  const how = DELIVERY[c.tone];
  // The safety filter occasionally blocks the usual phrasing for a single name;
  // the plainer form below passes for the same voice and tone.
  if (alt) return `Say ${how}: ${c.text}`;
  if (c.kind === "vocative") {
    return `You are ${who}. Say only this one name, ${how}, as if addressing that person across a table before saying something to them: ${c.text}`;
  }
  return `You are ${who}. Say only the following line, ${how}, with no preamble and nothing added: ${c.text}`;
}

async function synthesize(c: Clip, apiKey: string): Promise<Buffer> {
  let lastError = "";
  let alt = false;
  for (let attempt = 1; attempt <= 5; attempt++) {
    const body = {
      model: MODEL,
      input: prompt(c, alt),
      response_format: { type: "audio" },
      generation_config: { speech_config: [{ voice: c.voice }] },
    };
    const r = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(90_000),
    });
    if (r.ok) {
      const json = (await r.json()) as { steps?: { content?: { type: string; data?: string; mime_type?: string; sample_rate?: number }[] }[] };
      const part = json.steps?.[0]?.content?.find((p) => p.type === "audio");
      if (!part?.data) throw new Error(`no audio in response for ${c.key}`);
      if (part.sample_rate && part.sample_rate !== SAMPLE_RATE) throw new Error(`unexpected sample rate ${part.sample_rate}`);
      return Buffer.from(part.data, "base64");
    }
    const text = await r.text().catch(() => "");
    lastError = `${r.status} ${text}`.slice(0, 300);
    // 429 and 5xx are the usual transients; the TTS preview also answers 400
    // "audio stream could not be completed" for what is plainly a retry.
    const transient = r.status === 429 || r.status >= 500 || (r.status === 400 && /could not be completed/i.test(text));
    if (r.status === 400 && /blocked/i.test(text) && !alt) {
      alt = true;
      continue;
    }
    if (transient) {
      await new Promise((res) => setTimeout(res, 1500 * attempt * attempt));
      continue;
    }
    break;
  }
  throw new Error(`tts failed for ${c.key}: ${lastError}`);
}

/** Trims silence, normalises loudness and encodes a small mono MP3. */
async function encode(pcm: Buffer, out: string, key: string): Promise<void> {
  await mkdir(tmpDir, { recursive: true });
  const raw = path.join(tmpDir, `${key}.pcm`);
  await writeFile(raw, pcm);
  const filters = [
    "silenceremove=start_periods=1:start_threshold=-40dB:start_silence=0.08",
    "areverse",
    "silenceremove=start_periods=1:start_threshold=-40dB:start_silence=0.12",
    "areverse",
    "loudnorm=I=-18:TP=-1.5:LRA=9",
    "apad=pad_dur=0.06",
  ].join(",");
  await exec("ffmpeg", [
    "-loglevel",
    "error",
    "-y",
    "-f",
    "s16le",
    "-ar",
    String(SAMPLE_RATE),
    "-ac",
    "1",
    "-i",
    raw,
    "-af",
    filters,
    "-ar",
    "24000",
    "-ac",
    "1",
    "-c:a",
    "libmp3lame",
    "-b:a",
    "32k",
    out,
  ]);
  await rm(raw, { force: true });
}

async function duration(file: string): Promise<number> {
  const { stdout } = await exec("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]);
  return Math.round(Number(stdout.trim()) * 100) / 100;
}

interface ManifestEntry {
  seconds: number;
  bytes: number;
  /** Hash of the spoken text and prompt; a changed line re-renders. */
  hash?: string;
  /** Set when the clip is much longer than its text suggests; listen to it. */
  suspect?: true;
}

interface Manifest {
  model: string;
  version: number;
  clips: Record<string, ManifestEntry>;
}

async function loadManifest(): Promise<Manifest> {
  const file = path.join(outDir, "manifest.json");
  if (!existsSync(file)) return { model: MODEL, version: 1, clips: {} };
  return JSON.parse(await readFile(file, "utf8")) as Manifest;
}

async function main(): Promise<void> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey && !DRY) throw new Error("GEMINI_API_KEY is not set");
  await mkdir(outDir, { recursive: true });
  const all = clips();
  const manifest = await loadManifest();
  const hashOf = (c: Clip) => createHash("sha1").update(prompt(c)).digest("hex").slice(0, 12);
  const stale = (c: Clip) => {
    const file = path.join(outDir, `${c.key}.mp3`);
    if (!existsSync(file)) return true;
    const entry = manifest.clips[c.key];
    return entry?.hash !== undefined && entry.hash !== hashOf(c);
  };
  if (REHASH) {
    // Record the current prompt hash for every clip already on disk, so later text edits re-render.
    let n = 0;
    for (const c of all) {
      const entry = manifest.clips[c.key];
      if (entry && existsSync(path.join(outDir, `${c.key}.mp3`)) && entry.hash === undefined) {
        entry.hash = hashOf(c);
        n++;
      }
    }
    await writeFile(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 1));
    console.log(`recorded hashes for ${n} clips`);
    return;
  }
  const wanted = all.filter((c) => (!ONLY || c.key.startsWith(ONLY)) && (FORCE || stale(c))).slice(0, LIMIT);
  console.log(`${all.length} clips in the library (${all.filter((c) => c.kind === "body").length} bodies, ${all.filter((c) => c.kind === "vocative").length} vocatives); ${wanted.length} to render`);
  if (DRY) {
    for (const c of wanted.slice(0, 20)) console.log(`  ${c.key}  [${c.voice}, ${c.tone}]  ${c.text}`);
    if (wanted.length > 20) console.log(`  ... and ${wanted.length - 20} more`);
    return;
  }

  let done = 0;
  let failed = 0;
  let chars = 0;
  const started = Date.now();
  const queue = [...wanted];
  const worker = async (): Promise<void> => {
    for (;;) {
      const c = queue.shift();
      if (!c) return;
      const out = path.join(outDir, `${c.key}.mp3`);
      try {
        const pcm = await synthesize(c, apiKey!);
        await encode(pcm, out, c.key);
        const seconds = await duration(out);
        const bytes = (await stat(out)).size;
        const entry: ManifestEntry = { seconds, bytes, hash: hashOf(c) };
        // Speech runs about 12 to 18 characters per second; a clip twice as long
        // as that suggests the model read the instruction aloud.
        const expected = Math.max(0.6, c.text.length / 13);
        if (seconds > expected * 2.2 + 0.8) entry.suspect = true;
        manifest.clips[c.key] = entry;
        chars += c.text.length;
        done++;
        if (done % 25 === 0 || done === wanted.length) {
          const elapsed = (Date.now() - started) / 1000;
          console.log(`${done}/${wanted.length} rendered, ${failed} failed, ${Math.round(elapsed)}s, ${(elapsed / done).toFixed(1)}s per clip`);
          await writeFile(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 1));
        }
      } catch (e) {
        failed++;
        console.error(`FAILED ${c.key}: ${e instanceof Error ? e.message : String(e)}`);
        await rm(out, { force: true });
      }
    }
  };
  await Promise.all(new Array(Math.min(CONCURRENCY, queue.length)).fill(0).map(worker));

  // Prune manifest entries whose files vanished and record totals.
  for (const key of Object.keys(manifest.clips)) if (!existsSync(path.join(outDir, `${key}.mp3`))) delete manifest.clips[key];
  manifest.model = MODEL;
  await writeFile(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 1));
  const entries = Object.values(manifest.clips);
  const total = entries.reduce((s, e) => s + e.bytes, 0);
  const seconds = entries.reduce((s, e) => s + e.seconds, 0);
  const suspects = Object.entries(manifest.clips).filter(([, e]) => e.suspect).map(([k]) => k);
  console.log(`manifest: ${entries.length} clips, ${(total / 1e6).toFixed(1)} MB, ${Math.round(seconds / 60)} minutes of speech, ${chars} characters sent this run`);
  if (suspects.length) console.log(`suspect clips (too long for their text): ${suspects.join(", ")}`);
  if (failed) {
    console.error(`${failed} clips failed; run again to retry them`);
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
