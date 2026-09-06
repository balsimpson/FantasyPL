# Homepage UX and UI implementation plan

Created: 6 September 2026.

Status: visual direction revised and implemented locally on 6 September 2026 after owner feedback. Restore the portrait-card identity, compact the introduction and utility controls, enrich the recap, and match the player profile. See the latest verification entry below. Hosted Vercel behavior, authenticated manager use, analytics, and physical-device checks remain unverified.

## Purpose and relationship to the audit

Help a visitor find a player immediately, understand the next deadline, and discover a useful shortlist without scrolling through every dataset. Casual and newer FPL managers remain the working audience assumption.

Read this alongside [SITE_GROWTH_AUDIT.md](SITE_GROWTH_AUDIT.md), [BLOG_GROWTH_PLAN.md](BLOG_GROWTH_PLAN.md), and [AGENTS.md](AGENTS.md). The audit supplies the growth priorities and earlier evidence. This plan adds a concrete homepage order, presentation choices, and implementation checkpoints.

| Recommendation | Existing coverage | Detail added here |
| --- | --- | --- |
| Search immediately after a short introduction | Audit section 5 | First-screen composition and search states |
| Secondary manager lookup and compact deadline | Audit section 5 | Placement, form behavior, and deadline fallback |
| Fewer initially displayed players | Audit section 6 | One portrait-card discovery carousel with a selected category |
| Readable labels and accessible forms | Audit section 11 | Typography hierarchy, simultaneous stats, and keyboard checks |
| Watchlist entry and useful saved-player journey | Audit section 7 | Reuse current work and verify before promoting it |
| Freshness and understandable data | Audit sections 8 and 10 | Context beside rankings, transfers, and fixtures |
| Recent articles on the homepage | Blog plan, public experience section | Placement after fixtures and published-content gate |
| Recap lower down, simpler styling, exact section order | Not fully specified in the audit | Proposed layout below |

## Evidence and current state

Before this implementation, `pages/index.vue` placed the introduction, manager lookup, countdown, gameweek summary, and upcoming fixtures before player search. Search was followed by ownership, transfers in/out, and separate position sections with repeated carousels. The local implementation now puts the labelled search directly after the introduction, places the compact deadline and manager lookup second, consolidates discovery into one category-controlled portrait-card carousel with six initial players, and keeps fixtures before the recap. The blog remains omitted until published content exists.

Historical evidence from the earlier row-based implementation: the comparable local SSR measurement changed from 2,550,303 to 447,235 HTML bytes and from 1,818,063 to 398,188 bytes for the largest Nuxt data script. That earlier pass rendered 24 fixed-dimension lazy images (6 player portraits and 18 club badges), compared with 314 image tags and 140 player-image URLs in the old homepage, and keeps 6 meaningful profile links instead of 140 repeated card links. The response keeps the full player catalog's decision fields in a homepage-only projection (`/api/homepage-data`) while leaving the shared `/api/bootstrap-static` contract intact. These are local response measurements, not compressed transfer or field-performance results.

Current source already exposes Watchlist in `layouts/default.vue`, and local watchlist components and a composable exist. These differ from the audit's original snapshot. Inspect and preserve that work rather than implementing the old findings again. Their presence alone does not establish a passing save/reload/remove journey or hosted availability.

The local route was reviewed in Brave at 390 × 844, 430 × 932, a 195-pixel CSS viewport as a 200%-zoom proxy, and 1280 × 900. The fixture pass reuses the existing compact `AppCarousel`/`FixtureCard` composition: six cards measured a 390-pixel carousel viewport with 1,800 pixels of scrollable content and a roughly 160-pixel rail, with club badges loaded and no timezone suffix or concatenated FDR labels in the rendered text. The declared public target is https://fantasyleague.vercel.app on Vercel; its deployed commit, cache behavior, and authenticated project configuration have not been verified here.

## Proposed homepage order

