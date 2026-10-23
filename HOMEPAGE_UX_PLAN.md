# Homepage UX and UI implementation plan

Created: 6 September 2026.

Status: homepage search, discovery, rule-based player trend sections, and a six-match upcoming-fixture list are implemented locally as of 23 October 2026. The owner directed that homepage AI calls be removed, factual Differential/Most sold/Most bought sections be shown together, and no more than six fixtures appear in the homepage match list. Preserve the portrait-card identity, use the available viewport width, keep player names in full, and reveal secondary controls on demand. Hosted Vercel behavior, authenticated manager use, analytics, and physical-device checks remain separate.

## Purpose and relationship to the audit

Help a visitor find a player immediately, understand the next deadline, and discover a useful shortlist without scrolling through every dataset. Casual and newer FPL managers remain the working audience assumption.

Read this alongside [DESIGN.md](DESIGN.md), [SITE_GROWTH_AUDIT.md](SITE_GROWTH_AUDIT.md), [BLOG_GROWTH_PLAN.md](BLOG_GROWTH_PLAN.md), and [AGENTS.md](AGENTS.md). `DESIGN.md` owns the shared visual direction, content rail, and presentation rules. This plan owns the homepage order, behavior, and implementation checkpoints; the audit supplies growth priorities and earlier evidence.

| Recommendation | Existing coverage | Detail added here |
| --- | --- | --- |
| Search immediately after a short introduction | Audit section 5 | First-screen composition and search states |
| Secondary manager lookup and compact deadline | Audit section 5 | Placement, form behavior, and deadline fallback |
| Fewer initially displayed players | Audit section 6 | One portrait-card discovery carousel with optional position/price filters |
| Readable labels and accessible forms | Audit section 11 | Typography hierarchy, simultaneous stats, and keyboard checks |
| Watchlist entry and useful saved-player journey | Audit section 7 | Reuse current work and verify before promoting it |
| Freshness and understandable data | Audit sections 8 and 10 | Context beside rankings, transfers, and fixtures |
| Recent articles on the homepage | Blog plan, public experience section | Placement after fixtures and published-content gate |
| Recap lower down, simpler styling, exact section order | Not fully specified in the audit | Proposed layout below |

## Evidence and current state

Before this implementation, `pages/index.vue` placed the introduction, manager lookup, countdown, gameweek summary, and upcoming fixtures before player search. Search was followed by ownership, transfers in/out, and separate position sections with repeated carousels. The current local implementation puts the labelled search directly after the introduction, keeps the compact deadline visible, and reveals manager lookup through Open your team. Returning visitors see up to four saved players. Discovery uses a portrait-card carousel with six initial players and optional position, price, and stat-ranking controls. Three compact, rule-based sections show low-ownership differentials, most sold, and most bought players together. The fixture carousel shows the next six individual matches; player cards retain their three-gameweek fixture runs. The blog remains omitted until published content exists.

Historical evidence from the earlier row-based implementation: the comparable local SSR measurement changed from 2,550,303 to 447,235 HTML bytes and from 1,818,063 to 398,188 bytes for the largest Nuxt data script. That earlier pass rendered 24 fixed-dimension lazy images (6 player portraits and 18 club badges), compared with 314 image tags and 140 player-image URLs in the old homepage, and keeps 6 meaningful profile links instead of 140 repeated card links. The response keeps the full player catalog's decision fields in a homepage-only projection (`/api/homepage-data`) while leaving the shared `/api/bootstrap-static` contract intact. These are local response measurements, not compressed transfer or field-performance results.

Current source already exposes Watchlist in `layouts/default.vue`, and local watchlist components and a composable exist. These differ from the audit's original snapshot. Inspect and preserve that work rather than implementing the old findings again. Their presence alone does not establish a passing save/reload/remove journey or hosted availability.

The local route was reviewed in Brave at 390 × 844, 430 × 932, a 195-pixel CSS viewport as a 200%-zoom proxy, and 1280 × 900. The fixture pass reuses the existing compact `AppCarousel`/`FixtureCard` composition: six cards measured a 390-pixel carousel viewport with 1,800 pixels of scrollable content and a roughly 160-pixel rail, with club badges loaded and no timezone suffix or concatenated FDR labels in the rendered text. The declared public target is https://fantasyleague.vercel.app on Vercel; its deployed commit, cache behavior, and authenticated project configuration have not been verified here.

## Proposed homepage order

