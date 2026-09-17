# Decisions

A log of choices made and why. Add to it; do not rewrite history.

## 2026-09-17

**D1. No text generation.** Villagers speak from an authored line library keyed by intent, tone and personality. A Choice over up to eight candidate lines picks the one that best continues the discussion. Why: the writing stays in character, a game costs about a cent, tests stay deterministic, and prompt injection has nothing to hijack because the model only measures.

**D2. Everyone suspects everyone.** Each villager holds a belief over every other living player, not just over the human. Two of the seven are wolves who run the same villager policy on a pretend mind that does not know the roles, so their public behaviour is statistically villager-like. Why: the human is steering a whole table, and the table has its own politics.

**D3. The wolf's mirror.** Before an AI wolf speaks, its candidate lines are judged with the same questions used on the human (`sounds_rehearsed`, `contradicts_own_claim`, `draws_suspicion_to_speaker`) and it picks the least suspicious. Why: it makes AI wolves hard to catch using the game's own primitive, and it is a good demonstration of per-item questions over an array in state.

**D4. Calibration is the mechanic.** Signals only count when their probability crosses a threshold; weights are personality, thresholds are engine constants; both are tested. Why: this is the whole point of using a System One model rather than a chat model. If the numbers are not honest the game is not fun.

**D5. One request per message.** Roughly twenty questions (fifteen Nouls, three Choices, two Scores) sent together, with the engine consuming only the answers that apply. Why: TypeSafe's speculative fan-out; latency stays well under a fifth of a second regardless of how many signals we add.

**D6. The belief board is the centrepiece of the UI.** A live heatmap (villagers by players), a single standing meter for the human, a click-to-explain trace per cell, and a post-game timeline aligned with the transcript. Default: full board visible; a hard mode hides everything but the human's standing. Why: without the board the game is chat; with it every sentence has a visible consequence.

**D7. v1 is single player with the engine in the browser.** The Worker only judges. Why: no session state to host, ships sooner. Known cost: a determined player can read the minds in devtools. Multiplayer later moves the engine into a Durable Object per game.

**D8. Same stack and conventions as human-compiler.** Cloudflare Worker plus static assets, React, Vite, Vitest, Turnstile, rate limit binding, `wrangler secret put` from stdin. Why: the patterns are proven and the two projects should feel like siblings.

**D9. Deterministic replay format.** A game is a seed plus an ordered stream of `(message, measurements)`. Replaying the stream reproduces every belief. Why: it is the test fixture format, the tuning-harness input, and the post-game replay all at once.

**D10. Explain every number.** Each belief update records `signal = p, threshold t, weight w, delta d`. Why: the same honesty as human-compiler's notes, and it is how weights get tuned.

## Open

- Board visibility default: full board with a hard mode (D6) is the working default; revisit after playtests.
- Speaking turns per day: start with two per living player; target a game under fifteen minutes.
- Whether wolves get the mirror from day one or only after the first elimination.
- Monorepo layout: `packages/engine`, `packages/judge`, `apps/web`, `apps/worker` as in the spec, or a single package like human-compiler with `src/engine`, `src/judge`, `src/client`, `src/worker`. Recommendation: single package; the engine is the only thing that must stay pure, and a folder boundary plus a lint rule is enough.
