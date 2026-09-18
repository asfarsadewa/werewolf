import { useCallback, useEffect, useMemo, useState } from "react";
import { VERSION, randomSeed, type Role } from "../engine";
import { fetchConfig, startSession, type Config } from "./api";
import { audio } from "./audio";
import { Driver, clearSaved, loadSaved, type Saved } from "./game";
import { Help } from "./Help";
import { Play } from "./Play";
import { Start } from "./Start";

export interface Prefs {
  hard: boolean;
}

const PREFS_KEY = "werewolf:prefs";

function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) return { hard: Boolean((JSON.parse(raw) as Partial<Prefs>).hard) };
  } catch {
    // storage unavailable
  }
  return { hard: false };
}

export function App() {
  const [config, setConfig] = useState<Config | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [starting, setStarting] = useState<string | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const saved = useMemo(() => loadSaved(), [driver]);

  useEffect(() => {
    fetchConfig()
      .then(setConfig)
      .catch((e: unknown) => setConfigError(e instanceof Error ? e.message : "configuration failed"));
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch {
      // storage unavailable
    }
  }, [prefs]);

  useEffect(() => () => driver?.dispose(), [driver]);

  const begin = useCallback((d: Driver) => {
    setDriver((old) => {
      old?.dispose();
      return d;
    });
    d.start();
  }, []);

  const start = useCallback(
    async (opts: { seed: string; humanRole?: Role; getToken: () => Promise<string> }) => {
      setStartError(null);
      setStarting("verifying");
      audio.unlock();
      try {
        const token = await opts.getToken();
        setStarting("dealing");
        const { session, expiresAt } = await startSession(token);
        clearSaved();
        begin(new Driver(opts.seed || randomSeed(), session, expiresAt, opts.humanRole));
      } catch (e) {
        setStartError(e instanceof Error ? e.message : "could not start");
      } finally {
        setStarting(null);
      }
    },
    [begin],
  );

  const resume = useCallback(
    (s: Saved) => {
      audio.unlock();
      try {
        begin(new Driver(s.seed, s.session, s.expiresAt, s.humanRole, s.actions));
      } catch (e) {
        clearSaved();
        setStartError(`could not resume: ${e instanceof Error ? e.message : "unknown error"}`);
      }
    },
    [begin],
  );

  const quit = useCallback(() => {
    setDriver((old) => {
      old?.dispose();
      return null;
    });
    audio.music(null);
  }, []);

  return (
    <div className={`app${driver ? " playing" : ""}`}>
      {driver ? (
        <Play driver={driver} prefs={prefs} onPrefs={setPrefs} onQuit={quit} onHelp={() => setHelpOpen(true)} />
      ) : (
        <Start
          config={config}
          configError={configError}
          prefs={prefs}
          onPrefs={setPrefs}
          onStart={start}
          onResume={resume}
          saved={saved}
          starting={starting}
          error={startError}
          onHelp={() => setHelpOpen(true)}
        />
      )}
      <footer className="bottom">
        <span>
          measurements by <a href="https://typesafe.ai" rel="noreferrer">TypeSafe Jev</a>
          <span className="ver"> · v{VERSION}</span>
        </span>
        <span className="bottom-links">
          <a href="https://github.com/asfarsadewa/werewolf" rel="noreferrer">
            source
          </a>
          <span aria-hidden="true">·</span>
          <span>MIT</span>
          <span aria-hidden="true">·</span>
          <a className="x-link" href="https://x.com/ashthepeasant" rel="noreferrer" aria-label="ashthepeasant on X" title="@ashthepeasant">
            <svg className="x-mark" viewBox="0 0 24 24" width="13" height="13" aria-hidden="true" focusable="false">
              <path
                fill="currentColor"
                d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
              />
            </svg>
            <span>ashthepeasant</span>
          </a>
        </span>
      </footer>
      <Help open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
