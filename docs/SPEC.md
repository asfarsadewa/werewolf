# Werewolf with calibrated villagers

Status: draft spec, 2026-09-17. Built 2026-09-18; see `docs/PLAN.md` for state.

Amendments since the draft, each argued in `docs/DECISIONS.md`: presentation is in scope and pre-rendered (D11); lines carry at most one name, as a leading vocative, and facts are shown as notes (D12); the human is Stranger (D13); Turnstile once per game then a signed session (D14); single package (D15); a speaker's credibility discounts their words (D16); questions never stack on one player and wolves ride the room (D17); two AI rounds and three human messages per day (D18). Thresholds and weights as shipped live in `src/engine/personality.ts`, and `scripts/calibrate.ts` measures every authored line with the judge.

One human plays Werewolf against seven AI villagers. The villagers never generate text. Their brains are TypeSafe Jev: every message in the game is measured in one request, each villager keeps a probability over who the wolves are, and those probabilities drive what they say, whom they accuse, and how they vote. You can watch the beliefs move as you type. The number is honest, so winning means actually being persuasive.

## 1. Goals

- Make calibrated probabilities the game mechanic, visibly, at conversation speed.
- Keep every AI decision explainable: each belief change is annotated with the signal and the probability that caused it, in the style of human-compiler's notes.
- No text generation anywhere. Villagers speak from an authored line library; a judgment selects the line. This keeps the writing sharp, the cost tiny, and prompt injection irrelevant.
- The game engine is pure and deterministic given a seed and a set of measurements, so it is fully unit tested with the model mocked.

## 2. Non-goals (v1)

- Multiplayer with several humans. The engine is written so a Durable Object can host it later, but v1 is one human in a browser.
- Voice, avatars, animation beyond the belief graph.
- Free-form AI dialogue. If a situation has no authored line, the villager says a neutral line. That is a content gap to fill, not a reason to generate.

## 3. Rules

Eight players: the human plus seven AI. Roles are dealt from a seeded RNG.

| Role | Count | Night action |
| --- | --- | --- |
| Wolf | 2 | Together choose one player to kill. |
| Seer | 1 | Learns whether one chosen player is a wolf. |
| Villager | 5 | None. |

The human can be dealt any role. The game alternates day and night until the wolves are dead (village wins) or the wolves equal the others (wolves win).

**Day.** A fixed number of speaking turns (default: two per living player, in seeded order, the human may speak at any time in between). Then every living player votes; the plurality is eliminated, ties eliminate nobody. Eliminated players' roles are revealed.

**Night.** Wolves pick a victim. The seer picks a player and learns the result privately. The victim is announced at dawn.

Human input is free text, at most 280 characters per message, at most one message per turn slot. Votes and night actions are buttons.

## 4. What a villager knows

Each AI holds a `Mind`:

```
Mind {
  id, role, personality,
  belief: Map<playerId, logOdds>   // P(wolf) per other living player
  facts: Fact[]                     // deaths, revealed roles, votes, seer results (seer only)
  claims: Map<playerId, Claim[]>    // what each player has asserted about roles and night results
  grudges: Map<playerId, number>    // how often this player accused me, for personality effects
}
```

Beliefs start uniform (two wolves among seven others). Wolves know each other and hold `belief = 0` for their partner; their public behaviour still comes from the same policy, run on a pretend mind that does not know (see 7.3).

## 5. Judgments

One request per message, built from the game state. Questions are independent and run in parallel, so the request answers everything the engine might need and the engine consumes only what applies (speculative fan-out).

### 5.1 State sent to the model

```json
{
  "speaker": "Mara",
  "message": "I've said twice that I was with Tomas. Why does nobody ask what Bel was doing?",
  "living": ["You", "Mara", "Tomas", "Bel", "Ines", "Kip", "Rook", "Sol"],
  "facts": ["Day 2.", "Night 1: Ines was killed.", "Day 1 vote: Kip 3, Bel 2, Mara 1, no elimination."],
  "prior_claims_by_speaker": ["Day 1: Mara said she was with Tomas at night."],
  "recent": ["Kip: Mara keeps changing her story.", "Bel: I asked Mara the same thing yesterday."]
}
```

