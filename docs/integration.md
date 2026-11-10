# Keeping Jacklet portable

Jacklet is still a disposable prototype. This work adds no account system,
analytics vendor, new database tables, or music runtime. Existing generation resets
remain available; no new migration or history preservation requirement is imposed.

## Boundaries for a host application

- `lib/blackjack/engine.mjs` and `practice.mjs` contain deterministic game rules.
- `persistence.ts` coordinates actions through the `RunStore` interface. Keep its
  atomic revision checks when adapting storage.
- `identity.ts` currently uses an anonymous signed cookie. A host application can
  replace that boundary with its authenticated identity. Decide whether to map IDs
  to UUIDs or change the schema; do not trust player IDs sent by the browser.
- `statistics.ts` defines the personal-result contract and participation streak.
  `database.ts` supplies the data. `app/player-stats.tsx` renders it independently
  of the card table. The host can replace this component or the API route.
- Environment and generation separate prototype records. A fresh generation is
  acceptable when integrating. There is no need to migrate anonymous histories yet.
- Public assets and the current API paths are root-relative. A future subpath embed
  needs an explicit routing/asset-path pass, as do global styles and modal layout.
  This update does not claim to make Jacklet an embeddable package.

## Validation before the next deployment

The owner has completed the 90-day extension and reported successful ratings,
schedule checks, tests, typechecking, build, and a working site. The catalog now
covers 180 dates through March 7, 2027. The optional database test below remains
unconfirmed. For a future extension, append days and compute their ratings:

```sh
npm run seeds:generate -- 90
npm run ratings:generate
npm run schedule:check
npm test
npm run typecheck
npm run build
```

Generation remains append-only. Review and commit both catalog and ratings files
together. The scheduled GitHub check fails when any of the next 30 Eastern dates
lacks a deck or rating. GitHub must have Actions enabled; failures appear in Actions
and follow the repository owner's notification settings. No external alert service
is installed. The workflow includes push/PR checks and a weekly schedule check.

## Optional real PostgreSQL check

Use a separate Neon test branch/database, apply `db/schema.sql` there, and create
the ignored `.env.test.local` containing only `TEST_DATABASE_URL=<test connection>`.
Run `npm run test:db`. The test ignores normal app connection variables, creates a
unique environment and synthetic player, and deletes only that player's test rows
in a finally block. It tests actual SQL concurrency, lost-response recovery,
completed-run lockout, result statistics, and player isolation. It is deliberately
excluded from ordinary `npm test` and CI; neither has database credentials.

Also manually check mobile results, keyboard/modal interaction, preview fallback,
refresh after clearing localStorage while keeping the identity cookie, and recovery
after a database outage. No database integration test or production check was run
as part of this source change.

## Lightweight playtesting

Before another mechanic, ask a few players to play several days and describe whether
jokers and recovering from strikes feel rewarding. Compare completed scores, stars,
strikes and joker purchases already stored in `jacklet_runs`, scoped to the current
environment and generation. Returning anonymous IDs can suggest repeat play, but
cookie clearing and different devices prevent interpreting them as unique people.
Started-but-unfinished runs do not prove abandonment. No tracking vendor is needed
for this small prototype, and the personal statistics endpoint must never expose
other players' records.
