// The driver: owns the game state, asks the engine what happens next, calls
// the Worker for judgments, paces the table so villagers speak one at a time,
// and publishes an immutable snapshot for React. Every decision that came from
// the model is recorded as an action, so the game can be replayed exactly.

import {
  HUMAN,
  aiVotes,
  buildReport,
  createGame,
  nextStep,
  planTurn,
  reduce,
  renderLine,
  replay,
  voteLine,
  type Action,
  type GameState,
  type Measurements,
  type Report,
  type Role,
  type Step,
  type TurnPick,
} from "../engine";
import { ALL_LINES, type LineSpec } from "../engine/lines";
import { argmax, buildJudgeState, buildTurnState, mirrorPick } from "../judge/questions";
import { ApiError, describeError, judge, turn } from "./api";
import { audio } from "./audio";

export interface Announcement {
  voter: number;
  target: number | null;
  text: string;
}

export interface NightView {
  needs: ("kill" | "check")[];
  /** The human seer's result, once the night resolves. */
  result?: { target: number; wolf: boolean };
}

export interface View {
  game: GameState;
  step: Step;
  /** AI whose line is on the table right now. */
  speaking: number | null;
  /** The human's message shown before its measurement arrives. */
  pending: string | null;
  /** Log index whose measurement is in flight. */
  measuring: number | null;
  announcements: Announcement[];
  announcing: number | null;
  humanVoted: boolean;
  night: NightView | null;
  /** Last dawn: who died, shown until the day's talk begins. */
  dawn: { day: number; killed: number | null } | null;
  error: string | null;
  lastJudgeMs: number | null;
  report: Report | null;
  revision: number;
}

export interface Saved {
  seed: string;
  humanRole?: Role;
  actions: Action[];
  session: string;
  expiresAt: number;
  savedAt: number;
}

const SAVE_KEY = "werewolf:game";
const MIN_LINE_MS = 1300;
const GAP_MS = 380;
const DAWN_MS = 2600;
const TALLY_MS = 2800;
const SLEEP_MS = 3800;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function loadSaved(): Saved | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Saved;
    if (typeof s.seed !== "string" || !Array.isArray(s.actions) || typeof s.session !== "string") return null;
    if (s.expiresAt < Date.now() + 60_000) return null;
    return s;
  } catch {
    return null;
  }
}

export function clearSaved(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // storage unavailable
  }
}

/** Voice clip keys for a spoken line: the vocative, if any, then the body. */
export function voiceKeys(line: LineSpec, targetName: string | null): string[] {
  const keys: string[] = [];
  if (line.text.startsWith("{target}") && targetName) keys.push(`${line.who}.${targetName.toLowerCase()}.${line.tone}`);
  keys.push(line.id);
  return keys;
}

export class Driver {
  view: View;
  private actions: Action[];
  private listeners = new Set<() => void>();
  private disposed = false;
  private wake: (() => void) | null = null;
  private humanQueue: string[] = [];
  private humanVote: { target: number | null } | null = null;
  private nightChoice: { kill?: number; check?: number } | null = null;
  private callVoteRequested = false;
  private running = false;