| Order | Section | Content and behavior |
| --- | --- | --- |
| 1 | Compact header | Preserve existing identity and assets. Keep working navigation visible. Add links for future destinations only when those destinations exist. |
| 2 | Introduction and player search | One concise heading and a full-width labelled search field, alongside each other on desktop and stacked on mobile. Omit repeated instructions. This is the primary starting action. |
| 3 | Deadline and manager lookup | A compact next-deadline block; team lookup is closed until Open your team is selected. |
| 4 | Saved players | Up to four current saved players for returning visitors, linked to profiles and the existing watchlist. |
| 5 | Player discovery | A portrait-card carousel with optional position, maximum price, and stat ranking. Show price, form, season points/minutes, availability flags, and the next three gameweeks. |
| 6 | Player trends | Show Differential, Most sold, and Most bought rankings together, calculated from current FPL ownership and gameweek transfer counts. |
| 7 | Upcoming fixtures | Show up to the next six individual matches across the upcoming gameweeks, with gameweek, kickoff, home/away difficulty, and team names. |
| 8 | Recent analysis | A few relevant published articles linked to supporting player pages, once the blog is available. Omit the section until real content exists. |
| 9 | Gameweek recap and footer | Show the current/previous gameweek below the primary tools, using average/highest points, transfers, captain portraits, and chip usage. Include real data-source and methodology information when available. |

On mobile, use this single-column reading order. On wider screens, the deadline sits beside the heading and manager lookup sits beside search. On mobile, show the heading, search, collapsed team lookup, then deadline. Keep search ahead of team lookup in keyboard order. Search results must appear directly below their field.

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
- Keep the manager form inside the closed-by-default Open your team disclosure. Preserve "Open team" as a secondary action, with a visible Manager ID label and concise help explaining where to find the ID. Verify the current official instructions before writing that help.
- Trim input and validate a non-empty numeric ID before navigation. Keep ID values as strings unless the existing contract requires conversion.
- Give invalid submissions inline feedback. Use real disabled/submitting states when appropriate, rather than opacity and pointer-event styling alone.
- Keep fields full width. Mobile controls should stack without overflow.

### Player discovery

Use one discovery section. Player search remains the only visible input on initial load. Keep Position, Max price (£m), and Rank by inside the closed-by-default Filter players disclosure. Show active filters in the result summary even when the controls are closed.

- Apply exact position and maximum-price filtering to the full current catalog before ranking. Price uses FPL tenths of a million; accept £3.0m to £20.0m in £0.1m steps, or blank for any price. Invalid values show inline feedback and an empty result state.
- Retain form, season points, ownership, and gameweek transfer-in/out rankings. Form is the initial ranking. These rankings are factual FPL statistics, not predictions.
- Render six initial portrait cards with meaningful profile links in server HTML. Show more adds six. Use complete cards at each breakpoint and visible previous/next controls.
- Use the full available homepage width, including its navigation. Player names wrap in full in cards, search results, saved links, and the recap. Never use ellipsis or line clamping for names.
- Reuse the existing watchlist button and persistence. Keep save buttons outside profile links. Returning visitors can resume through Your saved players without another data request.
- Show the next three gameweeks, all opponents in a double, home/away, FDR, and unknown kickoff times. Do not treat missing fixture data as a blank gameweek.
- Do not make homepage AI/provider requests or generate player recommendations or explanations. Keep the player orderings calculable from the displayed FPL fields.

### Player trend sections

- Render three sections together after the main discovery carousel: Differentials, Most sold this gameweek, and Most bought this gameweek. Use the compact player rows with complete names and preferred profile links.
- Differentials rank the lowest `selected_by_percent` first. Break ownership ties by form descending, season points descending, then player ID ascending. Display the ownership percentage; lower ownership is not a prediction or endorsement.
- Most sold and Most bought rank positive `transfers_out_event` and `transfers_in_event` values descending, respectively. Break ties by season points descending, then player ID ascending. Display the raw gameweek transfer count and omit players with missing or zero counts.
- Show up to six players per section. If the source has no relevant ownership or transfer values, show a section-specific unavailable or no-transfers message instead of zeros.
- These sections use the existing homepage FPL snapshot and require no extra request, model, provider credential, or client-supplied evidence.