| Order | Section | Content and behavior |
| --- | --- | --- |
| 1 | Compact header | Preserve existing identity and assets. Keep working navigation visible. Add links for future destinations only when those destinations exist. |
| 2 | Introduction and player search | One concise heading and a full-width labelled search field, alongside each other on desktop and stacked on mobile. Omit repeated instructions. This is the primary starting action. |
| 3 | Deadline and manager lookup | A compact next-deadline block and secondary team lookup. Include help locating a manager ID. |
| 4 | Player discovery | A portrait-card carousel with a selected category, concise ranking context, points, goals, form, gameweek transfers, minutes, ownership, and assists. |
| 5 | Upcoming fixtures | Compact schedule with date/time, home/away context, and a difficulty explanation wherever difficulty is shown. |
| 6 | Recent analysis | A few relevant published articles linked to supporting player pages, once the blog is available. Omit the section until real content exists. |
| 7 | Gameweek recap and footer | Show the current/previous gameweek below the primary tools, using average/highest points, transfers, captain portraits, and chip usage. Include real data-source and methodology information when available. |

On mobile, use this single-column reading order. On wider screens, the deadline sits beside the heading and manager lookup sits beside search. On mobile, show the heading, search, manager lookup, then deadline. Keep search ahead of team lookup in keyboard order. Search results must appear directly below their field.

The first 390 × 844 viewport, with the keyboard closed, must contain the header, short introduction, visible search label, and entire search control. The deadline should be compact, but fitting every secondary task into that first screen is not required.

## Section requirements

### Introduction and search

- Shorten the current long headline while keeping the player-stats purpose clear. Retain accurate page metadata and one descriptive H1.
- Use one visible label, "Search players", associated with the field. Use the owner-requested placeholder "Haaland".
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
- Use the existing rich player cards at desktop and mobile sizes. Keep large portraits and badges, several simultaneous stats, and visible previous/next controls. Six initial cards retain a limited initial render; an explicit Show all action exposes the rest of the current shortlist.
- State what the list ranks and which period the metric covers. Popularity is not a buy recommendation.
- Check the existing scored-subset-then-sort behavior before changing headings or sorting. The label must describe the actual candidate set, not imply a whole-catalog ranking when only a subset was sorted.
- Switching category must update the cards and ranking label, with a visible selected state and keyboard support.
- Keep meaningful initial player links in server-rendered HTML. Do not make all discovery dependent on a client-only interaction.
- Complete lists belong on useful browse destinations as those are implemented. Do not add a broken "View all" link or silently expand this task into building `/players`.
- Reuse the existing watchlist control and state if save actions are included. Verify them first; do not create a second persistence mechanism.

### Fixtures, analysis, and recap

- Reduce fixture presentation to the information needed to understand the schedule. Show unknown kickoff times honestly, and retain multiple fixtures where relevant rather than assuming one per team per gameweek. The homepage currently uses compact badge-based cards with local kickoff labels and omits the separate FDR pill row.
- Where difficulty is displayed, accompany color and numbers with a readable explanation. Verify the source scale before assigning descriptions; do not compress home and away values into one unreadable label.
- Link to a complete fixtures destination only once it exists. Avoid blocking the homepage work on building `/fixtures`.
- Add recent analysis only after the blog supports published content. Follow the blog plan for evidence, timestamps, authorship, and publication rules. Never show draft or invented articles to fill the layout.
- Keep the gameweek recap available lower down. Clearly identify the gameweek and whether the data is current or completed.

## Visual direction

Preserve the current dark and green identity and existing brand assets. This is a hierarchy and usability improvement, not a rebrand.

- Give player imagery and stats the strongest visual presence. Keep the introduction short and utility controls compact; preserve the dark palette, lime accents, and serif numbers from the existing cards.
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
| `pages/index.vue` | Reorder sections, shorten introduction, compose search and secondary tasks, consolidate discovery, and consume the homepage-only projection |
| `server/api/homepage-data.ts` | Return only homepage-required player, event, and team fields without changing the shared bootstrap response |
| `components/HomeDeadlinePanel.vue`, `components/HomeManagerLookup.vue`, `components/HomePlayerDiscovery.vue`, `components/HomePlayerDiscoveryRow.vue`, `components/HomeFixtureList.vue` | Keep the homepage sections focused and independently stateful |
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

- [x] Recheck checkout, remote, branch, dirty state, runtime, and deployment target; preserve existing work.
- [x] Capture current mobile/desktop screenshots and comparable homepage HTML/payload measurements.
- [x] Shorten the introduction and move search immediately below it.
- [x] Compact the deadline and place manager lookup secondarily, with validation and ID help.
- [x] Verify search states, keyboard operation, and first-screen visibility at 390 × 844.

