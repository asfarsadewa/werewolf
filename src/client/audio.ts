// Music, sound effects and pre-rendered voice. Everything is a static file;
// nothing is synthesised here. Audio only starts after a user gesture.

export interface AudioSettings {
  music: boolean;
  sfx: boolean;
  voice: boolean;
}

export type SfxName =
  | "send"
  | "tick-up"
  | "tick-down"
  | "turn"
  | "vote"
  | "toll"
  | "reveal-wolf"
  | "reveal-villager"
  | "night"
  | "dawn"
  | "death"
  | "win"
  | "lose"
  | "click";

export type MusicName = "title" | "day" | "night";

interface AudioManifest {
  sfx: Record<string, { file: string; seconds: number; loop: boolean; gainDb: number }>;
  music: Record<string, { file: string; seconds: number }>;
}

interface VoiceManifest {
  clips: Record<string, { seconds: number; bytes: number }>;
}

const SETTINGS_KEY = "werewolf:audio";
const MUSIC_VOLUME = 0.32;
const SFX_VOLUME = 0.7;
const VOICE_VOLUME = 0.95;
const FADE_MS = 1400;
const GAP_MS = 140;

function loadSettings(): AudioSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<AudioSettings>;
      return { music: p.music ?? true, sfx: p.sfx ?? true, voice: p.voice ?? true };
    }
  } catch {
    // storage unavailable
  }
  return { music: true, sfx: true, voice: true };
}

class Manager {
  settings: AudioSettings = loadSettings();
  private unlocked = false;
  private manifest: AudioManifest | null = null;
  private voice: VoiceManifest | null = null;
  private current: { name: MusicName; el: HTMLAudioElement } | null = null;
  private fades = new Set<number>();
  private speaking: HTMLAudioElement | null = null;
  private speakToken = 0;
  private listeners = new Set<() => void>();
  private cache = new Map<string, HTMLAudioElement>();

  constructor() {
    if (typeof window === "undefined") return;
    void fetch("/audio/manifest.json")
      .then((r) => (r.ok ? (r.json() as Promise<AudioManifest>) : null))
      .then((m) => {
        this.manifest = m;
      })
      .catch(() => undefined);
    void fetch("/voice/manifest.json")
      .then((r) => (r.ok ? (r.json() as Promise<VoiceManifest>) : null))
      .then((m) => {
        this.voice = m;
      })
      .catch(() => undefined);
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  setSettings(next: Partial<AudioSettings>): void {
    this.settings = { ...this.settings, ...next };
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
    } catch {
      // storage unavailable
    }
    if (!this.settings.music && this.current) this.music(null);
    if (!this.settings.voice) this.stopSpeaking();
    for (const fn of this.listeners) fn();
  }

  /** Call from a click handler once; browsers refuse audio before a gesture. */
  unlock(): void {
    if (this.unlocked) return;
    this.unlocked = true;
    const el = new Audio();
    el.muted = true;
    void el.play().catch(() => undefined);
  }

  hasVoice(key: string): boolean {
    return this.voice?.clips[key] !== undefined;
  }

  /** Seconds a clip runs, or an estimate from text when unknown. */
  voiceSeconds(keys: string[], text: string): number {
    if (this.voice) {
      let total = 0;
      let known = 0;
      for (const k of keys) {
        const c = this.voice.clips[k];
        if (c) {
          total += c.seconds;
          known++;
        }
      }
      if (known === keys.length) return total + (GAP_MS / 1000) * Math.max(0, keys.length - 1);
    }
    return Math.min(6, Math.max(1.4, text.length / 14));
  }

  preloadVoice(keys: string[]): void {
    if (!this.settings.voice) return;
    for (const k of keys) {
      if (!this.hasVoice(k) || this.cache.has(k)) continue;
      const el = new Audio(`/voice/${k}.mp3`);
      el.preload = "auto";
      this.cache.set(k, el);
      if (this.cache.size > 24) {
        const first = this.cache.keys().next().value;
        if (first) this.cache.delete(first);
      }
    }
  }

  /** Plays clips in order. Resolves when finished, or at once if voice is off. */
  async speak(keys: string[]): Promise<void> {
    this.stopSpeaking();
    if (!this.settings.voice || !this.unlocked) return;
    const token = ++this.speakToken;
    for (const k of keys) {
      if (token !== this.speakToken) return;
      if (!this.hasVoice(k)) continue;
      const el = this.cache.get(k) ?? new Audio(`/voice/${k}.mp3`);
      this.cache.delete(k);
      el.volume = VOICE_VOLUME;
      this.speaking = el;
      await new Promise<void>((resolve) => {
        const done = () => {
          el.removeEventListener("ended", done);
          el.removeEventListener("error", done);
          resolve();
        };
        el.addEventListener("ended", done);
        el.addEventListener("error", done);
        el.currentTime = 0;
        el.play().catch(done);
      });
      if (token !== this.speakToken) return;
      await new Promise((r) => setTimeout(r, GAP_MS));
    }
    this.speaking = null;
  }

  stopSpeaking(): void {
    this.speakToken++;
    if (this.speaking) {
      try {
        this.speaking.pause();
      } catch {
        // already stopped
      }
      this.speaking = null;
    }
  }

  sfx(name: SfxName): void {
    if (!this.settings.sfx || !this.unlocked) return;
    const meta = this.manifest?.sfx[name];
    const el = new Audio(meta?.file ?? `/audio/sfx/${name}.mp3`);
    const gain = meta ? 10 ** (meta.gainDb / 20) : 1;
    el.volume = Math.min(1, SFX_VOLUME * gain);
    el.loop = meta?.loop ?? false;
    void el.play().catch(() => undefined);
    if (el.loop) window.setTimeout(() => el.pause(), (meta?.seconds ?? 5) * 1000 * 2);
  }

  /** Crossfades to a track, or fades out with null. */
  music(name: MusicName | null): void {
    if (this.current?.name === name) return;
    const old = this.current;
    this.current = null;
    if (old) this.fade(old.el, 0, () => old.el.pause());
    if (!name || !this.settings.music || !this.unlocked) return;
    const meta = this.manifest?.music[name];
    const el = new Audio(meta?.file ?? `/audio/music/${name}.mp3`);
    el.loop = true;
    el.volume = 0;
    this.current = { name, el };
    el.play()
      .then(() => this.fade(el, MUSIC_VOLUME))
      .catch(() => {
        if (this.current?.el === el) this.current = null;
      });
  }

  /** Ducks the music while a villager speaks. */
  duck(on: boolean): void {
    if (!this.current) return;
    this.fade(this.current.el, on ? MUSIC_VOLUME * 0.45 : MUSIC_VOLUME, undefined, 350);
  }

  private fade(el: HTMLAudioElement, to: number, done?: () => void, ms = FADE_MS): void {
    const from = el.volume;
    const start = performance.now();
    const step = () => {
      const t = Math.min(1, (performance.now() - start) / ms);
      el.volume = Math.max(0, Math.min(1, from + (to - from) * t));
      if (t < 1) {
        this.fades.add(requestAnimationFrame(step));
      } else done?.();
    };
    step();
  }
}

export const audio = new Manager();
