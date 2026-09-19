# werewolf

Werewolf against seven AI villagers whose suspicions are calibrated probabilities from TypeSafe Jev. No text generation anywhere. Read these before doing anything:

1. `docs/SPEC.md` - the game, the judgments, the belief model, the policy, the architecture.
2. `docs/DECISIONS.md` - what was decided and why. Do not reopen a decision without saying so.
3. `docs/PLAN.md` - milestones and what to do next.

## The thesis

The probabilities are the game mechanic. Every message is measured once (about twenty typed questions in one request), each villager updates a belief over who the wolves are, and those beliefs drive speech, accusations and votes. The player watches trust rise or collapse within a fraction of a second of what they type. If a feature does not make the numbers more visible, more honest, or more consequential, it is probably not worth building.

## How to work here

- Use the `typesafe-ai` skill for anything touching the model. Read the live docs at https://docs.typesafe.ai/llms.txt rather than relying on memory. Design questions per SPEC section 5: one narrow judgment per question, named state fields, backticked paths, a no-match option where nothing may fit, batch every independent question into one request.
- Code owns every threshold, weight and decision. The model only measures. Thresholds are the confidence gate; they live in one place and are tested.
- The engine is pure and deterministic given a seed and a stream of `(message, measurements)`. No model calls in the test suite; the judge is mocked with recorded or fixture answers.
- Villagers speak from an authored line library; a Choice picks the line. Never generate dialogue. A missing line is a content gap to author, not a reason to generate.
- Explain everything: every belief change carries the signal, probability, threshold, weight and delta, in the style of human-compiler's `= note:` lines.

## Conventions borrowed from the sibling project

`C:\Users\asfar\repo\human-compiler` (public: https://github.com/asfarsadewa/human-compiler) is the reference for stack and style. Reuse rather than reinvent:

- Cloudflare Worker with static assets via `@cloudflare/vite-plugin`, React 19, Vite, TypeScript, Vitest. `wrangler.jsonc` with `nodejs_compat`, observability, a rate limit binding, `run_worker_first: ["/api/*"]`.
- Turnstile in front of any endpoint that costs money (`src/worker/turnstile.ts` there is the canonical verifier: fail closed, check action and hostname, accept Cloudflare testing keys via `metadata.result_with_testing_key`). Dev uses the test keys in `.dev.vars`.
- Secrets via `wrangler secret put` from stdin, never in files or chat. `.dev.vars` is gitignored; `.dev.vars.example` is committed.
- Design language: cool grey-white paper `#f3f4f1`, white sheets, ink `#1b1d1a`, semantic colours only for meaning (error red, warning amber, note blue, help green), IBM Plex Mono for everything, Xanh Mono for the wordmark only, 21px line rhythm, no rounded corners, no gradients. Controls in a row share one explicit box height. Dry copy, sentence case, no marketing language, as few words as possible.
- Footer links: source, MIT, and the X mark linking to https://x.com/ashthepeasant.
- Deploy with `npm run deploy` under the wrangler OAuth login; commit and push to GitHub after a verified deploy.

## Environment notes

- `TYPESAFE_API_KEY` is set at Windows user scope. New shells inherit it.
- `CLOUDFLARE_API_TOKEN` (Account.Turnstile:Edit only) is set at Windows user scope but shells started earlier do not see it; read it with `[Environment]::GetEnvironmentVariable('CLOUDFLARE_API_TOKEN','User')` and pass it only to `wrangler turnstile widget ...` together with `CLOUDFLARE_ACCOUNT_ID`, which is also set at Windows user scope. Do not write the id into any committed file. Deploys and `secret put` must run without that token in the environment; they use the OAuth login, which has no Turnstile scope.
- The zone `asfarlab.fun` is on this Cloudflare account; custom domains are declared in `wrangler.jsonc` `routes` with `custom_domain: true`.
- Vite dev server quirk: after it restarts itself, served modules can reference stale dependency hashes and the page hangs blank. Stop and restart `npm run dev`. Pin React in `optimizeDeps.include` and set `holdUntilCrawlEnd: false` as in the sibling project.
- Shell heredocs in this environment truncate above roughly 10 KB and mangle backslash escapes; write large or escape-heavy files with the Write tool.

## What the user cares about

- Polished, well engineered, deterministic. Misaligned controls and unexplained numbers get called out.
- Fun first: the belief board must be readable at a glance, and every sentence must visibly matter.
- Keep the repo fit for a public GitHub remote from the first commit.
