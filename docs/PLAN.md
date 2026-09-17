# Plan

## Next session: start here

1. **Design pass on the belief board before any engine code.** Produce the token system (reuse the human-compiler palette and type), an ASCII wireframe of the game screen (transcript left, board right, standing meter, vote and night panels), and decide the heatmap encoding: cell colour scale, how a cell shows its trend, how a click opens the explanation trace. The board's readability decides whether the game is fun; it is the one aesthetic risk worth taking.
2. **Decide the repo layout** (see DECISIONS.md, open item). Recommendation: single package, same shape as human-compiler.
3. **Scaffold** with the same toolchain as human-compiler: Vite, `@cloudflare/vite-plugin`, React 19, TypeScript project references (app, worker, node), Vitest, `wrangler.jsonc`, `.dev.vars.example`, MIT licence, README, `.gitignore`. Pin React in `optimizeDeps.include` and set `holdUntilCrawlEnd: false`.
4. **Milestone 1, engine.** Roles and dealing from a seed, day and night state machine, votes, win conditions, `Mind`, belief updates with thresholds and personality weights, the claim resolver, the policy, and a terminal game driven by a mocked judge. Tests green before the model is touched.

## Milestones

| # | Milestone | Done when |
| --- | --- | --- |
| 1 | Engine plus terminal game with a mocked judge | A scripted game replays deterministically; rules, beliefs, policy and claims are unit tested |
| 2 | Judge package against the real model | Recorded answers for ten games; a tuning harness replays them with new weights and reports wolf-catch rate |
| 3 | Web client | Transcript, belief board, standing meter, vote and night panels, live updates |
| 4 | Wolf mirror and seer policy | AI wolves pick least-suspicious lines; the seer reveals by rule 7.4 |
| 5 | Replay and report | Scrubbable belief history aligned with the transcript; end-of-game compiler-style report |
| 6 | Production | Turnstile on game start, rate limit, deploy to a custom domain on asfarlab.fun, public repo |
| 7 | Later | Durable Object multiplayer, doctor and hunter roles, spectator mode |

## Test plan (from the spec)

- Belief updates: fixture measurements produce exact deltas per personality; below-threshold signals produce zero.
- Policy: given a mind, intent and target are fixed; every intent has at least one line per personality and tone.
- Claims: single claim, counter-claim, false result, revealed roles.
- Rules: dealing per seed, phase order, vote ties, win conditions.
- Properties: beliefs bounded, normalisation keeps the expected wolf count, revealed roles fix beliefs for everyone.
- Full game snapshot from a recorded stream.
- Judge: every question id present in a built request; recorded answers map to the measurement shape; probabilities within [0, 1].
- Content lint: every `(intent, personality, tone)` has a line; every slot in a line can be filled from state.

## Budget targets

- Under a fifth of a second from sending a message to the board moving.
- About a cent per game.
- Sixty judgments per minute per IP is the rate limit; a human cannot exceed it by typing.
