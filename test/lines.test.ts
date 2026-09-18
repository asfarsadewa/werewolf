// Lint for the authored line library. Every rule here is a content rule the
// engine relies on; a failure names the offending line id or group so the
// author can fix the text rather than the test.

import { describe, expect, it } from "vitest";
import {
  ALL_LINES,
  CORE_INTENTS,
  EVENT_INTENTS,
  INTENTS,
  LINE_BY_ID,
  NEEDS,
  PERSONALITIES,
  TONES,
  linesFor,
  type Intent,
  type LineSpec,
  type Need,
  type Personality,
  type Tone,
} from "../src/engine/lines/index";
import { LINES as MARA } from "../src/engine/lines/mara";
import { LINES as TOMAS } from "../src/engine/lines/tomas";
import { LINES as BEL } from "../src/engine/lines/bel";
import { LINES as INES } from "../src/engine/lines/ines";
import { LINES as KIP } from "../src/engine/lines/kip";
import { LINES as ROOK } from "../src/engine/lines/rook";
import { LINES as SOL } from "../src/engine/lines/sol";

const FILES: Readonly<Record<Personality, readonly LineSpec[]>> = {
  mara: MARA,
  tomas: TOMAS,
  bel: BEL,
  ines: INES,
  kip: KIP,
  rook: ROOK,
  sol: SOL,
};

/** Tones every event intent must cover; sarcastic and pleading are optional there. */
const EVENT_TONES: readonly Tone[] = ["calm", "nervous", "aggressive"];

const MUST_TARGET: readonly Intent[] = [
  "accuse_evidence",
  "accuse_bare",
  "defend_other",
  "question",
  "vote",
  "reveal_wolf",
  "reveal_clear",
  "rebuke",
];
const MUST_NOT_TARGET: readonly Intent[] = ["defend_self", "deflect", "chatter", "claim_seer", "greet", "mourn"];

/** State needs that belong to exactly one intent. */
const STATE_NEED_OWNER: Readonly<Record<string, Intent>> = {
  accused: "defend_self",
  asked: "answer",
  claim_exists: "counter_claim",
  death_today: "mourn",
};

/** Fact kinds every personality's accuse_evidence group must cover at least once. */
const REQUIRED_FACT_KINDS: readonly Need[] = ["fact:vote", "fact:contradiction", "fact:deflect", "fact:quiet", "fact:any"];

/** A need any intent may carry: the line refers to a vote already held. */
const ANYWHERE_NEEDS: readonly Need[] = ["past_vote"];

/** Intents that may carry an optional quiet/any fact need without being evidence. */
const OPTIONAL_FACT_INTENTS: readonly Intent[] = ["accuse_bare", "question"];
const OPTIONAL_FACT_NEEDS: readonly Need[] = ["fact:quiet", "fact:any"];

const NAME_WORD = /\b(stranger|mara|tomas|bel|ines|kip|rook|sol)\b/i;
const SLOT = /\{[^}]*\}/g;
const TARGET = "{target}";
/** `{target}. Capital` or `{target}, lowercase` (or the pronoun I). */
const VOCATIVE = /^\{target\}(?:\. [A-Z]|, (?:[a-z]|I\b))/;
const ASCII_PRINTABLE = /^[\x20-\x7e]+$/;
const ALL_CAPS_WORD = /\b[A-Z]{3,}\b/;

const MIN_CHARS = 12;
const MAX_CHARS = 120;

function groupKey(l: LineSpec): string {
  return `${l.who}.${l.intent}.${l.tone}`;
}

function isFactNeed(n: Need): boolean {
  return n.startsWith("fact:");
}

/** Collect problems and fail once with all of them, so a content pass fixes everything in one go. */
function assertNoProblems(problems: readonly string[]): void {
  expect(problems, problems.join("\n")).toEqual([]);
}

