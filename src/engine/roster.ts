// The eight seats at the table. Names are fixed so voice clips can address
// anyone by name; the human is always "Stranger".

import type { Personality } from "./lines/types";

export const HUMAN = 0;

export interface Seat {
  id: number;
  name: string;
  /** Undefined for the human. */
  personality?: Personality;
  /** Gemini prebuilt voice for pre-rendered lines. */
  voice?: string;
}

export const SEATS: readonly Seat[] = [
  { id: 0, name: "Stranger" },
  { id: 1, name: "Mara", personality: "mara", voice: "Kore" },
  { id: 2, name: "Tomas", personality: "tomas", voice: "Puck" },
  { id: 3, name: "Bel", personality: "bel", voice: "Erinome" },
  { id: 4, name: "Ines", personality: "ines", voice: "Sulafat" },
  { id: 5, name: "Kip", personality: "kip", voice: "Fenrir" },
  { id: 6, name: "Rook", personality: "rook", voice: "Charon" },
  { id: 7, name: "Sol", personality: "sol", voice: "Gacrux" },
];

export const NAMES: readonly string[] = SEATS.map((s) => s.name);
export const PLAYER_COUNT = SEATS.length;
