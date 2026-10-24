# FPL Insights design direction

Updated: 24 October 2026.

This document defines the shared FPL Insights visual direction and site content rail, with the homepage as its primary reference. It keeps the current identity and describes how the homepage should feel as one connected decision path. It does not replace [HOMEPAGE_UX_PLAN.md](HOMEPAGE_UX_PLAN.md), which owns section order, behavior, affected files, and implementation status.

## Design goal

Help an FPL manager move from a question to a useful next action without making the homepage feel like a stack of separate dashboards. The page should guide the visitor through one clear sequence: find a player, understand the next deadline, return to saved choices, compare options, check upcoming fixtures, then review the gameweek.

The tone is calm, focused, and data-rich. Use clear labels and visible evidence. Avoid decorative charts, codes, repeated explanations, and UI that makes the visitor guess what a number means.

**Player age, 24 October 2026.** Show a small outlined `26 yrs` badge with the player name, separate from club and position metadata. Use the shared `PlayerAge.vue` component and birthday-aware age calculation. Birth dates come from the official FPL feed; missing, invalid, future, or implausible dates show no badge. Scheduler artwork uses a larger version of the same badge. The shared reference date is serialized per app session to keep server and client ages consistent. Coverage includes homepage portraits and trend rows, recap spotlights, manager pitch/bench/gallery, watchlist, player profile, older player/reel cards, scheduler identities and picker, and Instagram movement layouts. Pure canvas cards use the same utility when a birth date is supplied. Detailed scheduler rules are in `docs/instascheduler/AGENTS.md`. Local production build, targeted age checks, and component compilation passed; browser coverage is recorded in the homepage plan. Hosted and physical-device verification remain open.

## Shared page frame

Every page-level content area, the shared header and footer, and each homepage section use one shared content rail. Headings, descriptions, controls, carousels, card rows, and empty states align to the same left and right edges. Use the `.site-content-rail` class in `assets/css/main.css`; do not let individual pages choose unrelated maximum widths or gutters.

Use this as the layout target:

| Viewport | Outer rail width | Side gutter |
| --- | --- | --- |
| Small mobile | Available width | 16 px |
| Large mobile and tablet | Available width | 24 px |
| Desktop | Up to 1,280 px, centered | 32 px minimum |

The header and footer follow the same rail on every route. Full-bleed page backgrounds and photography may extend to the edges, but page content stays inside its rail. Specialized workspaces may keep a narrower inner canvas for readability or fixed artwork dimensions; their outer shell and controls still align to the shared rail.

## Homepage flow

Use one heading per section and a consistent hierarchy of heading, short context, and action. Keep the page order in [HOMEPAGE_UX_PLAN.md](HOMEPAGE_UX_PLAN.md); visually connect those sections with spacing and alignment rather than adding a separate boxed panel around each one.

