# Jacklet

Card games with a reason to come back. Choose **Daily Blackjack** for a three-strike
survival run, or **Daily Draw** for a five-card poker challenge. Both offer a shared
daily deal and a fresh start at midnight Eastern.

The home page is the game picker. Blackjack lives at `/games/blackjack`, and
Daily Draw lives at `/games/draw`. Each game has a separate daily attempt.

## Play Daily Draw

Play a run of five-card draw against a computer opponent. Each round deals five
cards to each player, alternating between you and the opponent. Its cards stay
face down until showdown. Tap your cards to **Keep** or **Replace**, then draw once.
You draw first, followed by the opponent; replacements fill left to right.

Win a hand for **100 points**. Lose a hand for **−100 points and a strike**.
Three strikes end the run; wins do not remove strikes. Ties award neither a win
nor a strike. Each ordinary card revealed adds 1 point, including losing cards and
the opponent's final hand. Its hidden discarded cards do not count. Scores can be negative.

During selection, **Play joker** lets you buy a wildcard in place of a chosen card.
Prices rise across the run: **50, 100, 150 points…** Multiple purchases are allowed
when affordable and a deck card remains. Jokers consume no deck cards and earn no
card points. They stay held through the draw and resolve to your best standard
poker hand; suits have equal rank, aces can be high or low in a straight, and there
is no five of a kind. The opponent cannot buy jokers.

Both players share one deck with no reshuffling. Ten remaining cards are needed
to start another round. If replacements run out, unfilled positions retain their
original cards; both hands are then scored normally.

The opponent uses only its own cards: keep made straights or better, keep groups
of matching ranks, otherwise pursue a four-card flush or straight, or keep the two
highest cards. Its strategy is fixed and does not inspect your hand or future cards.

Everyone receives the same daily shuffled deck, but choices change how it is used.
Refresh to recover your run. Keep/replace selections are remembered in the current
tab. Copy or share a completed run's score, wins and strikes without revealing cards.
Daily Draw has its own results and does not use Blackjack's stars or statistics.

## Play Daily Blackjack

Everyone starts with the same shuffled deck. Your decisions determine how it plays
out: hit, stand, or spend points on a joker to improve your hand. Keep playing until
your third loss or the end of the deck.

- **Win a hand:** earn 100 points.
- **Reveal a card:** earn 1 point, including dealer cards and cards in losing hands.
- **Lose a hand:** receive a strike and lose 100 points. Wins do not remove strikes.
- **Play a joker:** spend 50 points for the first, 100 for the second, then 150,
  and so on throughout the run. Its value adjusts from 1 to 11 to give your hand
  the highest total it can without busting. Jokers do not use deck cards or earn
  card points. You need enough points and at least one deck card remaining.

The dealer stands on all 17s, including soft 17. Naturals beat other 21s; ties
let play continue. Reaching 21 automatically stands. There are no bets, splits,
doubles, insurance, or surrender.

If the final card is drawn, that hand is settled immediately, even if the dealer
has less than 17. A new hand requires four cards; any smaller remainder stays
undealt. Scores can be negative.

### Your daily result

There is one daily attempt per browser identity. Progress saves so you can return
to an unfinished run. The challenge resets at **midnight Eastern Time**, including
daylight saving changes. Starting a hand counts toward your participation streak.

Results earn one to five stars based on that day's score bands. Scores below 50
earn one star. Stars describe your score against the challenge's attainable range,
not your ranking among other players.

Copy a spoiler-free result or use your device's sharing options. **Copy detailed
result** includes your cards from each hand, with resolved joker values such as
`6🤡`; it does not include dealer hands. Your results panel shows recent completed
runs, best and average scores, and participation statistics.

The interface supports phones and desktop browsers, reduced-motion preferences,
and optional sound effects. Sound starts off and can be enabled in the header.
Progress is tied to this browser rather than an account; clearing the identity
cookie or switching browsers starts a separate history.

## Develop locally

Jacklet uses Next.js App Router, React, TypeScript, and Neon PostgreSQL. Game rules
are deterministic JavaScript modules; deck generation and rating analysis run
offline rather than during play.

Use Node.js 22 (the CI version) and npm:

```sh
npm ci
npm run dev
```

