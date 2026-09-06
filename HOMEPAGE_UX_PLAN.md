# Homepage UX and UI implementation plan

Created: 6 September 2026.

Status: proposed implementation plan. This document records the homepage recommendations discussed with the owner; creating it does not implement the UI or authorize deployment.

## Purpose and relationship to the audit

Help a visitor find a player immediately, understand the next deadline, and discover a useful shortlist without scrolling through every dataset. Casual and newer FPL managers remain the working audience assumption.

Read this alongside [SITE_GROWTH_AUDIT.md](SITE_GROWTH_AUDIT.md), [BLOG_GROWTH_PLAN.md](BLOG_GROWTH_PLAN.md), and [AGENTS.md](AGENTS.md). The audit supplies the growth priorities and earlier evidence. This plan adds a concrete homepage order, presentation choices, and implementation checkpoints.

| Recommendation | Existing coverage | Detail added here |
| --- | --- | --- |
| Search immediately after a short introduction | Audit section 5 | First-screen composition and search states |
| Secondary manager lookup and compact deadline | Audit section 5 | Placement, form behavior, and deadline fallback |
| Fewer initially displayed players | Audit section 6 | One compact discovery section with a selected category |
| Readable labels and accessible forms | Audit section 11 | Typography hierarchy, comparable rows, and keyboard checks |
| Watchlist entry and useful saved-player journey | Audit section 7 | Reuse current work and verify before promoting it |
| Freshness and understandable data | Audit sections 8 and 10 | Context beside rankings, transfers, and fixtures |
| Recent articles on the homepage | Blog plan, public experience section | Placement after fixtures and published-content gate |
| Recap lower down, simpler styling, exact section order | Not fully specified in the audit | Proposed layout below |

## Evidence and current state

The current `pages/index.vue` places the introduction, manager lookup, countdown, gameweek summary, and upcoming fixtures before player search. Search is followed by ownership, transfers in/out, and separate position sections with repeated carousels. Search also has two similar visible labels: "Search FPL players" and "Player search".

The audit's earlier live inspection measured search about 2,007 pixels down at 390 × 844. Its HTML and payload measurements are historical baselines, not new measurements for this document. Capture comparable measurements before implementing the layout.

Current source already exposes Watchlist in `layouts/default.vue`, and local watchlist components and a composable exist. These differ from the audit's original snapshot. Inspect and preserve that work rather than implementing the old findings again. Their presence alone does not establish a passing save/reload/remove journey or hosted availability.

This plan was checked against local source, not a fresh rendered-browser review. The declared public target is https://fantasyleague.vercel.app on Vercel; its deployed commit and authenticated project configuration have not been verified here.

## Proposed homepage order

| Order | Section | Content and behavior |
| --- | --- | --- |
| 1 | Compact header | Preserve existing identity and assets. Keep working navigation visible. Add links for future destinations only when those destinations exist. |
| 2 | Introduction and player search | One concise heading and one useful explanatory sentence, followed immediately by a full-width search field. This is the primary starting action. |
| 3 | Deadline and manager lookup | A compact next-deadline block and secondary team lookup. Include help locating a manager ID. |
| 4 | Player discovery | One small, comparable player list with a clearly selected category, ranking explanation, and relevant stats. |
| 5 | Upcoming fixtures | Compact schedule with date/time, home/away context, and a difficulty explanation wherever difficulty is shown. |
| 6 | Recent analysis | A few relevant published articles linked to supporting player pages, once the blog is available. Omit the section until real content exists. |
| 7 | Gameweek recap and footer | Move the current/previous gameweek summary below the primary decision tools. Include real data-source and methodology information when available. |

On mobile, use this single-column reading order. On wider screens, deadline and manager lookup may sit beside each other below search. Do not put either ahead of search in the document or keyboard order. Search results must appear directly below their field.

The first 390 × 844 viewport, with the keyboard closed, must contain the header, short introduction, visible search label, and entire search control. The deadline should be compact, but fitting every secondary task into that first screen is not required.

## Section requirements

### Introduction and search

- Shorten the current long headline while keeping the player-stats purpose clear. Retain accurate page metadata and one descriptive H1.
- Use one visible label, "Search players", associated with the field. Retain the useful placeholder "Search players by name".
- Keep the Nuxt UI root and inner input full width. Avoid a narrow control inside a wide wrapper.
- Show matching player name and team clearly. Keep supplementary text visually secondary and readable.
- Use `getPlayerRoute` for result destinations. Preserve existing useful search behavior while improving placement.
- Provide distinct loading, results, no-results, and data-failure states. Do not show "No players match that search" while the catalog is still loading or has failed.
- Support keyboard access to every result, visible focus, and a predictable Enter action. Avoid unexpected navigation while typing.

