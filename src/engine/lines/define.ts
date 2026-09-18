// A per-personality line builder. The number is written by the author and
// never derived from position, so ids stay stable when lines are added: voice
// clips are keyed by id.

import type { Intent, LineSpec, Need, Personality, Tone } from "./types";

export type LineBuilder = (
  intent: Intent,
  tone: Tone,
  n: number,
  text: string,
  needs?: readonly Need[],
) => LineSpec;

export function speaker(who: Personality): LineBuilder {
  return (intent, tone, n, text, needs) => {
    const id = `${who}.${intent}.${tone}.${n}`;
    return needs ? { id, who, intent, tone, text, needs } : { id, who, intent, tone, text };
  };
}