describe("line library: structure", () => {
  it("each personality file holds only that personality's lines and ALL_LINES is the roster-order concatenation", () => {
    const problems: string[] = [];
    for (const who of PERSONALITIES) {
      for (const l of FILES[who]) {
        if (l.who !== who) problems.push(`${l.id}: in ${who}.ts but who is "${l.who}"`);
      }
      const viaIndex = linesFor(who);
      if (viaIndex !== FILES[who]) problems.push(`linesFor("${who}") does not return the ${who}.ts array`);
    }
    const expected = PERSONALITIES.flatMap((who) => FILES[who]);
    if (ALL_LINES.length !== expected.length) {
      problems.push(`ALL_LINES has ${ALL_LINES.length} lines, files hold ${expected.length}`);
    } else {
      for (let i = 0; i < expected.length; i++) {
        if (ALL_LINES[i] !== expected[i]) {
          problems.push(`ALL_LINES[${i}] is ${ALL_LINES[i]?.id}, expected ${expected[i]?.id} (roster order mara..sol)`);
          break;
        }
      }
    }
    assertNoProblems(problems);
  });

  it("who, intent and tone are members of their enums", () => {
    const problems: string[] = [];
    for (const l of ALL_LINES) {
      if (!(PERSONALITIES as readonly string[]).includes(l.who)) problems.push(`${l.id}: unknown who "${l.who}"`);
      if (!(INTENTS as readonly string[]).includes(l.intent)) problems.push(`${l.id}: unknown intent "${l.intent}"`);
      if (!(TONES as readonly string[]).includes(l.tone)) problems.push(`${l.id}: unknown tone "${l.tone}"`);
    }
    assertNoProblems(problems);
  });

  it("ids are unique, match who.intent.tone.n, and n is 1-based and consecutive within the group", () => {
    const problems: string[] = [];
    const seen = new Set<string>();
    const counters = new Map<string, number>();
    for (const l of ALL_LINES) {
      if (seen.has(l.id)) problems.push(`${l.id}: duplicate id`);
      seen.add(l.id);
      const key = groupKey(l);
      const n = (counters.get(key) ?? 0) + 1;
      counters.set(key, n);
      const expected = `${key}.${n}`;
      if (l.id !== expected) problems.push(`${l.id}: expected id ${expected} (position ${n} in ${key})`);
    }
    if (LINE_BY_ID.size !== ALL_LINES.length) {
      problems.push(`LINE_BY_ID has ${LINE_BY_ID.size} entries for ${ALL_LINES.length} lines`);
    }
    for (const l of ALL_LINES) {
      if (LINE_BY_ID.get(l.id) !== l) problems.push(`${l.id}: LINE_BY_ID does not map to this line`);
    }
    assertNoProblems(problems);
  });

  it("no two lines share the same text", () => {
    const problems: string[] = [];
    const byText = new Map<string, string>();
    for (const l of ALL_LINES) {
      const key = l.text.toLowerCase();
      const prior = byText.get(key);
      if (prior) problems.push(`${l.id}: same text as ${prior}`);
      else byText.set(key, l.id);
    }
    assertNoProblems(problems);
  });
});

describe("line library: coverage", () => {
  it("every core intent has at least two lines for every tone, per personality", () => {
    const problems: string[] = [];
    for (const who of PERSONALITIES) {
      for (const intent of CORE_INTENTS) {
        for (const tone of TONES) {
          const count = ALL_LINES.filter((l) => l.who === who && l.intent === intent && l.tone === tone).length;
          if (count < 2) problems.push(`(${who}, ${intent}, ${tone}): ${count} line(s), need 2`);
        }
      }
    }
    assertNoProblems(problems);
  });

  it("every event intent has at least one line for calm, nervous and aggressive, per personality", () => {
    const problems: string[] = [];
    for (const who of PERSONALITIES) {
      for (const intent of EVENT_INTENTS) {
        for (const tone of EVENT_TONES) {
          const count = ALL_LINES.filter((l) => l.who === who && l.intent === intent && l.tone === tone).length;
          if (count < 1) problems.push(`(${who}, ${intent}, ${tone}): no line`);
        }
      }
    }
    assertNoProblems(problems);
  });

  it("every personality's accuse_evidence group covers the main fact kinds", () => {
    const problems: string[] = [];
    for (const who of PERSONALITIES) {
      const covered = new Set<Need>();
      for (const l of ALL_LINES) {
        if (l.who !== who || l.intent !== "accuse_evidence") continue;
        for (const n of l.needs ?? []) covered.add(n);
      }
      for (const kind of REQUIRED_FACT_KINDS) {
        if (!covered.has(kind)) problems.push(`(${who}, accuse_evidence): no line needs ${kind}`);
      }
    }
    assertNoProblems(problems);
  });

  it("optional needs never empty a core group on day one: every core tone group keeps a need-free line", () => {
    const problems: string[] = [];
    const stateOwned = new Set(Object.keys(STATE_NEED_OWNER));
    for (const who of PERSONALITIES) {
      for (const intent of CORE_INTENTS) {
        for (const tone of TONES) {
          const group = ALL_LINES.filter((l) => l.who === who && l.intent === intent && l.tone === tone);
          // Needs the intent itself requires do not count as optional.
          const free = group.filter((l) => (l.needs ?? []).every((n) => stateOwned.has(n) || (intent === "accuse_evidence" && isFactNeed(n)))).length;
          if (free < 1) problems.push(`(${who}, ${intent}, ${tone}): no line without optional needs`);
          if (OPTIONAL_FACT_INTENTS.includes(intent) && free < 2 && group.length >= 3) {
            problems.push(`(${who}, ${intent}, ${tone}): ${free} need-free line(s), need 2 when optional lines exist`);
          }
        }
      }
    }
    assertNoProblems(problems);
  });
});