  constructor(
    private readonly seed: string,
    private readonly session: string,
    private readonly expiresAt: number,
    private readonly humanRole: Role | undefined,
    saved?: Action[],
  ) {
    const game = saved ? replay(seed, saved, ALL_LINES, { humanRole }) : createGame(seed, { humanRole });
    this.actions = saved ? [...saved] : [];
    this.view = {
      game,
      step: nextStep(game),
      speaking: null,
      pending: null,
      measuring: null,
      announcements: [],
      announcing: null,
      humanVoted: false,
      night: null,
      dawn: null,
      error: null,
      lastJudgeMs: null,
      report: game.phase === "over" ? buildReport(game) : null,
      revision: 0,
    };
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private publish(patch: Partial<View>): void {
    this.view = { ...this.view, ...patch, revision: this.view.revision + 1 };
    for (const fn of this.listeners) fn();
  }

  private dispatch(action: Action): GameState {
    const game = reduce(this.view.game, action, ALL_LINES);
    this.actions.push(action);
    this.publish({ game, step: nextStep(game) });
    this.save();
    return game;
  }

  private save(): void {
    try {
      const s: Saved = {
        seed: this.seed,
        humanRole: this.humanRole,
        actions: this.actions,
        session: this.session,
        expiresAt: this.expiresAt,
        savedAt: Date.now(),
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(s));
    } catch {
      // storage unavailable
    }
  }

  recording(): { seed: string; humanRole?: Role; actions: Action[] } {
    return { seed: this.seed, humanRole: this.humanRole, actions: [...this.actions] };
  }

  dispose(): void {
    this.disposed = true;
    audio.stopSpeaking();
    this.wake?.();
  }

  private idle(): Promise<void> {
    return new Promise((resolve) => {
      this.wake = () => {
        this.wake = null;
        resolve();
      };
    });
  }

  private nudge(): void {
    this.wake?.();
  }

  // Inputs from the UI.

  send(text: string): void {
    const t = text.trim();
    if (!t || this.view.game.phase !== "day" || this.view.game.humanMessagesLeft <= 0) return;
    this.humanQueue.push(t);
    this.publish({ pending: t });
    audio.sfx("send");
    this.nudge();
  }

  callVote(): void {
    if (this.view.game.phase !== "day" || this.view.game.queue.length) return;
    this.callVoteRequested = true;
    this.nudge();
  }

  vote(target: number | null): void {
    if (this.view.game.phase !== "vote" || this.humanVote) return;
    this.humanVote = { target };
    this.publish({ humanVoted: true });
    audio.sfx("vote");
    this.nudge();
  }

  night(choice: { kill?: number; check?: number }): void {
    if (this.view.game.phase !== "night") return;
    this.nightChoice = choice;
    this.nudge();
  }

  // The loop.

  start(): void {
    if (this.running) return;
    this.running = true;
    void this.run();
  }

  private async run(): Promise<void> {
    const game = this.view.game;
    if (game.phase === "day" && game.day === 1 && game.log.length === 1) audio.music("day");
    else if (game.phase === "night") audio.music("night");
    else audio.music("day");
    while (!this.disposed) {
      try {
        if (this.humanQueue.length) {
          await this.processHuman();
          continue;
        }
        const step = nextStep(this.view.game);
        if (step.kind === "ai_turn") {
          await this.aiTurn(step.speaker);
        } else if (step.kind === "human_turn") {
          if (this.callVoteRequested) {
            this.callVoteRequested = false;
            this.dispatch({ t: "call_vote" });
          } else {
            await this.idle();
          }
        } else if (step.kind === "vote") {
          await this.votePhase();
        } else if (step.kind === "night") {
          await this.nightPhase(step.needs);
        } else {
          this.finish();
          return;
        }
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          this.publish({ error: describeError(e) });
          return;
        }
        this.publish({ error: describeError(e) });
        await sleep(1500);
      }
    }
  }

