# Plan

## Status, 2026-09-18

Milestones 1 to 6 are built in one pass; see DECISIONS.md D11 to D18 for what changed from the spec on the way. What remains is playtesting and tuning.

| # | Milestone | State |
| --- | --- | --- |
| 1 | Engine plus a mocked judge | Done. `src/engine`, 96 tests, deterministic replay |
| 2 | Judge against the real model | Done. `src/judge/questions.ts`; no recorded corpus yet (see below) |
| 3 | Web client | Done. Transcript, belief board, standing meter, why-trace, vote and night panels, resume |
| 4 | Wolf mirror and seer policy | Done. Mirror runs in the same request as the line pick; the seer claims after a find or when cornered |
| 5 | Replay and report | Done. Scrubber over the belief history, end-of-game report, copyable recording |
| 6 | Production | Done. Turnstile once per game, session tokens, rate limits; live at https://werewolf.asfarlab.fun, source at https://github.com/asfarsadewa/werewolf |
| 7 | Later | Durable Object multiplayer, doctor and hunter roles, spectator mode |

Beyond the spec: sprites, voice acting, sound effects and music, all pre-rendered (D11, D12).

## Next

1. **Tuning harness.** Record ten real games (the client can copy a recording), replay them under `test/` with new weights and thresholds, and report how often the village voted out a wolf and how often the human's standing moved for the wrong reason. Thresholds live in `src/engine/personality.ts`; a recording is `{ seed, humanRole, actions }`.
2. **Playtests for distinctness.** If two villagers feel alike after five games, their weights are too close. Candidates: Ines and Sol both sit calm; Tomas's herd pull may need to be larger to read.
3. **Hard mode** is built but unmeasured: does hiding the board make a better game, or only a quieter one?
4. **Content gaps.** When the policy falls back to chatter because no line fit, log it; each fallback is a line to author. The lint keeps coverage; it cannot judge fit.
5. **Wolf mirror from day one** (open item from the spec). Currently on from the first turn.

## Test plan

- Belief updates: fixture measurements produce exact deltas per personality; below-threshold signals produce zero. (`test/belief.test.ts`)
- Policy: intent and target are fixed given a mind; event lines are single and unmeasured; questions never stack on one player. (`test/policy.test.ts`)
- Claims: lone claim, counter-claim, false result exposed by a reveal. (`test/belief.test.ts`)
- Rules: dealing per seed, phase order, vote ties, night roles, win conditions, replay identity. (`test/rules.test.ts`)
- Judge: every question id present, answers map to the measurement shape, mirror picks the least suspicious line. (`test/judge.test.ts`)
- Content lint: coverage per intent and tone, vocative slot rule, needs, text rules. (`test/lines.test.ts`)
- Worker: session tokens, request validation, Turnstile verifier. (`test/worker.test.ts`)

Nothing that touches the model runs in the test suite.

## Budget

- One judgment per message, about 21 questions, a few hundred milliseconds observed.
- One pick per villager turn (plus the mirror for wolves), about 2 to 8 candidates.
- A game is 60 to 120 requests, on the order of a cent of Jev.
- Rate limits: 90 judgments per minute per session and per IP; 10 new games per minute per IP.
