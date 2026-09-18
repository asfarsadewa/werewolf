import { HUMAN, type Board as BoardData, type GameState } from "../engine";
import { prob, sprite } from "./format";

interface Props {
  game: GameState;
  speaking: number | null;
  board: BoardData;
  /** Hard mode: only the table's view of you is shown. */
  hard?: boolean;
  onSelect: (id: number) => void;
}

/** Mean of the living villagers' belief in a player, from a board snapshot. */
export function heat(board: BoardData, id: number): number | null {
  let sum = 0;
  let n = 0;
  for (const [mind, row] of Object.entries(board)) {
    if (Number(mind) === id) continue;
    sum += row[id];
    n++;
  }
  return n ? sum / n : null;
}

export function Table({ game, speaking, board, hard = false, onSelect }: Props) {
  return (
    <div className="table" role="list">
      {game.players.map((p) => {
        const h = p.alive && (!hard || p.id === HUMAN) ? heat(board, p.id) : null;
        const classes = ["bust", p.alive ? "alive" : "dead", speaking === p.id ? "speaking" : "", p.id === HUMAN ? "you" : ""].filter(Boolean).join(" ");
        return (
          <button type="button" key={p.id} className={classes} onClick={() => onSelect(p.id)} role="listitem" title={p.alive ? `${p.name}: the table's suspicion ${h === null ? "" : prob(h)}` : `${p.name} was ${p.role}`}>
            <span className="bust-img">
              <img src={sprite(p.name)} alt="" width={64} height={64} />
              {!p.alive && <img className="badge" src={sprite(p.role)} alt={p.role} width={28} height={28} />}
            </span>
            <span className="bust-name">{p.id === HUMAN ? "you" : p.name}</span>
            <span className="bust-heat" style={h === null ? undefined : ({ "--pct": `${Math.round(h * 85)}%` } as React.CSSProperties)}>
              {p.alive ? (h === null ? "" : prob(h)) : p.role}
            </span>
          </button>
        );
      })}
    </div>
  );
}