  private async measure(at: number): Promise<Measurements | null> {
    const state = buildJudgeState(this.view.game, at);
    this.publish({ measuring: at });
    try {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const r = await judge(this.session, state);
          this.publish({ measuring: null, lastJudgeMs: r.ms, error: null });
          return r.measurements;
        } catch (e) {
          if (e instanceof ApiError && (e.status === 503 || e.status === 504 || e.status === 429) && attempt === 0) {
            await sleep(e.status === 429 ? 4000 : 1500);
            continue;
          }
          throw e;
        }
      }
      return null;
    } finally {
      if (this.view.measuring === at) this.publish({ measuring: null });
    }
  }

  private async processHuman(): Promise<void> {
    const text = this.humanQueue.shift()!;
    const before = this.view.game;
    if (before.phase !== "day" || before.humanMessagesLeft <= 0) {
      this.publish({ pending: null });
      return;
    }
    const game = this.dispatch({ t: "human", text });
    const at = game.log.length - 1;
    this.publish({ pending: null, dawn: null });
    try {
      const m = await this.measure(at);
      if (m) {
        const prev = humanStandingOf(this.view.game);
        this.dispatch({ t: "measure", at, m });
        const next = humanStandingOf(this.view.game);
        if (next > prev + 0.005) audio.sfx("tick-up");
        else if (next < prev - 0.005) audio.sfx("tick-down");
      }
    } catch (e) {
      // The line stays on the table unmeasured; the villagers heard nothing they could weigh.
      this.publish({ error: `not measured: ${describeError(e)}` });
      if (e instanceof ApiError && e.status === 401) throw e;
    }
  }

  private async aiTurn(speaker: number): Promise<void> {
    const game = this.view.game;
    const item = game.queue[0];
    const plan = planTurn(game, speaker, ALL_LINES, item?.event);
    let index = 0;
    let pick: TurnPick | undefined;
    if (plan.candidates.length > 1) {
      const texts = plan.candidates.map((c) => renderLine(c.text, plan.target === null ? null : game.players[plan.target].name));
      const { candidates: _omit, ...context } = buildTurnState(game, speaker, texts, plan.fact);
      try {
        const r = await turn(
          this.session,
          context,
          plan.candidates.map((c) => c.id),
          plan.target === null ? null : game.players[plan.target].name,
          plan.mirror,
        );
        pick = r.pick;
        index = plan.mirror ? mirrorPick(pick) : argmax(pick.probabilities);
        this.publish({ error: null });
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) throw e;
        // Fall back to the seeded first candidate; the game goes on.
        this.publish({ error: `line not judged: ${describeError(e)}` });
        if (e instanceof ApiError && e.status === 429) await sleep(4000);
      }
    }
    const line = plan.candidates[index];
    if (!line) throw new Error(`no line for ${game.players[speaker].name}`);
    const targetName = plan.target === null ? null : game.players[plan.target].name;
    const after = this.dispatch({ t: "ai", speaker, lineId: line.id, target: plan.target, pick });
    const at = after.log.length - 1;
    const entry = after.log[at];
    const text = entry.kind === "message" ? entry.text : line.text;
    const keys = voiceKeys(line, targetName);
    this.publish({ speaking: speaker, dawn: null });
    audio.duck(true);
    const startedAt = performance.now();
    const seconds = audio.voiceSeconds(keys, text);
    const spoken = audio.speak(keys);
    this.preloadNext(after);

    if (plan.measured) {
      try {
        const m = await this.measure(at);
        if (m) {
          const prev = humanStandingOf(this.view.game);
          this.dispatch({ t: "measure", at, m });
          const next = humanStandingOf(this.view.game);
          if (next > prev + 0.01) audio.sfx("tick-up");
          else if (next < prev - 0.01) audio.sfx("tick-down");
        }
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) throw e;
        this.publish({ error: `not measured: ${describeError(e)}` });
      }
    }
    await spoken;
    const elapsed = performance.now() - startedAt;
    const floor = audio.settings.voice ? MIN_LINE_MS : Math.max(MIN_LINE_MS, seconds * 1000);
    if (elapsed < floor) await sleep(floor - elapsed);
    audio.duck(false);
    this.publish({ speaking: null });
    await sleep(GAP_MS);
  }

  /** Warms the cache with the next speaker's likely clips. */
  private preloadNext(game: GameState): void {
    const next = game.queue[0];
    if (!next) return;
    try {
      const plan = planTurn(game, next.speaker, ALL_LINES, next.event);
      const targetName = plan.target === null ? null : game.players[plan.target].name;
      const keys = plan.candidates.flatMap((c) => voiceKeys(c, targetName));
      audio.preloadVoice([...new Set(keys)].slice(0, 12));
    } catch {
      // preloading is best effort
    }
  }

  private async votePhase(): Promise<void> {
    let game = this.view.game;
    if (game.phase === "day") game = this.dispatch({ t: "call_vote" });
    this.humanVote = null;
    this.publish({ announcements: [], announcing: null, humanVoted: false });
    const order = aiVotes(game);
    for (const v of order) {
      if (this.disposed) return;
      const target = game.votes[v.voter] ?? null;
      if (target === null) continue;
      const line = voteLine(game, v.voter, target, ALL_LINES);
      const text = line ? renderLine(line.text, game.players[target].name) : `${game.players[target].name}.`;
      this.publish({ announcing: v.voter, announcements: [...this.view.announcements, { voter: v.voter, target, text }] });
      audio.sfx("vote");
      const keys = line ? voiceKeys(line, game.players[target].name) : [];
      const started = performance.now();
      await audio.speak(keys);
      const floor = Math.max(1100, audio.settings.voice ? 0 : audio.voiceSeconds(keys, text) * 1000);
      const elapsed = performance.now() - started;
      if (elapsed < floor) await sleep(floor - elapsed);
      this.publish({ announcing: null });
      await sleep(250);
    }
    const human = game.players[HUMAN];
    if (human.alive) {
      while (!this.humanVote && !this.disposed) await this.idle();
      if (this.disposed) return;
    }
    const target = human.alive ? this.humanVote!.target : null;
    const after = this.dispatch({ t: "vote", target });
    // The log now holds every vote in order; the ephemeral announcements have done their job.
    this.publish({ announcements: [], announcing: null });
    const tally = [...after.log].reverse().find((e) => e.kind === "tally");
    if (tally && tally.kind === "tally") {
      if (tally.eliminated !== null) {
        audio.sfx("toll");
        await sleep(900);
        audio.sfx(tally.role === "wolf" ? "reveal-wolf" : "reveal-villager");
      }
    }
    await sleep(TALLY_MS);
    this.publish({ humanVoted: false });
  }

  private async nightPhase(needs: ("kill" | "check")[]): Promise<void> {
    audio.music("night");
    audio.sfx("night");
    this.nightChoice = null;
    this.publish({ night: { needs } });
    if (needs.length) {
      while (!this.nightChoice && !this.disposed) await this.idle();
      if (this.disposed) return;
    } else {
      await sleep(SLEEP_MS);
    }
    const choice = this.nightChoice ?? {};
    const after = this.dispatch({ t: "night", ...choice });
    const check = [...after.log].reverse().find((e) => e.kind === "check" && e.seer === HUMAN);
    const dawn = [...after.log].reverse().find((e) => e.kind === "dawn");
    if (check && check.kind === "check") {
      this.publish({ night: { needs: [], result: { target: check.target, wolf: check.wolf } } });
      await sleep(2600);
    }
    audio.sfx("dawn");
    this.publish({ night: null, dawn: dawn && dawn.kind === "dawn" ? { day: dawn.day, killed: dawn.killed } : null });
    if (dawn && dawn.kind === "dawn" && dawn.killed !== null) {
      await sleep(1200);
      audio.sfx("death");
    }
    if (after.phase !== "over") audio.music("day");
    await sleep(DAWN_MS);
  }

  private finish(): void {
    const game = this.view.game;
    const report = buildReport(game);
    audio.music(null);
    audio.sfx(report.humanWon ? "win" : "lose");
    this.publish({ report, speaking: null, night: null });
    clearSaved();
  }
}

function humanStandingOf(game: GameState): number {
  let sum = 0;
  let n = 0;
  for (const row of Object.values(game.history[game.history.length - 1] ?? {})) {
    sum += row[HUMAN];
    n++;
  }
  return n ? sum / n : 0;
}