1. **Orient and search.** A short introduction and the primary player search form the clear entry point. The search should be the strongest action on the page and visible early on mobile.
2. **Check the deadline and team.** Show the next deadline as compact, useful context. Keep team lookup in a Teams menu immediately before Watchlist in the shared header. The menu lists successfully resolved teams by name and ID for quick return visits. Detailed behavior and checks are recorded in [HOMEPAGE_UX_PLAN.md](HOMEPAGE_UX_PLAN.md#deadline-and-manager-lookup).
3. **Resume saved choices.** Show saved players only when there are saved choices to resume. Use the same player identity and visual language as discovery.
4. **Compare players.** Make the discovery section the main browsing surface. Its filters, ranking context, cards, and “show more” action should read as one tool.
5. **Scan fixture runs.** Group fixtures by gameweek and make home/away, opponent, kickoff, and difficulty easy to scan. Use actual short club names, not abbreviations that look like internal codes.
6. **Review the gameweek.** Put recap values and captain information after the actionable tools. Keep the recap compact and clearly tied to the relevant gameweek.
7. **Show recent analysis only when it exists.** Do not leave an empty editorial section or filler content.

## Spacing and section rhythm

Use a small, repeatable spacing scale. Keep a clear gap between sections and a tighter gap between a section heading and its content. On wide screens, sections should feel distinct through whitespace and alignment. On mobile, reduce the vertical gaps while preserving the same order and left edge.

Use dividers only when they help separate related data, such as values in a compact stat row. Avoid repeated full-width rules, thick accent borders, and nested rounded panels. Use a single surface for a data group instead of a card inside a card.

The shared next-deadline panel follows the owner's selected option 1 (24 October 2026): flat charcoal, a fine border, an outlined lime gameweek badge, and white countdown digits with lime seconds. Fine vertical dividers separate the four time units. The date and timer sit side by side when space allows and stack on mobile. The homepage and watchlist share this component; behavior and verification are recorded in [HOMEPAGE_UX_PLAN.md](HOMEPAGE_UX_PLAN.md#deadline-and-manager-lookup).

Section headings should share the same size, weight, and placement. Descriptions should stay short and use the same muted text treatment. Put section actions in a consistent position so visitors can find them quickly.

## Color and type

Keep the existing dark charcoal background, Public Sans typography, and FPL lime accent. Use lime for primary actions, selected states, and small emphasis. Keep most labels neutral so the page does not become a wall of bright text.

Club and kit colors belong inside player-specific content, where they help identify a club or add character to a portrait card. They should not change the color of the whole page or make unrelated sections compete. Keep text contrast high on all club-colored areas.

Use tabular numerals for points, prices, minutes, and transfer counts so columns scan cleanly. Pair every number with a clear label and relevant period. Keep player and club names readable; do not truncate them into cryptic fragments.

## Cards and data presentation

Use player cards as the homepage's distinctive visual element. Let portrait imagery run edge to edge within the card, then place name, club, price, and the most useful stats in a deliberate hierarchy. Use a restrained gradient only where text needs protection over an image.

24 October 2026: shared yellow/red card shapes show positive season counts on homepage portraits and compact player links, manager pitch/bench/gallery cards, watchlist cards, and the profile portrait. Each badge has a season-specific accessible label and hover title. Portrait overlays stay clear of club badges, names, prices, and captain marks; compact pitch badges stack vertically. Missing, invalid, and zero counts stay hidden. Scoped diff review only; browser and hosted verification remain open.

Keep stat groups aligned and balanced. Put the leading stat first, then supporting values in a compact row with clear labels. Avoid repeating the same metric in multiple places. For fixture summaries, use a short club name plus a visible difficulty treatment; keep the home/away label above the club name when space allows. Do not add redundant logos and names when one is enough to identify the opponent.

Use color to support meaning, not as the only signal. Difficulty should remain understandable from its number and label or a clear color scale. Do not rely on red and green alone to explain the data.

## Responsive behavior

The desktop and mobile layouts use the same reading order and content rail. Desktop may place related controls side by side, but mobile stacks them without moving the primary search below secondary content.

Carousels should make their direction and next item clear. Avoid nested horizontal scrolling where a player card contains a second swipe area that competes with the page carousel. On narrow screens, keep the key fixture information visible without clipping dates or club names. Controls must remain reachable by touch and keyboard.

## States and accessibility

Keep loading, no-results, no-saved-players, no-fixture, and upstream-error states distinct. Do not show unavailable values as zero or present stale data as current. Keep useful recovery actions close to the affected section.

Use visible labels, semantic headings, keyboard focus styles, descriptive accessible names, and adequate contrast. Do not use color or an icon alone to explain difficulty, home/away, selection, or an action. Dates and kickoff times should remain complete and readable.

## Acceptance checks

- All homepage sections, their headings, content, and actions share one centered rail.
- No section appears to have a different arbitrary maximum width.
- A visitor can follow the page from search to deadline, saved choices, discovery, fixtures, and recap without losing the visual hierarchy.
- The primary search remains easy to find on a small mobile screen.
- Cards use edge-to-edge player imagery and balanced, labelled stats.
- Fixture names, dates, kickoff times, home/away labels, and difficulty are understandable without decoding abbreviations.
- Club color supports player identity without taking over the global page palette.
- Mobile layouts preserve alignment and avoid clipped text or competing nested carousels.
- Loading and empty states do not introduce extra decorative panels or invented data.

**Shared rail implementation (23 October 2026).** `.site-content-rail` in `assets/css/main.css` provides an 80rem maximum width with 16px, 24px, and 32px gutters. It is applied to page-level content, the shared navigation and footer, and the scheduler shell rails; narrower inner layouts remain intentional. `npm run build` and `git diff --check` passed. The local production preview returned HTTP 200 for all eight page routes and showed the shared rail on each; the seven default-layout routes also rendered the common navigation and footer. The build ran on Node 22.23.1 although `package.json` declares Node 24.x, with existing Browserslist, font-path, and sourcemap warnings. Browser viewport checks and hosted Vercel behavior remain unverified.

**Manager dashboard and gallery (24 October 2026).** The owner selected the matchday dashboard and squad gallery directions. `/manager/[id]` now has a pitch/gallery switch, a compact manager summary, and three compact league rows with an action to reveal the rest. League rows pair the name with a smaller current rank, a coloured movement arrow, participant count, and a thin rank track. Solid and hollow dots mark current and previous positions when valid; previous rank and percentile remain in the disclosure. A full-width league sort keeps the default order initially and offers Biggest climb, ranked by places gained divided by league size; invalid or unavailable rank data sorts last. Sorting applies before the three-row limit and also to the expanded list. This later compact-row change received a scoped diff review only. Gallery cards show club-coloured portraits, full names, captain/vice-captain marks, price, season points, next-gameweek expected points, form, points per game, ownership, minutes, goals and assists. FPL news stays visible without a Player details disclosure. Expected points use `ep_next` and the `is_next` event from the same official bootstrap snapshot; the manager page no longer requests the separate prediction feed, which was returning GW 38 while the current FPL snapshot was GW 8 with GW 9 next. Missing expected points remain unavailable.

Gallery cards reuse the watchlist fixture run and interactive gameweek chart. Details load only near the viewport, with retry on failure; pitch view makes no player-history requests. Charts fill the content width, with the first/last point labels aligned inward. The chart's `fullWidth` option is enabled for the manager gallery only. Bench and gallery grids use equal-height rows; gallery charts align at the card bottom. State and data loading stay in focused squad/insight components and `useManagerPlayerDetails.ts`.

Local checks: the redesign production build passed using an isolated temporary build directory, with existing Browserslist and sourcemap warnings. The later chart-width and expected-points changes passed Vue compilation and local Brave checks. At 1440px and 390px, gallery cards had equal measured heights and aligned charts; the pitch bench and gallery bench also had equal heights. No horizontal overflow occurred at 320px. Pitch/gallery and Starting XI/Bench switches, chart legend interaction by mouse and keyboard, lazy loading, and a simulated player-data failure/retry were verified. The gallery showed Expected · GW 9, no GW 38 prediction, and no Player details disclosure. The last chart endpoint alignment adjustment received a source compilation check. Hosted deployment and physical-device verification remain open.

**Manager recommendations (24 October 2026).** `/manager/[id]` presents suggestions as compact, divided rows in one shared list, with linked player identities and a `Measure / Current / Recommended / Δ` comparison. The financial summary emphasizes the signed bank change with an up/lime or down/rose icon and value, combines sell and buy prices along a transfer arrow, and retains the bank after the move. A cheaper incoming player is shown as a bank increase because it frees budget; extra spend is shown as a bank decrease. The first three suggestions show initially; “Show all” reveals the remaining qualifying, distinct recommendations and “Show fewer” collapses them again. The server returns every suggestion that passes the existing score and de-duplication rules instead of truncating the ranked list at three. `npm run build` passed on Node 22.23.1 although `package.json` declares Node 24.x; the Impeccable detector returned no findings; a targeted ranking check returned five unique suggestions. The build reported existing stale Browserslist, unresolved font-reference, and sourcemap warnings. Browser and hosted verification remain open.

**Player profile (24 October 2026).** `/player/[id]` follows the homepage card style with a club-coloured portrait, full player name, price, large labelled stats, and the same icon-only watchlist control. Transfers use the player card's lime/rose balance bar. Fixture difficulty uses the same five segments, colours, and score out of five as homepage cards. Yellow/red card counts appear only as portrait overlays, without duplicate stat rows. Fixtures and recent history show five rows initially, with controls to reveal the rest; previous seasons remain visible. `PlayerProfileHistory.vue` owns these lists and disclosure state. Existing route resolution, canonical metadata, missing-player handling, and retry logic remain in the page.

Watchlist controls use `PlayerWatchlistButton.vue` for the same 40px icon button, saved state, accessible action label, and save/remove toggle on the homepage, player profile, watchlist, and manager squad cards in pitch and gallery views. Clicking the control does not open the player link. The shared component owns button sizing; players without a valid code cannot be saved. This consistency change received a scoped source and diff check only.

Local checks: the profile redesign production build passed with existing Browserslist and sourcemap warnings on Node 22.23.1; the project declares Node 24.x. Later bar and bookmark changes passed scoped Vue compilation. Brave checks found no page or stat overflow at 1440, 768, 390, and 320px after the responsive type adjustment. Save/reload/remove and match expansion worked. Local HTTP checks confirmed the numeric alias redirects with 301 to the preferred player URL, missing players return 404 with recovery UI, and canonical metadata uses `https://sportsync.in`. A final inspection of the loaded Brave page confirmed two transfer segments, five difficulty segments, an icon-only bookmark, and no duplicate discipline stat rows. The development server stopped during final checks; complete keyboard verification, a new build including the final small changes, hosted verification, and physical-device checks remain open.