### Deadline and manager lookup

- Replace the large countdown presentation on this route with a compact date/time and optional remaining-time display. Show the timezone explicitly.
- Do not invent a next deadline when the data contains none. Display an honest unavailable/end-of-season state based on verified data.
- Preserve "Open team" as a secondary action, with a visible Manager ID label and concise help explaining where to find the ID. Verify the current official instructions before writing that help.
- Trim input and validate a non-empty numeric ID before navigation. Keep ID values as strings unless the existing contract requires conversion.
- Give invalid submissions inline feedback. Use real disabled/submitting states when appropriate, rather than opacity and pointer-event styling alone.
- Keep fields full width. Mobile controls should stack without overflow.

### Player discovery

Consolidate the repeated homepage player sections into one compact discovery section. Use a clearly labelled category control for the existing ownership, transfer, and position views. Preserve the useful categories; avoid adding another layer of filters in this pass.

- Start with a small visible subset. Choose the exact count during rendered verification so the list is useful without becoming another long homepage.
- Prefer aligned rows on mobile for comparing players. Show name/team, price, and the active ranking metric; add form or ownership only where they remain readable.
- State what the list ranks and which period the metric covers. Popularity is not a buy recommendation.
- Check the existing scored-subset-then-sort behavior before changing headings or sorting. The label must describe the actual candidate set, not imply a whole-catalog ranking when only a subset was sorted.
- Switching category must update both rows and their metric labels, with a visible selected state and keyboard support.
- Keep meaningful initial player links in server-rendered HTML. Do not make all discovery dependent on a client-only interaction.
- Complete lists belong on useful browse destinations as those are implemented. Do not add a broken "View all" link or silently expand this task into building `/players`.
- Reuse the existing watchlist control and state if save actions are included. Verify them first; do not create a second persistence mechanism.

### Fixtures, analysis, and recap

- Reduce fixture presentation to the information needed to understand the schedule. Show unknown kickoff times honestly, and retain multiple fixtures where relevant rather than assuming one per team per gameweek.
- Where difficulty is displayed, accompany color and numbers with a readable explanation. Verify the source scale before assigning descriptions.
- Link to a complete fixtures destination only once it exists. Avoid blocking the homepage work on building `/fixtures`.
- Add recent analysis only after the blog supports published content. Follow the blog plan for evidence, timestamps, authorship, and publication rules. Never show draft or invented articles to fill the layout.
- Keep the gameweek recap available lower down. Clearly identify the gameweek and whether the data is current or completed.

## Visual direction

Preserve the current dark and green identity and existing brand assets. This is a hierarchy and usability improvement, not a rebrand.

- Reserve the strongest type emphasis for the introduction and primary action. Reduce repeated oversized section headings.
- Replace tiny, widely spaced uppercase labels with readable sentence-case labels where they convey essential information.
- Use consistent section spacing, row alignment, and numeric formatting so visitors can compare values quickly.
- Prefer one visual layer. Avoid wrapping every list, row, stat, and control in another card.
- Remove duplicate labels and explanatory text that merely repeats a heading. Use real task-specific copy.
- Keep borders and green accents restrained enough that selected controls and focus states remain obvious.
- Preserve image dimensions and defer below-fold image loading where appropriate. A component name beginning with `Lazy` does not by itself prove deferred image downloads.

## Implementation boundaries and file map

Keep `pages/index.vue` focused on composing the sections. Extract cohesive logic and presentation only where this reduces duplication or gives a section a clear responsibility; do not create a generic homepage framework.

| Existing area | Intended work |
| --- | --- |
| `pages/index.vue` | Reorder sections, shorten introduction, compose search and secondary tasks, consolidate discovery |
| `components/CountdownTimer.vue` | Inspect shared usage before adding a compact variant or replacing only the homepage presentation |
| `components/GameWeekCardNew.vue` | Move its homepage placement; adjust internal presentation only if needed |
| `components/AppCarousel.vue`, `components/PlayerCardNew.vue` | Inspect shared consumers; use a homepage-specific row if changing the shared card would affect unrelated routes |
| `components/FixtureCard.vue` | Verify the information hierarchy and shared usage before changing |
| `layouts/default.vue`, `components/AppFooter.vue` | Keep navigation compact; add a main landmark/skip link if still missing; avoid unrelated shell redesign |
| `assets/css/main.css` | Reuse existing typography and palette; avoid broad token changes for a local layout task |
| `stores/players.ts`, `composables/usePremiereLeague.ts` | Preserve contracts; profile before trimming data or changing scoring behavior |
| `composables/usePlayerRoute.ts` | Reuse preferred player-link generation |
| `composables/useWatchlist.ts`, `components/PlayerWatchlistButton.vue` | Inspect and reuse current implementation; preserve unrelated work |