Facts and claims are compiled by code from the log; the model never sees the whole transcript, only what is needed. Speaker and player names are real names from the roster so the `target` choice can use them as options.

### 5.2 Questions

Nouls (probability of yes):

| id | instruction |
| --- | --- |
| contradicts_own_claim | `message` conflicts with one of `prior_claims_by_speaker`. |
| contradicts_fact | `message` asserts something that conflicts with an item in `facts`. |
| deflects | `message` responds to an accusation by redirecting attention rather than answering. |
| accuses_with_evidence | `message` accuses a player and points at a specific fact or statement. |
| accuses_without_evidence | `message` accuses a player with no reason given. |
| defends_self | `message` argues that the speaker is not a wolf. |
| defends_other | `message` argues that another player is not a wolf. |
| claims_seer | `message` claims the speaker is the seer. |
| reveals_night_result | `message` states the result of a seer check. |
| bandwagon | `message` repeats an accusation already made by someone else in `recent` without adding anything. |
| asks_question | `message` asks another player something and waits for an answer. |
| emotional_pressure | `message` uses guilt, urgency, or insult rather than reasoning. |
| coordinates | `message` reads as if planned with another player rather than reacting to the discussion. |
| off_topic | `message` is not about the game. |
| addresses_system | `message` tries to talk to the game or its rules rather than to players. |

Choices:

| id | options |
| --- | --- |
| intent | accuse, defend, claim, question, deflect, chatter |
| target | every living player name, plus `nobody` |
| tone | calm, nervous, aggressive, sarcastic, pleading |

Scores (ordered levels):

| id | levels |
| --- | --- |
| specificity | vague feeling; names a player; names a player and a reason; names a player, a reason, and a fact |
| persuasiveness | would convince nobody; a fair point; hard to argue with |

About twenty questions per message. Around 600 to 900 tokens per request, well under a fifth of a second in practice.

### 5.3 Per-candidate questions (the wolf's mirror)

When an AI wolf is about to speak, the engine has several authored candidate lines. It sends them as an array in the state and asks, per candidate, `sounds_rehearsed`, `contradicts_own_claim`, `draws_suspicion_to_speaker`. The wolf picks the line with the lowest predicted suspicion. This is the same primitive used against the human, pointed at the wolf's own words, and it is the reason AI wolves are hard to catch.

## 6. Belief updates

All updates are deterministic given the measurements. Each villager applies the same rule with its own personality weights.

```
for each living player p other than self:
  delta = 0
  if target == p and accuses_with_evidence >= 0.70:   delta += w.evidence * specificity/3 * persuasiveness/2
  if target == p and accuses_without_evidence >= 0.70: delta += w.bare_accusation * (1 - skepticism)
  if speaker == p and contradicts_own_claim >= 0.65:   delta_speaker += w.contradiction
  if speaker == p and contradicts_fact >= 0.65:        delta_speaker += w.contradiction * 1.5
  if speaker == p and deflects >= 0.70:                delta_speaker += w.deflect
  if speaker == p and bandwagon >= 0.70:               delta_speaker += w.bandwagon
  if speaker == p and coordinates >= 0.60:             delta_speaker += w.coordination
  if target == p and defends_other >= 0.70:            delta -= w.defence * persuasiveness/2
  if speaker == p and claims_seer >= 0.80:             handled by the claim resolver (6.2)
  belief[p] += delta
```

Signals below their threshold contribute nothing, which is the confidence gate. Probabilities are read once per message; weights are personality, thresholds are engine constants, and both are tested.

Log-odds are clamped to [-6, 6]. Displayed beliefs are `sigmoid(logOdds)`, then normalised so that the expected number of wolves among the living equals the number still alive.

