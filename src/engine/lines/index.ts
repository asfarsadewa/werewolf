// The whole line library, one array per personality, in roster order.

import { PERSONALITIES, type LineSpec, type Personality } from "./types";
import { LINES as MARA } from "./mara";
import { LINES as TOMAS } from "./tomas";
import { LINES as BEL } from "./bel";
import { LINES as INES } from "./ines";
import { LINES as KIP } from "./kip";
import { LINES as ROOK } from "./rook";
import { LINES as SOL } from "./sol";

export * from "./types";

const BY_PERSONALITY: Readonly<Record<Personality, readonly LineSpec[]>> = {
  mara: MARA,
  tomas: TOMAS,
  bel: BEL,
  ines: INES,
  kip: KIP,
  rook: ROOK,
  sol: SOL,
};

/** Every line, mara..sol in roster order. */
export const ALL_LINES: readonly LineSpec[] = PERSONALITIES.flatMap((who) => BY_PERSONALITY[who]);

/** The lines one villager can say. */
export function linesFor(who: Personality): readonly LineSpec[] {
  return BY_PERSONALITY[who];
}

/** Lookup by stable id, for voice clips and transcripts. */
export const LINE_BY_ID: ReadonlyMap<string, LineSpec> = new Map(ALL_LINES.map((l) => [l.id, l]));