Extract search/filtering state into a focused composable if it remains substantial after rearranging the page. Use Nuxt UI controls where appropriate and Tailwind for layout. Follow current installed library behavior rather than assuming APIs from another version.

Keep the scheduler excluded. No rebrand, new account system, new prediction model, paid analytics, API contract rewrite, or full blog implementation is included in this homepage task. Blog and browse-page integrations are conditional follow-ups.

## Sequenced implementation checklist

### Pass 1: First-screen hierarchy

- [ ] Recheck checkout, remote, branch, dirty state, runtime, and deployment target; preserve existing work.
- [ ] Capture current mobile/desktop screenshots and comparable homepage HTML/payload measurements.
- [ ] Shorten the introduction and move search immediately below it.
- [ ] Compact the deadline and place manager lookup secondarily, with validation and ID help.
- [ ] Verify search states, keyboard operation, and first-screen visibility at 390 × 844.

### Pass 2: Discovery and readability

- [ ] Consolidate repeated player sections with a clear category control and comparable rows.
- [ ] Verify ranking semantics, metric units/periods, preferred player links, and category switching.
- [ ] Keep fixtures below player discovery and move the gameweek recap lower down.
- [ ] Simplify heading hierarchy, duplicate labels, spacing, and card nesting.
- [ ] Verify any reused save action through add, reload, remove, and navigation.

### Pass 3: Performance and completion

- [ ] Measure before/after HTML, embedded payload, and image work under comparable conditions.
- [ ] Profile shared data before trimming it. Check all consumers if a response changes, including compatibility with excluded routes.
- [ ] Aim toward the audit's initial budget of roughly halving HTML and embedded payload. Record actual results and any remaining gap; do not assume layout consolidation alone meets it.
- [ ] Run `npm run build` for application changes and targeted behavior checks. Do not claim nonexistent lint/test/typecheck scripts passed.
- [ ] Update the audit and this plan with dated local evidence and remaining hosted checks after implementation.

### Conditional follow-ups

- [ ] Add a small published-article selection and Blog navigation when the blog is ready.
- [ ] Connect complete player and fixture lists when their browse destinations exist.
- [ ] Add decision summaries only when their inputs, freshness, and uncertainty can be explained accurately.

## Acceptance and reporting

Verify the actual `/` route in connected Brave, using the current dark presentation and any other supported themes. Check 390 × 844, a wider mobile size, and desktop. Record browser limitations explicitly if no connected session is available.

- [ ] Search is fully visible in the first 390 × 844 viewport with no keyboard open.
- [ ] A newcomer can find and open a player without a manager ID.
- [ ] Search handles loading, empty query, matches, no matches, and upstream failure distinctly.
- [ ] Keyboard users can reach search, open results, switch discovery categories, and submit manager lookup with visible focus.
- [ ] Empty/malformed manager IDs do not navigate; valid input follows the existing manager route contract.
- [ ] Controls remain usable at 200% zoom, with no page-wide horizontal overflow at tested widths.
- [ ] Essential labels and controls have verified rendered contrast. Difficulty remains understandable without color alone.
- [ ] Category changes show the correct data and labels; initial HTML retains useful player links.
- [ ] Unknown deadlines/fixtures and unavailable stats do not produce invented values or misleading empty states.
- [ ] Existing watchlist state remains intact, and any included save actions pass the actual browser journey.
- [ ] No navigation points to unfinished destinations and no unpublished article content appears.
- [ ] Build and relevant local checks pass, with before/after measurements recorded.

Record local static checks, local browser results, hosted behavior, authenticated workflows, and physical-device checks separately. A responsive browser viewport is not physical-phone verification. Deployment requires a separate explicit request.

Use available analytics to compare successful player opens and team opens over equivalent gameweek/deadline periods. If collection or a baseline is unavailable, report that limitation. Do not add a paid service or claim visitor growth from a visual change alone.

## Document verification

6 September 2026: recommendations mapped to the current audit and blog plan; referenced source paths checked locally. No application changes, build, fresh browser inspection, commit, push, or deployment were performed for this document. All implementation checkboxes remain open.
