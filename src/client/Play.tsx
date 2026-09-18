import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { HUMAN, humanStanding } from "../engine";
import type { Prefs } from "./App";
import { useAudioSettings } from "./hooks";
import { Board } from "./Board";
import { Composer } from "./Composer";
import type { Driver, View } from "./game";
import { Report } from "./Report";
import { Table } from "./Table";
import { Transcript } from "./Transcript";

interface Props {
  driver: Driver;
  prefs: Prefs;
  onPrefs: (p: Prefs) => void;
  onQuit: () => void;
  onHelp: () => void;
}

export interface Selection {
  mind: number;
  about: number;
}

function useView(driver: Driver): View {
  return useSyncExternalStore(
    (fn) => driver.subscribe(fn),
    () => driver.view,
    () => driver.view,
  );
}

export function Play({ driver, prefs, onPrefs, onQuit, onHelp }: Props) {
  const view = useView(driver);
  const { game } = view;
  const [settings, setSettings] = useAudioSettings();
  const [selected, setSelected] = useState<Selection | null>(null);
  const [scrub, setScrub] = useState<number | null>(null);

  // Default selection: the villager most suspicious of you.
  useEffect(() => {
    if (selected && game.players[selected.mind].alive) return;
    const board = game.history[game.history.length - 1] ?? {};
    let best: number | null = null;
    for (const [id, row] of Object.entries(board)) if (best === null || row[HUMAN] > board[best][HUMAN]) best = Number(id);
    if (best !== null) setSelected({ mind: best, about: HUMAN });
  }, [game, selected]);

  useEffect(() => {
    if (view.report) setScrub(null);
  }, [view.report]);

  const over = game.phase === "over";
  const at = scrub ?? game.log.length - 1;
  const board = game.history[Math.min(at, game.history.length - 1)] ?? {};
  const standing = useMemo(() => humanStanding(game), [game]);
  const status = over
    ? view.report?.humanWon
      ? "you won"
      : "you lost"
    : game.phase === "vote"
      ? `day ${game.day} · the vote`
      : game.phase === "night"
        ? `night ${game.day}`
        : `day ${game.day} · ${game.queue.length ? "the table talks" : "your move"}`;
  const role = game.players[HUMAN].role;
  const you = game.players[HUMAN];

  const select = useCallback((s: Selection) => setSelected(s), []);

  return (
    <>
      <header className="top">
        <h1 className="wordmark">
          werewolf <span className="status">{status}</span>
        </h1>
        <div className="cli" role="group" aria-label="options">
          <span className="opt role-chip" title="your role; only you can see this">
            <img src={`/sprites/${role}-128.webp`} alt="" width={20} height={20} />
            <span>{you.alive ? `you are ${role === "seer" ? "the seer" : `a ${role}`}` : `you were ${role === "seer" ? "the seer" : `a ${role}`}`}</span>
          </span>
          <button type="button" className="flag-btn" aria-pressed={prefs.hard} onClick={() => onPrefs({ ...prefs, hard: !prefs.hard })} title="hide the board">
            --hard
          </button>
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
          <button type="button" className="flag-btn" onClick={onQuit} title="abandon this game">
            quit
          </button>
        </div>
      </header>

      <main className="panes">
        <section className="pane pane-village" aria-label="the table">
          <Table game={game} speaking={view.speaking ?? view.announcing} board={board} hard={prefs.hard && !over} onSelect={(id) => select({ mind: selected?.mind ?? id, about: id })} />
          {view.report ? <Report report={view.report} game={game} driver={driver} onQuit={onQuit} /> : null}
          <Transcript view={view} highlight={scrub} onSelect={select} />
          {!over && <Composer view={view} driver={driver} />}
        </section>

        <section className="pane pane-board" aria-label="belief board">
          <Board
            game={game}
            board={board}
            hard={prefs.hard && !over}
            selected={selected}
            onSelect={select}
            standing={standing}
            lastJudgeMs={view.lastJudgeMs}
            scrub={over ? { at, max: game.log.length - 1, onChange: setScrub } : null}
          />
        </section>
      </main>
      {view.error && (
        <div className="toast" role="status">
          {view.error}
        </div>
      )}
    </>
  );
}