### Pass 2: Discovery and readability

- [x] Consolidate repeated player sections with a clear category control and rich portrait cards.
- [x] Verify ranking semantics, metric units/periods, preferred player links, and category switching.
- [x] Keep fixtures below player discovery and move the gameweek recap lower down.
- [x] Simplify heading hierarchy, duplicate labels, spacing, and card nesting.
- [x] Verify any reused save action through add, reload, remove, and navigation; this homepage does not add a second save control, save/remove behavior remains unchanged, and redundant browser-storage notices are removed from the profile and watchlist presentation.

### Pass 3: Performance and completion

- [x] Measure before/after HTML, embedded payload, and image work under comparable conditions.
- [x] Profile shared data before trimming it. Check all consumers if a response changes, including compatibility with excluded routes.
- [x] Aim toward the audit's initial budget of roughly halving HTML and embedded payload. The local SSR HTML fell by 82.5% and the largest Nuxt data script by 78.1% while restoring the required visual assets; compressed transfer and field performance remain unmeasured.
- [x] Run `npm run build` for application changes and targeted behavior checks. No dedicated lint, test, or typecheck script exists in `package.json`.
- [x] Update the audit and this plan with dated local evidence and remaining hosted checks after implementation.

### Conditional follow-ups

- [ ] Add a small published-article selection and Blog navigation when the blog is ready.
- [ ] Connect complete player and fixture lists when their browse destinations exist.
- [ ] Add decision summaries only when their inputs, freshness, and uncertainty can be explained accurately.

## Acceptance and reporting

Verify the actual `/` route in connected Brave, using the current dark presentation and any other supported themes. Check 390 × 844, a wider mobile size, and desktop. Record browser limitations explicitly if no connected session is available.

- [x] Search is fully visible in the first 390 × 844 viewport with no keyboard open.
- [x] A newcomer can find and open a player without a manager ID.
- [x] Search handles loading, empty query, matches, no matches, and upstream failure distinctly.
- [x] Keyboard users can reach search, open results, switch discovery categories, and submit manager lookup with visible focus.
- [x] Empty/malformed manager IDs do not navigate; valid input follows the existing manager route contract.
- [x] Controls remain usable at 200% zoom, with no page-wide horizontal overflow at tested widths.
- [x] Essential labels and controls have a rendered visual contrast review. Difficulty remains understandable without color alone; this is not a formal WCAG audit.
- [x] Category changes show the correct data and labels; initial HTML retains useful player links.
- [x] Unknown deadlines/fixtures and unavailable stats do not produce invented values or misleading empty states.
- [x] Existing watchlist state remains intact, this homepage includes no new save action, and the profile/watchlist UI does not repeat browser-storage implementation details.
- [x] No navigation points to unfinished destinations and no unpublished article content appears.
- [x] Build and relevant local checks pass, with before/after measurements recorded.

Record local static checks, local browser results, hosted behavior, authenticated workflows, and physical-device checks separately. A responsive browser viewport is not physical-phone verification. Deployment requires a separate explicit request.

Use available analytics to compare successful player opens and team opens over equivalent gameweek/deadline periods. If collection or a baseline is unavailable, report that limitation. Do not add a paid service or claim visitor growth from a visual change alone.

## Document verification

6 September 2026 local evidence: checkout `/Users/balsimpson/Documents/Projects/FantasyPL`, remote `https://github.com/balsimpson/FantasyPL.git`, branch `main`, Node `v22.23.1`, npm `10.9.8`, and Vercel target `https://fantasyleague.vercel.app` were confirmed before implementation. The pre-existing uncommitted `AGENTS.md` documentation-ownership edit was preserved. `npm run build` passed with the existing sourcemap warnings; `git diff --check` passed; and the required Impeccable detector returned no findings for the changed UI targets. Local Brave checks passed for the server-rendered `/` route, 390 × 844 first-screen search, search matches/no-results/Enter navigation, invalid and valid manager routes, category switching, skip-link focus, local-time output without `GMT`/`UTC` suffixes, player portraits, club badges, the compact horizontal fixture carousel, 430 × 932, 195-pixel CSS width as a 200%-zoom proxy, and 1280 × 900 section order with no document-level horizontal overflow. No production deployment, hosted response, authenticated manager success, analytics baseline, or physical-phone execution was performed.

