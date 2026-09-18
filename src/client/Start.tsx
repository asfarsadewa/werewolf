import { useEffect, useRef, useState } from "react";
import { HUMAN_MESSAGES_PER_DAY, SEATS, randomSeed, type Role } from "../engine";
import type { Config } from "./api";
import type { Prefs } from "./App";
import { useAudioSettings } from "./hooks";
import type { Saved } from "./game";
import { sprite } from "./format";
import { useTurnstile } from "./turnstile";

interface Props {
  config: Config | null;
  configError: string | null;
  prefs: Prefs;
  onPrefs: (p: Prefs) => void;
  onStart: (opts: { seed: string; humanRole?: Role; getToken: () => Promise<string> }) => void;
  onResume: (s: Saved) => void;
  saved: Saved | null;
  starting: string | null;
  error: string | null;
  onHelp: () => void;
}

export function Start({ config, configError, prefs, onPrefs, onStart, onResume, saved, starting, error, onHelp }: Props) {
  const [seed, setSeed] = useState(randomSeed);
  const [role, setRole] = useState<Role | "">("");
  const [settings, setSettings] = useAudioSettings();
  const turnstileRef = useRef<HTMLDivElement>(null);
  const turnstile = useTurnstile(config?.siteKey ?? null, turnstileRef);
  const [advanced, setAdvanced] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(location.search).has("dev")) setAdvanced(true);
  }, []);

  const canStart = config !== null && starting === null && turnstile.state !== "error";
  const verifyState = turnstile.state === "error" ? "verification failed; reload" : configError ? `config: ${configError}` : null;

  return (
    <main className="start">
      <header className="top">
        <h1 className="wordmark">werewolf</h1>
        <div className="cli" role="group" aria-label="options">
          <button type="button" className="flag-btn" aria-pressed={settings.music} onClick={() => setSettings({ music: !settings.music })} title="music">
            music
          </button>
          <button type="button" className="flag-btn" aria-pressed={settings.voice} onClick={() => setSettings({ voice: !settings.voice })} title="villagers speak aloud">
            voice
          </button>
          <button type="button" className="flag-btn" aria-pressed={settings.sfx} onClick={() => setSettings({ sfx: !settings.sfx })} title="sound effects">
            sfx
          </button>
          <button type="button" className="flag-btn help-btn" onClick={onHelp}>
            --help
          </button>
        </div>
      </header>

      <section className="hero">
        <img className="village" src="/sprites/village.webp" srcSet="/sprites/village-768.webp 768w, /sprites/village.webp 1536w" sizes="(max-width: 900px) 100vw, 1000px" alt="A hillside village at dusk under a pale moon" width={1536} height={640} />
        <div className="hero-copy">
          <p className="lede">Seven villagers. Two wolves. Every word you type is measured.</p>
          <p>
            Each message goes to a System One model, TypeSafe Jev, which answers about twenty typed questions in one request: does it contradict what
            you said, does it dodge, does it accuse with evidence. Seven villagers turn those probabilities into suspicion, in the open, within a
            fraction of a second. They never generate text. Winning means being persuasive to people whose trust is a number you can see.
          </p>
        </div>
      </section>

      <section className="roster" aria-label="the table">
        {SEATS.map((s) => (
          <figure key={s.id} className="bust">
            <img src={sprite(s.name)} alt="" width={64} height={64} />
            <figcaption>{s.id === 0 ? "you" : s.name}</figcaption>
          </figure>
        ))}
      </section>

      <section className="deal">
        <div className="deal-row">
          <label className="opt">
            <span className="flag">--seed</span>
            <input value={seed} onChange={(e) => setSeed(e.target.value.trim().slice(0, 24))} spellCheck={false} aria-label="seed" />
            <button type="button" className="reroll" onClick={() => setSeed(randomSeed())} title="new seed" aria-label="new seed">
              ↻
            </button>
          </label>
          <button type="button" className="flag-btn" aria-pressed={prefs.hard} onClick={() => onPrefs({ ...prefs, hard: !prefs.hard })} title="hide the belief board; see only what they think of you">
            --hard
          </button>
          {advanced && (
            <label className="opt">
              <span className="flag">--role</span>
              <select value={role} onChange={(e) => setRole(e.target.value as Role | "")} aria-label="force role">
                <option value="">dealt</option>
                <option value="villager">villager</option>
                <option value="seer">seer</option>
                <option value="wolf">wolf</option>
              </select>
            </label>
          )}
          <button
            type="button"
            className="primary"
            disabled={!canStart}
            onClick={() => onStart({ seed, humanRole: role || undefined, getToken: turnstile.getToken })}
          >
            {starting ?? "deal me in"}
          </button>
          {saved && (
            <button type="button" className="flag-btn" onClick={() => onResume(saved)} title={`day ${saved.actions.length ? "in progress" : "1"}, seed ${saved.seed}`}>
              resume
            </button>
          )}
        </div>
        <div className="turnstile" ref={turnstileRef} />
        {(verifyState || error) && <p className="verify-state">{error ?? verifyState}</p>}
        <p className="hint">
          {HUMAN_MESSAGES_PER_DAY} messages a day, 280 characters each. Two rounds of talk, then a vote. Nights are short. Say less than you think you
          should, and mean it.
        </p>
      </section>
    </main>
  );
}