Open [localhost:3000](http://localhost:3000). Local development works without a
database, using signed progress and browser storage. To configure persistence,
copy `.env.example` to `.env.local` and supply the environment variables below.
If card assets are missing, run `npm run cards:fetch` to download the SVG cards and
their license into `public/cards`.

### Environment and database

| Variable | Purpose |
| --- | --- |
| `PUZZLE_SECRET` | Signs histories and identities, and determines Daily Draw's shuffled deck. Required in production; keep it stable across deployments. |
| `DATABASE_URL` | Direct Neon connection, preferred by schema setup. |
| `DATABASE_URL_POOLED` | Pooled Neon connection, preferred at runtime. If both URLs are set, use the same database/branch. |
| `SITE_URL` | Public HTTPS origin for link previews. Defaults to the available Vercel deployment URL. |

Keep database URLs and the signing secret server-only; never prefix them with
`NEXT_PUBLIC_`. With a database configured, initialize its schema:

```sh
npm run db:setup
```

Setup creates the table and index without deleting data. It does not migrate
existing column definitions. Deploy as a Next.js application with a server
runtime, not a static export. Production requires database configuration;
database-free Vercel previews use browser storage. A configured database failure
does not silently fall back to browser-only saves.

Existing installations adding Daily Draw must also run `npm run db:setup` to
create `jacklet_draw_sessions`. This adds a table without resetting Blackjack history.
The three-strike Draw rules use a fresh Draw generation; old single-hand results
remain in the retired `jacklet_draw_runs` table and do not lock the new daily run.

### Practice and testing

In development, [/practice](http://localhost:3000/practice) lets you select a
scheduled date and restart it freely. It uses the same rules and ratings without
recording official results. Practice is unavailable outside development mode.

```sh
npm test
npm run typecheck
npm run build
npm run schedule:check
```

Tests cover blackjack rules, jokers, scoring, ratings, signed progress, recovery,
concurrent requests, date boundaries, and card layouts. The default persistence
tests use an in-memory store. For actual PostgreSQL concurrency and recovery
checks, see the [database integration test instructions](docs/integration.md#optional-real-postgresql-check).

GitHub Actions runs tests, typechecking, and builds on pushes and pull requests.
A separate schedule check verifies that decks and ratings cover the next 30 days,
and also runs weekly.

## Project structure

| Location | Responsibility |
| --- | --- |
| `app/page.tsx` | Game picker |
| `app/blackjack-game.tsx`, `app/card-table.tsx` | Blackjack interface and card animations |
| `app/games/draw/`, `lib/draw/` | Daily Draw interface, poker evaluation, private shuffle, and persistence |
| `app/player-stats.tsx` | Personal statistics and recent results |
| `app/api/` | Daily play, personal statistics, and local practice endpoints |
| `lib/blackjack/engine.mjs`, `practice.mjs` | Deterministic game rules and three-strike play |
| `lib/blackjack/server.ts` | Signed progress and visible-card responses |
| `lib/blackjack/persistence.ts`, `database.ts` | Authoritative recovery and atomic database updates |
| `lib/blackjack/identity.ts`, `statistics.ts` | Anonymous identity and statistics contract |
| `lib/blackjack/catalog.json`, `ratings.json` | Scheduled decks and precomputed ratings |
| `db/schema.sql` | PostgreSQL schema |
| `scripts/`, `tests/` | Asset downloads, analysis, schedule generation, and tests |

The server validates actions and returns only visible cards. Neon stores anonymous
run records; revision checks prevent duplicate or stale requests from advancing
a run twice. The personal statistics API uses the current browser's signed cookie
and does not accept a player ID from the client.

Daily Draw uses the shared anonymous identity but a separate table with one run
per player, environment, generation, and date. Signed action histories and atomic
revision checks prevent repeated purchases or draws. Conflicting submissions return
the saved state. Its server-side shuffle is derived from the date and signing secret;
there is no finite deck schedule to extend. Changing that secret changes Daily Draw
decks, so keep it stable. Development and database-free previews recover completed
draws from a signed cookie; strict multi-tab attempt enforcement requires Neon.

Decks and solutions are server-only imports, but they are present in this repository.
Publishing the repository would reveal future challenges. Keep that in mind when
distributing or adapting the project.

For extending the schedule, testing persistence, or integrating Jacklet into a host
application, see [developer integration notes](docs/integration.md).
The [roadmap](ROADMAP.md) describes planned games and development priorities.

## Card artwork

Cards come from [Letele's playing cards](https://github.com/letele/playing-cards),
based on [Adrian Kennard's designs](https://www.me.uk/cards/), distributed under
CC0 1.0. Artwork is served locally, with text fallbacks if images cannot load.