## Owner-directed visual revision, 6 September 2026

The owner rejected the bare row-based design and requested the same changes on the player detail page. That feedback supersedes the earlier preference for rows. The homepage now uses the existing PlayerCardNew design in a shorter variant, with full portraits, badges, multiple stats, and six initial cards. Category and ranking controls remain, with previous/next buttons and Show all. The introduction has no descriptive paragraph or empty-query instruction. The deadline and manager lookup form a compact utility strip. The homepage-only projection adds bookings and gameweek score fields without changing the shared bootstrap response.

The recap now includes average/highest points, total transfers, linked captain portraits, and readable chip names and counts. The player route uses one profile heading inside its existing performance card, a side-by-side portrait/stats layout on desktop, and shorter fixture/history headings. Empty bookings panels are omitted. Existing profile fetch/error/redirect logic and watchlist behavior are preserved.

Earlier byte counts and image counts above describe the previous implementation, not this revision. No growth or new performance percentage is claimed. Verification for this revision: npm run build and git diff --check passed. An isolated Brave run checked the local production build at 1440 × 1000 and 390 × 844: homepage/player screenshots, recap, search results, carousel next, category switching, Show all, invalid Manager ID feedback, and watchlist add/reload/remove passed. The mobile discovery container is 358 pixels inside the 390-pixel viewport, with no page-width overflow; search ends at about 216 pixels. No page JavaScript errors were observed in the layout run. Light/dark input and dropdown hover checks passed. The build retained existing Tailwind sourcemap warnings; the local preview also reports the unavailable Vercel Analytics script. These checks do not verify the owner's connected browser session, hosted behavior, analytics delivery, authenticated manager access, or a physical device. No deployment was performed.

Input follow-up: shared Nuxt UI input, textarea, and select defaults use theme-aware foreground/background, placeholder, focus, and menu-highlight colors. Homepage overrides now use the same semantic tokens. This supports controls in both color modes while preserving the dark page identity.

Owner correction, 6 September 2026: use zinc for Nuxt UI neutral colors in both modes. Above discovery, align the heading with the deadline on desktop, then align search with manager lookup. Use Haaland as the search example. Place the Manager ID input and Open team button inside the same field row, both 48 pixels high, so labels and validation cannot offset their alignment.

Zinc/header verification: production build and diff checks passed. Brave at 1440 × 1000 and 390 × 844 in both light and dark modes confirmed the Haaland placeholder, no horizontal page overflow, and matching 48-pixel input/button heights with identical top coordinates, including the invalid-ID state. Dropdown hover colors resolve to zinc shades with readable foregrounds. Desktop/mobile screenshots were visually inspected. Hosted and physical-device behavior remain unverified.

Browser feedback refinement, 6 September 2026: compact player cards use shorter portraits, tighter gaps and padding, and a shared portrait/footer block with no gap above the Minutes divider. Homepage fixture cards use a stronger zinc-900 background and zinc border via an opt-in elevated variant. Captain summaries retain ownership and add labelled season points, form, and price from the existing homepage projection, with no extra requests.

Refinement verification: build and diff checks passed. Brave screenshots at 1275 × 1277 and 390 × 844 confirmed the stronger fixture background and readable captain stats. Measured portrait-to-footer gap is 0 pixels at both widths; compact cards measure approximately 539 pixels on desktop and 491 pixels on mobile, with no page-width overflow. The local preview on port 3010 was restarted with this build. No hosted or device verification was performed.

Recap grouping and fixture alignment, 6 September 2026: points, transfers, and chip plays now share one evenly aligned summary grid. Captain portraits sit beside their own labels, with a centre divider and internal spacing separating the two summaries. The homepage fixture rail stays inside the content gutter; removing negative margins also avoids snap alignment shifting the first card to the viewport edge.

Grouping/alignment verification: build and diff checks passed. Brave checks at 1275 and 390 pixels confirmed the first fixture card matches the heading gutter exactly (32 and 16 pixels respectively), with no page overflow. All seven recap summary values share one baseline on desktop and reflow into aligned columns on mobile. Desktop/mobile screenshots confirmed each captain portrait is grouped with its own name and stats. Port 3010 now serves this build; hosted/device verification remains open.
