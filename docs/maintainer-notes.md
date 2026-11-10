# Maintainer notes

Project-owner decisions, deployment history, and follow-up work belong here rather
than in the player/developer introduction.

## Current handoff

- Daily Draw now uses repeated hands against a computer, three strikes and escalating
  wild jokers. Run `npm run db:setup` again before deploying to create
  `jacklet_draw_sessions`. The Draw-only generation change starts fresh Draw runs
  today while preserving Blackjack and shared identities. Old single-hand results
  are retained but ignored. New tests and browser validation are pending owner checks.
- Daily Draw has been added alongside Blackjack, with a game picker at `/`.
  Before deploying this addition, run `npm run db:setup` against the configured
  database, then tests, typecheck, and build. No reset is required. Apply the
  updated schema to the separate test database before `npm run test:db` too.
  Draw tests and browser checks have not yet been run by the assistant.
- The owner reported successful seed and rating generation, schedule checks, tests,
  typechecking, and production build for the statistics/reliability update.
- The update has been pushed and the owner reports the deployed site is running.
- The catalog was extended to 180 dates, September 9, 2026 through March 7, 2027.
  Extend it before March 8; the automated check warns at less than 30 days of coverage.
- The optional separate-database integration test and detailed production recovery
  checks have not been explicitly confirmed.
- The owner prefers to run npm and terminal validation commands personally.
- Database variables were configured for Vercel Production only; database-free
  previews intentionally use browser progress. Check deployment settings before
  relying on this historical configuration.

## Prototype policy

History is disposable during development. Being publicly accessible does not mean
the game has launched. Fresh starts are expected before a domain and launch are
established; do not add migration requirements solely to preserve prototype data.

`PROGRESS_VERSION` in `lib/blackjack/progress.ts` is currently `jacklet-v3`.
Bumping it and redeploying starts a new generation: identities and run tokens are
invalidated, browser history/preferences use fresh keys, and old database results
are excluded. Ordinary deployments do not reset progress. Decks and rules do not
change automatically when the generation changes.

Old rows remain until deliberately removed. For physical cleanup, inspect rows
by environment and generation, then delete only retired generations in the intended
environment. Do not truncate an active generation while browsers retain its local
history. Schema setup never deletes data. Retire obsolete deployments after a reset.

## Deployment checks

- Deal, refresh, and confirm recovery; finish and verify the result stays locked.
- Try competing actions from two tabs and confirm only one advances.
- Check the results dialog and `/api/stats` in the same browser; a different browser
  should have a separate history.
- Confirm practice does not write official records.
- Test recovery after a dropped response and after a database outage.
- Check narrow phone layouts, keyboard/modal interaction, sharing, sound preferences,
  reduced motion, and the Eastern midnight rollover.
- Check `/opengraph-image` and a shared public link after a deployment or domain change.

## Experiments and direction

The [music archive](archive/music-experiment/README.md) preserves the Strudel
composition, WAV export, draft controls, licensing research, and unfinished checks.
Music is paused; existing game sound effects remain active.

Jacklet now contains Blackjack and solo Daily Draw. Future modes may have different
schedules or free play against a computer. Defer further generalization until the
next mode or host-app integration makes its requirements concrete.
See [the roadmap](../ROADMAP.md).

Retention remains a playtesting priority. The [historical three-strike study](../THREE_STRIKES_ANALYSIS.md)
compares simulated strategies, not human outcomes. Observe whether recovering from
strikes and spending points on jokers feels rewarding before adding more mechanics.