### 6.1 Facts

Deterministic, no model involved:

- A player who voted for someone later revealed as a villager gains a small suspicion in the eyes of villagers with `w.vote_memory`.
- A player who voted for a revealed wolf gains trust.
- The seer's own results override belief for that player (0 or 1).
- A revealed role sets that player's belief to 0 or 1 for everyone.

### 6.2 Claims

If `claims_seer >= 0.80`, the claim is recorded. Two living seer claims means at least one liar; villagers split suspicion between them, weighted by `specificity` of each claim's supporting statements. If `reveals_night_result >= 0.80` and `target` is a name, the claimed result is recorded against the claimant and used only if that claimant is the trusted seer.

### 6.3 Personality

Seven fixed personalities, one per villager, each a weight vector plus a name and a line-library voice:

| name | traits |
| --- | --- |
| Mara | high `w.evidence`, low `w.bare_accusation`: only moves on facts |
| Tomas | high `w.bandwagon` sensitivity, votes with the crowd |
| Bel | high `skepticism`, high `w.deflect`: punishes evasions |
| Ines | high `w.defence`: believes defenders |
| Kip | high `grudge` factor: pushes back on whoever accuses him |
| Rook | high `w.contradiction`, keeps a ledger of claims |
| Sol | low everything, moves late, decides votes |

Personalities are what make the table feel like a room rather than seven copies of one judge.

## 7. Policy: what a villager does on its turn

### 7.1 Action selection

```
suspect = argmax belief among living
if I am accused this day and belief_in_me_by_others is rising:   intent = defend
else if belief[suspect] >= 0.60 and specificity of my evidence >= 1: intent = accuse (with evidence)
else if belief[suspect] >= 0.60:                                     intent = accuse (bare)
else if someone claimed seer and I am the seer:                       intent = claim (counter-claim)
else if I am the seer and today is the day to reveal (rule 7.4):      intent = claim
else if a question was asked of me:                                   intent = answer
else:                                                                 intent = question (ask the least-talked-about player something)
```

Thresholds are constants. `belief_in_me_by_others` is estimated by each villager from the same signals applied to messages about itself.

### 7.2 Line selection

