import { useState } from "react";
import { HUMAN, type GameState, type Report as ReportData } from "../engine";
import type { Driver } from "./game";
import { prob, signedProb, sprite } from "./format";

interface Props {
  report: ReportData;
  game: GameState;
  driver: Driver;
  onQuit: () => void;
}

export function Report({ report, game, driver, onQuit }: Props) {
  const [copied, setCopied] = useState(false);
  const r = report;
  const roleWord = r.humanRole === "seer" ? "the seer" : `a ${r.humanRole}`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(driver.recording()));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable
    }
  };
  return (
    <div className={`report ${r.humanWon ? "won" : "lost"}`}>
      <div className="report-head">
        <span className="report-title">{r.winner === "village" ? "The village wins." : "The wolves win."}</span>
        <span className="report-sub">
          You were {roleWord}. {r.humanSurvived ? "You survived." : "You did not survive."} {r.days} {r.days === 1 ? "day" : "days"}.
        </span>
      </div>
      <div className="report-roles">
        {game.players.map((p) => (
          <span key={p.id} className="report-role" title={`${p.name}: ${p.role}`}>
            <img src={sprite(p.name)} alt="" width={36} height={36} />
            <img className="badge" src={sprite(p.role)} alt={p.role} width={18} height={18} />
            <span>{p.id === HUMAN ? "you" : p.name}</span>
          </span>
        ))}
      </div>
      <table className="report-table">
        <tbody>
          <tr>
            <th>messages</th>
            <td>{r.messages}</td>
          </tr>
          <tr>
            <th>contradictions</th>
            <td>{r.contradictions}</td>
          </tr>
          <tr>
            <th>dodged questions</th>
            <td>{r.deflections}</td>
          </tr>
          {r.costliest ? (
            <tr>
              <th>costliest line</th>
              <td>
                <q>{r.costliest.text}</q> <span className="bad">{signedProb(r.costliest.delta)}</span> <span className="dim">d{r.costliest.day}</span>
              </td>
            </tr>
          ) : null}
          {r.best ? (
            <tr>
              <th>best line</th>
              <td>
                <q>{r.best.text}</q> <span className="good">{signedProb(r.best.delta)}</span> <span className="dim">d{r.best.day}</span>
              </td>
            </tr>
          ) : null}
          {r.leastTrusting ? (
            <tr>
              <th>never trusted you</th>
              <td>
                {r.leastTrusting.name} <span className="dim">mean {prob(r.leastTrusting.mean)}</span>
              </td>
            </tr>
          ) : null}
          {r.mostTrusting ? (
            <tr>
              <th>had your back</th>
              <td>
                {r.mostTrusting.name} <span className="dim">mean {prob(r.mostTrusting.mean)}</span>
              </td>
            </tr>
          ) : null}
          {r.humanRole !== "wolf" ? (
            <tr>
              <th>votes on wolves</th>
              <td>
                {r.votes.onWolves} of {r.votes.cast}
              </td>
            </tr>
          ) : null}
          {r.finalStanding.length ? (
            <tr>
              <th>final word on you</th>
              <td>{r.finalStanding.map((f) => `${f.name} ${prob(f.belief)}`).join(", ")}</td>
            </tr>
          ) : null}
        </tbody>
      </table>
      <div className="report-actions">
        <button type="button" className="primary" onClick={onQuit}>
          play again
        </button>
        <button type="button" className="flag-btn" onClick={copy} title="the seed and every action, enough to replay this game exactly">
          {copied ? "copied" : "copy recording"}
        </button>
        <span className="dim">scrub the board on the right to replay</span>
      </div>
    </div>
  );
}