describe("line library: slots and names", () => {
  it("{target} appears at most once, only as a leading vocative, and no other slot or name appears", () => {
    const problems: string[] = [];
    for (const l of ALL_LINES) {
      const slots = l.text.match(SLOT) ?? [];
      const foreign = slots.filter((s) => s !== TARGET);
      if (foreign.length) problems.push(`${l.id}: unknown slot(s) ${foreign.join(" ")}`);
      const targets = slots.filter((s) => s === TARGET).length;
      if (targets > 1) problems.push(`${l.id}: {target} appears ${targets} times`);
      if (targets === 1 && !VOCATIVE.test(l.text)) {
        problems.push(`${l.id}: {target} must open the line as "{target}. Xxx" or "{target}, xxx"`);
      }
      const name = l.text.match(NAME_WORD);
      if (name) problems.push(`${l.id}: contains the name "${name[0]}"`);
    }
    assertNoProblems(problems);
  });

  it("intents that address someone carry {target}; intents that speak to the room do not", () => {
    const problems: string[] = [];
    for (const l of ALL_LINES) {
      const has = l.text.includes(TARGET);
      if (MUST_TARGET.includes(l.intent) && !has) problems.push(`${l.id}: ${l.intent} must address {target}`);
      if (MUST_NOT_TARGET.includes(l.intent) && has) problems.push(`${l.id}: ${l.intent} must not address {target}`);
    }
    assertNoProblems(problems);
  });
});

describe("line library: needs", () => {
  it("needs are known, not repeated, and match the intent", () => {
    const problems: string[] = [];
    for (const l of ALL_LINES) {
      const needs = l.needs ?? [];
      for (const n of needs) {
        if (!(NEEDS as readonly string[]).includes(n)) problems.push(`${l.id}: unknown need "${n}"`);
      }
      if (new Set(needs).size !== needs.length) problems.push(`${l.id}: repeated need`);

      const facts = needs.filter(isFactNeed);
      const others = needs.filter((n) => !isFactNeed(n) && !ANYWHERE_NEEDS.includes(n) && !(n in STATE_NEED_OWNER));
      if (others.length) problems.push(`${l.id}: unexpected need(s) ${others.join(" ")}`);
      if (l.intent === "accuse_evidence") {
        if (facts.length === 0) problems.push(`${l.id}: accuse_evidence needs a fact:* need`);
      } else if (OPTIONAL_FACT_INTENTS.includes(l.intent)) {
        for (const f of facts) {
          if (!OPTIONAL_FACT_NEEDS.includes(f)) problems.push(`${l.id}: ${l.intent} may only need fact:quiet or fact:any, not ${f}`);
        }
      } else if (facts.length) {
        problems.push(`${l.id}: ${l.intent} must not need ${facts.join(" ")}`);
      }

      for (const [need, owner] of Object.entries(STATE_NEED_OWNER)) {
        const has = (needs as readonly string[]).includes(need);
        if (l.intent === owner && !has) problems.push(`${l.id}: ${owner} must need "${need}"`);
        if (l.intent !== owner && has) problems.push(`${l.id}: only ${owner} may need "${need}"`);
      }
    }
    assertNoProblems(problems);
  });
});

describe("line library: text", () => {
  it("text is short, spoken, plain ASCII, and punctuated once", () => {
    const problems: string[] = [];
    for (const l of ALL_LINES) {
      const t = l.text;
      if (t.length < MIN_CHARS || t.length > MAX_CHARS) problems.push(`${l.id}: ${t.length} chars, need ${MIN_CHARS}..${MAX_CHARS}`);
      if (t !== t.trim()) problems.push(`${l.id}: leading or trailing whitespace`);
      if (/[–—]/.test(t)) problems.push(`${l.id}: em or en dash`);
      if (/…|\.\.\./.test(t)) problems.push(`${l.id}: ellipsis`);
      if (!ASCII_PRINTABLE.test(t)) problems.push(`${l.id}: non-ASCII character (emoji, curly quote or dash)`);
      if (/\d/.test(t)) problems.push(`${l.id}: digit`);
      if (ALL_CAPS_WORD.test(t)) problems.push(`${l.id}: all-caps word`);
      if (t.includes("  ")) problems.push(`${l.id}: double space`);
      if (!/[.?!]$/.test(t)) problems.push(`${l.id}: must end with . ? or !`);
      const bangs = (t.match(/!/g) ?? []).length;
      if (bangs > 1) problems.push(`${l.id}: ${bangs} exclamation marks`);
    }
    assertNoProblems(problems);
  });
});
