# FPL Insights design direction

Updated: 23 October 2026.

This document defines the visual direction for a holistic homepage redesign. It keeps the current FPL Insights identity and describes how the homepage should feel as one connected decision path. It does not replace [HOMEPAGE_UX_PLAN.md](HOMEPAGE_UX_PLAN.md), which owns section order, behavior, affected files, and implementation status.

## Design goal

Help an FPL manager move from a question to a useful next action without making the homepage feel like a stack of separate dashboards. The page should guide the visitor through one clear sequence: find a player, understand the next deadline, return to saved choices, compare options, check upcoming fixtures, then review the gameweek.

The tone is calm, focused, and data-rich. Use clear labels and visible evidence. Avoid decorative charts, codes, repeated explanations, and UI that makes the visitor guess what a number means.

## Shared page frame

Every homepage section sits on one shared content rail. Section headings, descriptions, controls, carousels, card rows, and empty states align to the same left and right edges. Do not let individual sections choose unrelated widths.

Use this as the layout target:

| Viewport | Content width | Side gutter |
| --- | --- | --- |
| Small mobile | Available width | 16 px |
| Large mobile and tablet | Available width | 24 px |
| Desktop | Up to 1,280 px, centered | 32 px minimum |

The header and footer should follow the same rail. Full-bleed photography may extend to the edges inside a player card, but the card itself stays inside its section rail. A section may use a narrower inner layout for readability, but its heading and outer frame still align to the shared rail.

## Homepage flow

Use one heading per section and a consistent hierarchy of heading, short context, and action. Keep the page order in [HOMEPAGE_UX_PLAN.md](HOMEPAGE_UX_PLAN.md); visually connect those sections with spacing and alignment rather than adding a separate boxed panel around each one.

1. **Orient and search.** A short introduction and the primary player search form the clear entry point. The search should be the strongest action on the page and visible early on mobile.
2. **Check the deadline and team.** Show the next deadline as compact, useful context. Keep manager lookup available without competing with search.
3. **Resume saved choices.** Show saved players only when there are saved choices to resume. Use the same player identity and visual language as discovery.
4. **Compare players.** Make the discovery section the main browsing surface. Its filters, ranking context, cards, and “show more” action should read as one tool.
5. **Scan fixture runs.** Group fixtures by gameweek and make home/away, opponent, kickoff, and difficulty easy to scan. Use actual short club names, not abbreviations that look like internal codes.
6. **Review the gameweek.** Put recap values and captain information after the actionable tools. Keep the recap compact and clearly tied to the relevant gameweek.
7. **Show recent analysis only when it exists.** Do not leave an empty editorial section or filler content.

## Spacing and section rhythm

Use a small, repeatable spacing scale. Keep a clear gap between sections and a tighter gap between a section heading and its content. On wide screens, sections should feel distinct through whitespace and alignment. On mobile, reduce the vertical gaps while preserving the same order and left edge.

Use dividers only when they help separate related data, such as values in a compact stat row. Avoid repeated full-width rules, thick accent borders, and nested rounded panels. Use a single surface for a data group instead of a card inside a card.

Section headings should share the same size, weight, and placement. Descriptions should stay short and use the same muted text treatment. Put section actions in a consistent position so visitors can find them quickly.

## Color and type

Keep the existing dark charcoal background, Public Sans typography, and FPL lime accent. Use lime for primary actions, selected states, and small emphasis. Keep most labels neutral so the page does not become a wall of bright text.

Club and kit colors belong inside player-specific content, where they help identify a club or add character to a portrait card. They should not change the color of the whole page or make unrelated sections compete. Keep text contrast high on all club-colored areas.

Use tabular numerals for points, prices, minutes, and transfer counts so columns scan cleanly. Pair every number with a clear label and relevant period. Keep player and club names readable; do not truncate them into cryptic fragments.

## Cards and data presentation

Use player cards as the homepage's distinctive visual element. Let portrait imagery run edge to edge within the card, then place name, club, price, and the most useful stats in a deliberate hierarchy. Use a restrained gradient only where text needs protection over an image.

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
