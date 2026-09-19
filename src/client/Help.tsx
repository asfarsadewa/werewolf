import { useEffect, useRef } from "react";
import { HUMAN_MESSAGES_PER_DAY, PERSONALITY, ROUNDS_PER_DAY, SEATS, THRESHOLDS } from "../engine";

interface Props {
  open: boolean;
  onClose: () => void;
}

const TRAITS: Record<string, string> = {
  mara: "only moves on evidence; bare accusations barely register",
  tomas: "drifts toward the room and votes with the plurality",
  bel: "punishes dodged questions hardest",
  ines: "believes people who vouch for others",
  kip: "returns suspicion to whoever accuses him",
  rook: "keeps a ledger: contradictions and bad votes cost most",
  sol: "moves late and little, then decides",
};

export function Help({ open, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog ref={ref} className="man" onClose={onClose} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="man-body">
        <div className="man-head">
          <span>WEREWOLF(6)</span>
          <span>Games Manual</span>
          <span>WEREWOLF(6)</span>
        </div>
        <h2>NAME</h2>
        <p>werewolf, a game of trust against seven villagers whose suspicions are calibrated probabilities.</p>
        <h2>SYNOPSIS</h2>
        <p>Eight seats: you and seven villagers. Two are wolves, one is the seer, the rest are villagers. You may be dealt any role.</p>
        <h2>DESCRIPTION</h2>
        <p>
          Days: the table talks for {ROUNDS_PER_DAY} rounds; you may send {HUMAN_MESSAGES_PER_DAY} messages whenever you like. Then everyone votes; the
          plurality is eliminated and their role is revealed; ties eliminate nobody. Nights: the wolves kill one player; the seer learns whether one
          player is a wolf. The village wins when both wolves are dead. The wolves win when they equal the others.
        </p>
        <p>
          Every message is measured once by TypeSafe Jev: about twenty typed questions in one request, each answered with a probability. Code turns
          probabilities into belief changes. A signal below its threshold changes nothing; that is the whole trick.
        </p>
        <h2>THE BOARD</h2>
        <p>
          Rows are villagers, columns are players. A cell is that villager's belief that the player is a wolf. Each row is shifted by one common
          amount in log-odds so it sums to the number of wolves still hidden, which means that when one cell rises the rest of the row eases; the
          board marks those moves as renormalised. Every arrow on the board is a change in that displayed probability; the trace under a cell
          shows the log-odds mechanics behind it, marked Δlogit. Your column is what matters. Click any cell to read why it moved.
        </p>
        <h2>THRESHOLDS</h2>
        <table className="man-rules">
          <thead>
            <tr>
              <th>signal</th>
              <th>counts at</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(THRESHOLDS)
              .filter(([k]) => k !== "target")
              .map(([k, v]) => (
                <tr key={k}>
                  <td>{k}</td>
                  <td>{v.toFixed(2)}</td>
                </tr>
              ))}
          </tbody>
        </table>
        <h2>THE TABLE</h2>
        <dl>
          {SEATS.filter((s) => s.personality).map((s) => (
            <div key={s.id}>
              <dt>
                {s.name} <span className="dim">accuses at {PERSONALITY[s.personality!].accuseAt.toFixed(2)}</span>
              </dt>
              <dd>{TRAITS[s.personality!]}</dd>
            </div>
          ))}
        </dl>
        <h2>ADVICE</h2>
        <p>
          Cite votes and statements; bare accusations are discounted. Answer questions put to you; dodging costs more than a bad answer. Keep your
          story straight; the villagers remember what you said. Silence costs a little every day. A suspected speaker is less credible, so spend your
          standing carefully.
        </p>
        <h2>PRIVACY</h2>
        <p>Messages are sent to the game's server and to TypeSafe for measurement. Nothing is stored beyond the current game in your browser.</p>
        <div className="man-foot">
          <span>werewolf.asfarlab.fun</span>
          <button type="button" className="link" onClick={onClose}>
            close
          </button>
        </div>
      </div>
    </dialog>
  );
}
