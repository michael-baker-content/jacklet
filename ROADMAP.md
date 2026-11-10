# Jacklet roadmap

## Product direction

Jacklet hosts Daily Blackjack and Daily Draw. Each game
defines its own rules, modes, progress and statistics. Challenges may be daily,
weekly or use another schedule; free play against a computer may have no schedule.
Share player identity, preferences, navigation and card assets where useful.
The home page selects a game; each has a dedicated route and independent results.
Defer generalized game infrastructure until another mode needs it.
Prototype history remains disposable.

## Daily Draw

- Five-card draw against a fixed-strategy computer at `/games/draw`; one draw per hand.
- Shared daily deck, three persistent strikes, +100 per win, −100 per loss, +1 per revealed ordinary card.
- Player-only wild jokers replace chosen cards, costing 50 more each purchase across the run.
- Ten cards required for another round; insufficient replacements retain original cards and settle normally.
- Separate Neon action histories and revision checks; shared anonymous identity and sound preference.
- Mobile card selection, rules, hand rankings, saved completion and spoiler-free sharing.
- Add historical Draw statistics only when useful; Blackjack statistics remain separate.

## Daily Blackjack

- Daily and practice now share three persistent strikes, −100 points per loss,
  and ratings calculated over all legal joker choices. Final sounds play automatically
  for 1–2 versus 3–5 stars. The separate ratings file covers all 180 scheduled dates.

- One 52-card deck per Eastern calendar day; one run in the current browser.
- Hit and stand; no betting. Dealer stands on soft 17; blackjack outranks other 21s.
- Score is 100 points per win plus revealed cards, minus 100 per strike and joker costs. Jokers cost 50, 100, 150 points and so on across each run; their value adjusts from 1–11. Detailed results show values before 🤡.
- Progress version jacklet-v3 resets previous runs, anonymous identities, and preferences. Optional rising/falling sound cues and public link previews are included.
- The last card counts and the final hand is settled normally, even below dealer 17. Final wins count. Fewer than four cards after a settled hand ends the run with those cards undealt and uncounted.
- Current ratings include three strikes and jokers. Scores below 50 earn one star; two stars start at 50, and three/four-star cutoffs divide the remaining interval up to the fixed five-star cutoff. The original no-joker deck curation is separate; full clears remain optional.
- Saved decisions, signed server verification, mobile card table, daily participation statistics, spoiler-free sharing, and detailed result copying with player hands.
- Neon stores anonymous official runs with atomic updates and recovery within the same browser identity. A private stats endpoint is ready. Development and production data are separate; disposable prototype generations support fresh starts. Local setup and validation are complete; verify production after deployment.

## Next priorities

- Playtest the provisional 26-card best-case cutoff. A long optimal path does not imply a long ordinary run with hidden information. Evaluate ordinary strategies and early unavoidable-loss branches to improve curation.
- Validate the new database-backed results modal and real PostgreSQL integration test, then return focus to gameplay and retention experiments.
- Tune star bands after observing play; current ratings already include jokers and three strikes.
- Extend the schedule before March 8, 2027. The current catalog ends March 7.
- Run the new schedule check after generation; CI also checks 30-day coverage weekly.
- Keep integration lightweight: reuse the host app's identity and navigation rather than adding standalone accounts. See docs/integration.md.

## Later

- Splitting and other blackjack actions, with an explicit no-betting purpose. Decide how split-hand losses and shared-deck consumption affect survival before adding them. Reanalyze every future seed under a new rules version.
- Accounts and synchronized progress.
- Past puzzles, separately labeled from the official daily run.
- Additional artwork/table styles using licensed assets; no image generation needed.