The homepage-only snapshot includes actual data-fetch timestamps and only its needed fields and three-gameweek fixtures. An upstream fixture failure does not remove player search; partial fixture responses are not cached, so retry can recover. The shared bootstrap, shared fixtures response, and scheduler contracts stay unchanged. FDR uses [FPL's 1–5 scale](https://www.premierleague.com/en/news/4675603/ranked-who-has-the-best-and-worst-opening-fixtures); it is not a scoring probability.

### Fixtures, analysis, and recap

- Show at most six matchups in the homepage Upcoming fixtures carousel, ordered by gameweek and then kickoff time. Include gameweek, both teams, kickoff or TBC, and separate home/away difficulty. Do not provide a Show all control in this section.
- Player cards still show all opponents in the next three gameweeks, including every match in double gameweeks. Mark unknown times and unassigned slots without inventing dates.
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
| `components/HomeDeadlinePanel.vue`, `components/HomeManagerLookup.vue`, `components/HomePlayerDiscovery.vue`, `components/HomePlayerDiscoveryRow.vue`, `components/HomePlayerTrends.vue`, `components/HomeFixtureList.vue` | Keep the homepage sections focused and independently stateful |
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

- [x] Consolidate repeated player sections with focused filters and rich portrait cards.
- [x] Verify ranking semantics, metric units/periods, preferred player links, and filter changes.
- [x] Keep fixtures below player discovery and move the gameweek recap lower down.
- [x] Simplify heading hierarchy, duplicate labels, spacing, and card nesting.
- [x] Verify any reused save action through add, reload, remove, and navigation; the current homepage cards reuse the existing save control and browser-local state. Save, reload, watchlist navigation, and removal were checked locally.

### Pass 3: Performance and completion

- [x] Measure before/after HTML, embedded payload, and image work under comparable conditions.
- [x] Profile shared data before trimming it. Check all consumers if a response changes, including compatibility with excluded routes.
- [x] Aim toward the audit's initial budget of roughly halving HTML and embedded payload. The local SSR HTML fell by 82.5% and the largest Nuxt data script by 78.1% while restoring the required visual assets; compressed transfer and field performance remain unmeasured.
- [x] Run `npm run build` for application changes and targeted behavior checks. No dedicated lint, test, or typecheck script exists in `package.json`.
- [x] Update the audit and this plan with dated local evidence and remaining hosted checks after implementation.

### Conditional follow-ups

- [ ] Add a small published-article selection and Blog navigation when the blog is ready.
- [ ] Connect complete player and fixture lists when their browse destinations exist.

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
- [x] Homepage save actions reuse existing watchlist state, survive reload, and are reflected on the watchlist page. Storage implementation details are not repeated in public cards.
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


### 23 October 2026: initial transfer shortlist and AI suggestions (superseded)

The initial 23 October implementation added an optional OpenRouter decision-service path alongside the transfer shortlist. The owner later directed that all AI calls be removed from the homepage and replaced with simultaneous FPL-stat ranking sections; that direction supersedes this implementation. The scheduler and its pre-existing changes were preserved. No dependency, account, publication, deployment, commit, or push was added.

Local checks: `npm run build` passes with the existing Browserslist/sourcemap warnings. Targeted Node assertions cover full-catalog budget/position filtering, home/away FDR, gameweek horizon, blank/double weeks, unknown times, eligibility, valid/weak/malformed scores, invalid query parameters, missing credentials, provider failures, upstream catalog/fixture outages, secret-safe responses, partial-data cache rejection, and snapshot-specific cache keys. Provider responses were stubbed for these assertions.

Connected Brave checks: desktop at effective CSS viewports 1280 × 900 and 1920 × 900, plus the browser's full desktop size, has no document horizontal overflow. Search results, active filters, invalid and empty budgets, keyboard disclosure toggles, complete player names, saved-player add/reload/watchlist/remove, and a controlled suggestions response were checked. The first search remains visible at 390 × 843. Light/dark preference and reduced-motion checks preserve readable controls. Temporary network interception and size/media overrides were cleared. The normal browser screenshot wrapper added blank capture margins at this browser's zoom; a native capture shows the complete viewport, and the owner confirmed the view is now fine. The page scrolls to the footer; the card rail has no vertical overflow.

Local SSR after trimming unused homepage fields: 412,171 HTML bytes and 343,772 bytes for the largest JSON script. These are uncompressed local response sizes with the then-current catalog, not measured visitor growth or an exact comparison with another gameweek.

At that time live provider verification was pending because the checkout had no `OPENROUTER_API_KEY`. The homepage provider path has since been removed; hosted behavior, analytics delivery, authenticated manager use, and physical-device behavior remain unverified. No release is authorized by these checks.

### 23 October 2026: recap visual update

Redesigned the homepage gameweek recap locally. Summary values use a simpler open layout, and captain spotlights use the player's club palette, larger portrait, and compact player stats. `git diff --check` passed. Browser and hosted verification remain open.

### 23 October 2026: rule-based player trends

Owner direction superseded the optional AI suggestions. The homepage now shows Differential, Most sold, and Most bought sections together, calculated from FPL ownership and gameweek transfer fields. The homepage OpenRouter endpoint, decision helper, runtime key mapping, and setup instructions were removed. The main portrait-card discovery list and its stat filters remain.

Local verification: `npm run build`, targeted ranking assertions, `git diff --check`, and the Impeccable detector passed. The connected browser and production site were not available for this revision. Hosted data freshness, analytics delivery, authenticated manager access, and physical-device behavior remain unverified.

Production-preview SSR: `/` returned HTTP 200 with all three trend headings rendered, and the removed `/api/homepage-shortlist` route returned 404. The uncompressed response measured 565,351 HTML bytes and 343,923 bytes for its largest JSON script, versus 412,171 and 343,772 before the trend sections. The rendered page contained 26 player-profile links and 128 image tags; the new compact-row images use lazy loading. This is a content/markup increase of 153,180 HTML bytes and 151 JSON bytes, not a field-performance result. Compressed transfer and visitor performance remain unmeasured. The build retained existing Browserslist, sourcemap, and font-path warnings.