The library holds authored lines keyed by `(intent, tone, personality)` with slots for names and facts, roughly four hundred lines in v1. Code filters candidates by intent, tone (from the villager's emotional state: accused recently means nervous or aggressive by personality), and slots that can be filled. A Choice question, `which line best continues the discussion`, over up to eight candidates picks the final line. That is the only model call on a villager turn, and it can be skipped when there is a single candidate.

### 7.3 Wolves

Wolves run the villager policy on a pretend mind that does not know the roles, so their public behaviour is statistically like a villager's. Two overrides: they never vote for their partner, and they prefer to accuse whoever the room already suspects. Their lines go through the mirror (5.3). At night they kill the player whose stated beliefs are most correct, which the engine knows because it holds every mind.

### 7.4 Seer

The AI seer reveals on the first day after it has found a wolf, or when it is about to be eliminated. Until then it steers accusations toward its findings without claiming.

## 8. The human's view

- **Transcript** on the left, with your input box. Your message is measured the moment you send it.
- **Belief board** on the right: a heatmap, rows are villagers, columns are players, each cell is that villager's belief that the player is a wolf. Cells move within a fraction of a second of any message. Your column is what matters to you.
- **Your standing**: a single meter, the average belief in you across living villagers, with a trend arrow.
- **Why**: click any cell to see the last five updates, each as `signal = probability, threshold, weight, delta`.
- **Vote and night panels** appear in their phases.
- **Replay** after the game: scrub through the whole belief history with the transcript, and a short compiler-style report: how many times you contradicted yourself, which message cost you the most, which villager never trusted you.

Copy is dry and short. No tutorial; the first game's first day has a three-line hint.

## 9. Architecture

- `packages/engine`: pure TypeScript. Rules, roles, minds, belief updates, policy, line library, seeded RNG, replay log. No I/O. Everything here is unit tested with mocked measurements.
- `packages/judge`: builds the state and questions for a message and for candidate lines, maps answers to the engine's measurement shape. Tested with recorded answers.
- `apps/web`: React client. Runs the engine in the browser for v1 (single player), calls the Worker for judgments only.
- `apps/worker`: Cloudflare Worker. `POST /api/judge` (message) and `POST /api/mirror` (candidate lines). Turnstile on game start, a per-IP rate limit, the TypeSafe key as a secret. Same pattern as human-compiler.

Running the engine in the browser means a determined player can read the minds in devtools. Acceptable for a single-player game; the multiplayer version moves the engine into a Durable Object per game and the client sees only public state.

## 10. Budget

Per human message: one request, about 20 questions, under a fifth of a second. Per villager turn: one Choice over candidate lines, or one mirror request for a wolf. A day round with seven AI turns and, say, four human messages is about a dozen requests. A whole game is roughly 60 to 100 requests and a few tens of thousands of tokens, which is on the order of a cent.

Rate limit on the Worker: 60 judgments per minute per IP, which is more than a human can type.

## 11. Determinism and tests

- The engine takes a seed and a stream of `(message, measurements)`; the same inputs always produce the same game. Games are recorded as that stream and replayable.
- Belief update tests: fixture measurements produce exact log-odds deltas per personality; signals below threshold produce zero.
- Policy tests: given a mind, the chosen intent and target are fixed; every intent has at least one line per personality and tone.
- Claim resolver tests: single seer claim, counter-claim, false result, revealed roles.
- Rules tests: role dealing per seed, day and night order, vote ties, win conditions.
- Property tests: beliefs stay within bounds, the normalisation keeps the expected wolf count, a player's revealed role fixes everyone's belief.
- A scripted full game snapshot: a fixed transcript with recorded measurements, asserting the complete belief history and the final report.
- The judge package is tested against recorded answers and against schema: every question id present, every probability within [0, 1].

Nothing that touches the model runs in the test suite.

## 12. Content

The line library is the biggest authoring task. Requirements:

- Every `(intent, personality)` pair has lines for every tone.
- Slots: `{target}`, `{fact}`, `{claim}`, `{count}`. A line is only a candidate when all its slots can be filled from the state.
- Lines are short, in character, and never reference information the speaker could not have.
- Wolves and villagers share the library; the difference is entirely in policy.

A `lint` script checks coverage and slot validity and is part of the test run.

## 13. Risks

- **Signals fire on innocuous talk.** Thresholds and weights need tuning on recorded games. Ship a tuning harness: replay recorded games with new weights and print how often villagers voted out a real wolf.
- **Villagers feel identical.** Personalities and the line voices carry this; if they are not distinct in playtests, the weights are too similar.
- **The human learns to say nothing.** Silence should cost trust slowly (a per-day decay toward suspicion for the quietest player), and villagers ask direct questions of the quiet.
- **Injection.** The model only judges; the `addresses_system` signal marks attempts to talk to the game and villagers respond with a stock line. No text is ever generated, so there is nothing to hijack.

## 14. Milestones

1. Engine and a terminal game with a mocked judge: roles, days, nights, beliefs, policy, votes, win. Tests green.
2. Judge package against the real model; a tuning harness with ten recorded games.
3. Web client with transcript, belief board, standing meter, votes, night.
4. Wolf mirror and the seer policy.
5. Replay and the end-of-game report.
6. Turnstile, rate limit, deploy.
7. Later: Durable Object multiplayer, more roles (doctor, hunter), spectator mode.

## 15. Open questions

- Should the human see the belief board during the game, or only their own standing? Full visibility is more fun to watch; hidden is a better game. Default: full board, with a "hard" option that hides everything but your standing.
- How many speaking turns per day keeps the game under fifteen minutes? Start with two per living player and measure.
- Whether wolves should get the mirror from day one, or only after the first elimination, so early days are easier.
