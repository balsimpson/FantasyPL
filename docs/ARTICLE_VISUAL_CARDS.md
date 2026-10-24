# Article visual cards

This guide owns the article visual catalog and the rules for choosing cards in generated and edited articles. Keep it aligned with the editor, generated article schema, saved evidence, validators, and public renderer.

## Current cards

| Card | Use it for | Evidence and limits |
| --- | --- | --- |
| Player card | Explain one player's role in a decision. | Uses a saved player snapshot and can refresh the displayed player stats. The saved season and article context stay fixed. It already includes price, form, points, minutes, ownership, goal contributions, transfers, and a short transfer bar. Do not add a second stats card for the same player without a clear reason. |
| Fixture run | Explain one player's next three gameweeks. | Uses saved fixture-by-gameweek data. Show blank and double gameweeks, home/away, kickoff when known, and FPL difficulty. Difficulty is an ordinal rating, not a prediction. |

## Additional cards

| Card | Use it for | Required evidence and rules |
| --- | --- | --- |
| Player comparison (`comparisonCard`) | Help choose between two or three named players. | Uses one capture time and matching season/gameweek stats. Shows the same measures for each player: price, points, form, minutes, and ownership. It does not declare a winner. |
| Transfer watch (`transferWatch`) | Show players moving in during the current gameweek. | Uses captured `transfersIn`, ranked by the current transfer template. Label the gameweek and capture time. These values are gameweek totals, not 24-hour totals. Net transfers are not shown. |
| Budget shortlist (`budgetShortlist`) | Show candidates for a stated budget or position question. | Uses the ranked evidence set, with price, position, form, and points shown. Generation applies its minutes and topic filters. This is a shortlist, not a prediction. |
| Team fixture table (`teamFixtureTable`) | Compare upcoming schedules across clubs. | Uses official fixtures grouped by gameweek. Preserves blanks and doubles. Shows difficulty values. Difficulty is not a scoring or clean-sheet probability. |
| Gameweek recap | Summarize completed gameweek returns. | Requires saved event-specific points and player identity for that completed gameweek. Season points are not a substitute. Do not generate this card until the evidence builder captures a completed game's results and the snapshot stores its gameweek and capture time. |

## Selection rules for article generation

- Add a card only when it supports the section beside it. Avoid repeating the same numbers in prose.
- Use a comparison card for a direct player choice. Use a shortlist for a filtered set. Use transfer watch for transfer movement. Use a team fixture table for club schedules. Use a fixture run for one player's schedule.
- Keep rankings and calculations in code. The writing model can explain the result, but it cannot invent values, thresholds, periods, or sources.
- Keep one source snapshot for every card. Store season, gameweek or period, capture time, identifiers, and the values used. A later live refresh must not silently rewrite the historical argument.
- If evidence is missing, omit that measure or the whole card. Do not fill gaps from memory.
- Prefer no more than one card in a section. Keep the article's current limit of two to four visuals unless the article format requires fewer.

## Implementation status

As of 24 October 2026, the editor and renderer support `playerCard`, `fixtureRun`, `comparisonCard`, `transferWatch`, `budgetShortlist`, and `teamFixtureTable`. The article generator adds the matching structured card for comparison, transfer, budget, and fixture article templates. `gameweekRecap` is not supported. The current generation snapshot has season totals and upcoming fixtures, but no completed-gameweek player points. Do not use season totals as a substitute. `npm run build` and `git diff --check` passed locally. The project-wide TypeScript check still reports the Vue node-view import diagnostic in `utils/article-editor-extensions.ts` and unrelated existing project errors. Browser verification remains open. No deployment or article generation was performed.

When adding a card, update this guide, `shared/article-visuals.ts`, article validation, the editor extension and node view, article generation instructions/schema, the public renderer, and publication capture-time extraction. Add focused non-destructive checks for valid, invalid, missing, and stale evidence. Update `BLOG_GROWTH_PLAN.md` with implementation and verification status.
