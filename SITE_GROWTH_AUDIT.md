# FantasyPL visitor growth audit and implementation plan

Audit date: 6 September 2026. Public site: [fantasyleague.vercel.app](https://fantasyleague.vercel.app/).

Follow-up: the owner requested a blog with an AI-assisted admin publishing workflow. [BLOG_GROWTH_PLAN.md](/Users/balsimpson/Documents/Projects/FantasyPL/BLOG_GROWTH_PLAN.md) adds a four-site competitor comparison, article strategy, and implementation scope. Its blog schedule takes priority over the later editorial timing in the initial plan below.

## Recommendation

Fix search discovery and the first useful visit before investing in promotion. Then build a repeatable reason to return before each gameweek deadline.

The strongest direction is a fast, understandable FPL decision tool for casual managers. The README describes the site as a simplified view for newcomers. This remains a working audience assumption, not a confirmed audience choice. The owner confirmed that no Search Console figures are available, so this report does not claim current traffic, rankings, conversion rates, or projected visitor gains.

The site already delivers real player data in server-rendered HTML and has readable player URLs. Its main weaknesses are a broken live sitemap, duplicate player URLs, a heavy homepage, buried player search, and an unfinished watchlist. More traffic would currently arrive at those same obstacles.

Recommended order:

1. Repair the sitemap, canonical URLs, and missing-player responses.
2. Establish search and visitor measurement.
3. Put player search and a useful weekly answer near the top of the homepage.
4. Repair and expose the watchlist as the reason to return.
5. Launch the admin-backed blog alongside the early site improvements, publishing reviewed transfer, fixture, and budget-player analysis linked to player pages. Expand dedicated tools and distribution using observed demand.

## Scope and evidence

The audit excluded the `instascheduler` route and its implementation. The initial audit was read-only. This follow-up now includes local corrections for P1 #1, the sitemap/public-origin correction, P1 #2, player URL consolidation, P1 #3, missing-player handling, and the browser-local watchlist work in the recommended growth order. No commit, push, deployment, publishing, or social posting was performed.

Checkout confirmed before writing:

| Item | Verified value |
| --- | --- |
| Directory | `/Users/balsimpson/Documents/Projects/FantasyPL` |
| Git remote | `https://github.com/balsimpson/FantasyPL.git` |
| Branch | `main`, tracking `origin/main` |
| Commit | `4daab9c69cbf8f450b63d4bd45dc53176acef83c` |
| Initial worktree | Clean |
| Local runtime | Node 22.23.1, npm 10.9.8 |
| Installed framework | Nuxt 4.4.2, Nuxt UI 4.7.0, Vue 3.5.33 |
| Public target | Vercel URL declared by README and Nuxt configuration, also fetched live |

The deployed commit and Vercel project settings were not authenticated or verified. Matching live behavior to local source supports the findings below but does not prove deployment identity. No on-disk AGENTS.md was found in the checked ancestor locations or project file inventory; the instructions supplied in the task governed the audit.

Evidence collected:

- Public HTTP responses for homepage, sitemap twice, robots.txt, one player slug, its numeric alias, an invalid player, and the social preview image.
- Connected Brave inspection at 1661 × 1273 and a temporary mobile viewport of 390 × 844. The original viewport was restored.
- Successful player search for Haaland and navigation to his profile. Fixtures and history loaded after their initial loading state.
- Live watchlist entry state, which showed only its title and the site shell in the inspected browser state.
- Source review of homepage, player, manager, watchlist, shared components, data delivery, metadata, and other non-excluded route declarations. A Luna subagent reviewed the visitor journeys.
- Mechanical interface scan of the main pages, layout, and footer returned no findings. That narrow result does not certify accessibility. Additional component warnings were treated as prompts for verification, not proven contrast violations.

Not measured: Lighthouse, field Core Web Vitals, actual Google indexing, analytics delivery, authenticated manager success, watchlist save/remove in a live session, a physical phone, every responsive breakpoint, light theme, screen-reader behavior, or a full contrast audit. The initial audit did not run an app build or test suite because it was read-only; the follow-up build and local route checks are recorded below. Hosted behavior remains unverified until an authorized deployment.

## What is already working

- The homepage and a valid player page contain meaningful text, titles, descriptions, and player content in their initial HTML. Preserve this server rendering.
- Player cards have real links and descriptive accessible names. The sampled homepage contained 141 anchor elements, so player discovery does not depend solely on search submission.
- Player names appear in readable URLs, and the valid sampled player page has an appropriate title and canonical tag.
- The public robots file allows crawling and advertises the correct public sitemap address.
- The shared social image returns HTTP 200 with an image content type.
- The dark visual style is consistent across the main homepage and player journey. Both inspected mobile pages fit 390 pixels without document-level horizontal overflow.
- Player search works. The manager input has an associated label, and the manager page has recovery UI in source.

## Prioritized findings

Priority here means implementation order for visitor growth. P1 means address before a deliberate promotion push; P2 means the next improvement cycle; P3 means defer. There is no confirmed whole-site outage.

### 1. P1: The live sitemap advertises localhost URLs

**Verified live.** Both sitemap responses contained 654 URLs, all with the host `localhost`. The first was `http://localhost/`. The endpoint itself returned HTTP 200 and valid XML, which would hide the defect in a basic uptime check.

**Why it matters:** The sitemap is handing crawlers the wrong locations. Existing HTML links can still help discovery, so this is not evidence that the entire site is unindexed. It does make the sitemap ineffective for the intended public pages.

**Initial source:** `server/routes/sitemap.xml.ts` derived the origin from the request inside a cached handler. The deployment/cache interaction was the likely cause; the public output was proven, but the exact internal cache history was not.

**Change:** Build sitemap URLs from one validated public site origin shared with canonical generation. Do not derive the canonical production host from a cached request. Handle unavailable bootstrap data without replacing a useful sitemap with broken output. Add XML escaping and ensure any retained cache contains the corrected host. Use real content modification dates if adding `lastmod`.

**Acceptance:** Parse the deployed XML and assert every URL uses the approved HTTPS host, no localhost or preview host occurs, and sampled URLs return the expected content. Repeat after cache expiry or revalidation. Submit the corrected sitemap only after these checks.

**Local correction completed (6 September 2026).** `utils/site-url.ts` now validates and normalizes the configured public origin, and `nuxt.config.ts`, `useCanonicalUrl`, `robots.txt`, and the sitemap use that same origin boundary. The sitemap no longer reads its host from the request, uses a versioned `sitemap-v2` cache name so the old cached response is not reused, escapes XML locations, deduplicates URLs, and falls back to a valid root-only sitemap when bootstrap data is unavailable. The local build completed successfully. A local built-server check returned HTTP 200 with 654 locations; `xmllint` parsed the response successfully, every location used `https://fantasyleague.vercel.app`, the first location was `https://fantasyleague.vercel.app/`, no `localhost` occurred, and `robots.txt` advertised the same sitemap. A request with a `Host: localhost` header still returned the configured public origin. The origin helper also passed checks for the default, path-bearing, invalid-protocol, and credential-bearing inputs.

**Hosted status:** The public Vercel response and cache-expiry/revalidation behavior remain unverified because deployment was not requested. The live finding should be marked resolved only after the corrected build is authorized for release and the deployed XML is checked against this acceptance list.

Google documents that it crawls sitemap URLs as listed and recommends canonical absolute URLs. [Sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).

### 2. P1: Multiple addresses claim to be the same player's canonical page

**Verified live.** `/player/erling-haaland-411` and `/player/411` both returned 200 with Haaland content. Each emitted a canonical pointing to itself.

**Why it matters:** Shared links and discovery can accumulate against several addresses for one player. This creates avoidable ambiguity about the preferred URL.

**Source:** `composables/useCanonicalUrl.ts:10` uses the incoming path. `composables/usePlayerRoute.ts` extracts the trailing ID and generates the preferred name slug, but the player page does not normalize aliases to it.

**Change:** Resolve the player, compute one preferred URL with `getPlayerRoute`, and permanently redirect numeric and incorrect-name aliases to it. Generate canonical and social URL metadata from that resolved identity. Decide how seasonal ID reuse and renamed players are handled before expanding the indexed catalog; do not silently make an old player's URL describe a different person.

**Acceptance:** Numeric and wrong-slug aliases redirect to one destination. That destination returns 200 and exactly one matching canonical. Query parameters do not create competing canonical pages. Test old saved URLs explicitly.

Google describes redirects and canonical signals as ways to consolidate duplicate URLs. [Canonical guidance](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls).

**Local correction completed (6 September 2026).** `pages/player/[id].vue` now resolves the route's trailing player ID against the current bootstrap catalog and permanently redirects numeric and wrong-name aliases to `getPlayerRoute(player)`. The redirect uses HTTP 301 semantics during server rendering and replaces the URL during client navigation. `useCanonicalUrl` accepts the resolved player path, and the player page uses it for both the canonical link and `og:url`. On the local built server, `/player/411`, `/player/wrong-name-411`, and `/player/411?utm_source=test` each returned HTTP 301 with `Location: /player/erling-haaland-411`; that preferred URL returned HTTP 200 with exactly one canonical and one `og:url`, both set to `https://fantasyleague.vercel.app/player/erling-haaland-411`. Unknown-player handling is recorded under P1 #3 below.

**Hosted status:** Alias redirects and rendered metadata remain unverified on Vercel because deployment was not requested.

### 3. P1: Invalid players return successful loading pages

**Previously verified live.** `/player/99999999` returned 200 with the title `Loading player... FPL Stats, Fixtures & Ownership | FPL Insights` and a self-canonical.

**Why it matters:** Visitors cannot tell whether to wait or leave. Crawlers receive a success response for missing content, creating a soft-404 risk.

**Source:** `pages/player/[id].vue:252` does not expose the detail request's error state; the computed player falls back to loading text. `server/api/players/[id].ts:3` and `composables/usePremiereLeague.ts` can return null or error-shaped data.

**Change:** Separate pending, missing player, and temporary upstream failure. Return a real 404 for a confirmed missing player, with a route back to search. Return an appropriate temporary failure state for upstream outages, with retry or a clearly dated last successful response. Do not classify every API outage as a missing player.

**Acceptance:** Known valid, invalid, malformed, and upstream-failure cases produce distinct UI and correct HTTP behavior. No settled missing-player page retains a loading title.

**Local correction completed (6 September 2026).** `getPlayerInfoDetails` now lets upstream failures reach the player API route for classification instead of converting them to `null`. `server/api/players/[id].ts` rejects malformed IDs with a 404, maps a confirmed upstream 404 to `Player not found`, and maps other upstream or unusable responses to a 502 temporary-failure response. `pages/player/[id].vue` now tracks detail and bootstrap loading separately, renders explicit loading, not-found, invalid-link, and temporary-failure states, sets the SSR response status, removes the loading title from settled missing pages, links back to player search, and offers `Try again` for temporary failures.

On the local built server, `/api/players/99999999` returned HTTP 404 with `Player not found`, `/api/players/not-a-player` returned HTTP 404 with `Invalid player URL`, and the corresponding page routes returned HTTP 404. Their rendered titles were `Player not found | FPL Insights` and `Invalid player link | FPL Insights`; both included `Search players` and neither included a loading title. `/player/411` continued to return HTTP 301 to `/player/erling-haaland-411`, and the preferred route returned HTTP 200. A controlled local preview with an unreachable upstream proxy returned HTTP 502, rendered `Player data temporarily unavailable` and `Try again`, did not render `Player not found`, and did not retain a loading title. The local production build, diff check, and UI detector passed.

**Hosted status:** The corrected player API responses, page statuses, and temporary-failure behavior remain unverified on Vercel because deployment was not requested.

### 4. P1: Search visibility and useful visits have no available baseline

**Confirmed by owner and source.** No Search Console figures were supplied. `plugins/analytics.client.ts:1` injects Vercel Analytics, but the inspected visitor code has no custom event calls. Dashboard access and actual collection were not checked.

**Why it matters:** Without measurement, a redesign can look successful while attracting the same number of visitors or reducing useful visits.

**Change:** Verify or create a Search Console URL-prefix property for the current HTTPS site. If a property already exists, use it. Establish pageviews, referrers, landing pages, search clicks, impressions, and conversion events before changing the main journey. Verify one known test visit appears in the chosen analytics tool.

Vercel currently limits custom events to Pro and Enterprise. Check the actual plan before choosing that route. Start with available pageview reports if necessary; do not buy or add a second analytics system automatically. [Vercel custom events](https://vercel.com/docs/analytics/custom-events).

**Acceptance:** A documented baseline, a verified test visit, and a repeatable weekly report. If search data is not yet available, record that explicitly rather than reporting zero demand.

### 5. P1: The useful player search is buried beneath summary content

**Verified live.** At the top of the page, the search input began about 1,338 pixels down on desktop and 2,007 pixels down at 390 × 844. A newcomer first sees a manager ID form, a large countdown, a previous/current gameweek summary, and fixtures.

**Why it matters:** The advertised player tool takes effort to find. Visitors who do not know their manager ID have no obvious first action in the first screen.

**Source:** `pages/index.vue:14`, `:30`, and `:74` establish this order. The global navigation exposes only the home brand.

**Change:** Put player search directly after a shorter explanation of the weekly task. Keep manager lookup as a secondary action with instructions for locating the ID. Reduce the deadline to a compact, useful date/time block. Offer a direct route to the current gameweek's decision page when that page exists. Keep the existing color identity.

**Acceptance:** Search is visible in the first 844-pixel mobile viewport with no keyboard open. New visitors can find a player without knowing a manager ID. Compare player-open rate with the baseline; do not equate moving a control with proven growth.

### 6. P1: The homepage sends far more content than its first screen needs

**Measured live.** The downloaded homepage HTML was 2,539,782 bytes. The embedded Nuxt data script accounted for 1,817,421 bytes. The inspected DOM contained 306 image elements and seven groups of 20 player links.

These are HTML and element counts, not compressed browser transfer totals or 306 unique image downloads. A local gzip estimate was approximately 254 KB for the HTML. One request took 2.92 seconds, which is not a representative speed benchmark.

**Source:** `pages/index.vue:156` onward renders repeated card carousels, and `:583` onward selects 20 players per position. `stores/players.ts:20` fetches the full bootstrap object. `components/PlayerCardNew.vue:88` and `components/PlayerPerformanceCard.vue:124` lack image lazy-loading attributes. A `Lazy` component name alone does not defer every rendered image.

**Change:** Profile the serialized payload before changing data contracts. Return only fields needed by the public journey, show a smaller initial player selection, and move complete lists onto useful browse pages. Lazy-load below-fold images and preserve their dimensions. Keep the main content server-rendered. Preserve fields required by other consumers, including excluded routes, rather than blindly shrinking a shared endpoint.

**Acceptance:** Record before/after HTML, payload, image requests, and a mobile performance trace on the same route and conditions. Aim initially to halve the homepage HTML and embedded payload without breaking search or cards; this is a project budget, not a Google requirement. Field targets, when enough data exists, are LCP ≤2.5 seconds, INP ≤200 milliseconds, and CLS ≤0.1 at the 75th percentile. [Web Vitals](https://web.dev/articles/vitals).

### 7. P1: The watchlist cannot yet support repeat visits

**Initial live and source evidence.** Before this correction, the inspected live watchlist showed only its title and the site shell. The navigation link was commented out in `layouts/default.vue:18`. The current main player profile and card had no visible save action in the inspected journey.

The initial `pages/watchlist.vue:7` rendered raw player data when populated. At `:29`, it stored a JSON string directly as watchlist state and then used substring membership. The initial `components/PlayerWatchlistCard.vue:2` rendered debug content and contained overlapping legacy/current card markup. At `:311`, it parsed storage without handling an empty or malformed string. Populated live rendering was not tested, so these were source-confirmed defects rather than a claimed live save/remove failure.

**Why it matters:** A player shortlist is a natural reason to come back before the next deadline. The existing implementation cannot be promoted as a finished feature.

**Change:** Centralize saved player codes in a small composable or store, validate stored arrays, and use exact membership. Render one card per saved player, add a helpful empty state, and add accessible save/remove controls to the actual player journey. Expose Watchlist in navigation. Explain that the first version is saved on this browser; do not imply account sync.

**Acceptance:** Add two players, reload, remove one, and navigate between homepage/profile/watchlist. Confirm exact membership, no duplicate cards, and recovery from missing or malformed storage. Test the existing saved format before migrating it. Avoid creating accounts just to launch this improvement.

**Local correction completed (6 September 2026).** `composables/useWatchlist.ts` now owns the `savedWatchlist` browser-local state, accepts the existing numeric and string code formats, normalizes exact codes, removes duplicates, and repairs malformed or non-array values. `components/PlayerWatchlistButton.vue` provides the accessible save/remove control used on player profiles and saved-player cards. `pages/watchlist.vue` now has a browser-local empty state, loading and data-failure states, one card per current saved player, and `noindex,follow` utility metadata. `components/PlayerWatchlistCard.vue` is a single focused card without debug output, and `layouts/default.vue` exposes the route in navigation.

The local production build returned HTTP 200 for `/watchlist`, rendered `Watchlist | FPL Insights`, included the browser-local copy, and emitted `noindex`. An isolated Brave run at 390 × 844 covered the requested journey: `/player/411` redirected to `/player/erling-haaland-411`; saving Haaland stored `["223094"]` and survived reload; saving a second current player stored `["223094","154561"]` and displayed two saved cards; removing the first left `["223094"]` and one card after reload; and replacing storage with `not-json` repaired it to `[]` and rendered the empty state. The run also navigated home → profile → watchlist. A direct normalization check accepted the prior numeric-array format, deduplicated mixed numeric/string codes, and reduced malformed/non-array input to an empty list. The local preview emitted the existing Vercel Insights script 404; no watchlist-specific page errors or console errors occurred.

**Hosted status:** Watchlist navigation, save/remove behavior, hosted cache behavior, and deployment remain unverified on Vercel because deployment was not requested.

### 8. P2: Player pages explain the data less than they help make a decision

**Observed live and in source.** The valid profile has stats, a long fixture list, match history, and season history. Its introduction repeats the list of available data. It does not provide a concise interpretation or a next action such as a relevant alternative or comparison.

**Why it matters:** Raw FPL data is available elsewhere. A visitor needs a reason to bookmark this interpretation or share this page.

**Change:** Add a brief summary based on verified inputs: recent minutes, form context, price, ownership, and the next three opponents. Explain what supports a choice and what makes it uncertain. Add links to genuinely comparable players at a similar position and price. Show the next three to five fixtures first, with the remaining schedule available on request.

Do not invent injury news, a buy/sell recommendation, or predictive certainty from descriptive statistics. Distinguish transfer popularity from player quality. Label model rankings and explain their inputs; homepage position lists currently select a scored subset before applying the chosen sort at `pages/index.vue:585`.

**Acceptance:** A reader can identify the player's relevant strengths, limitations, and next comparison without scanning every card. Every summary fact matches the displayed data and refreshes with it.

Google recommends original analysis that adds value beyond reproducing source material. [Helpful content guidance](https://developers.google.com/search/docs/fundamentals/creating-helpful-content).

### 9. P2: Build search entry pages around real weekly questions

**Source evidence and growth hypothesis.** The route inventory contains a homepage and individual player pages, but no public fixture planner, budget-player directory, comparison destination, or editorial gameweek hub. These are candidate search intents; keyword volume and ranking difficulty have not been measured.

Start with three maintainable destinations rather than hundreds of near-identical pages:

| Proposed destination | Visitor question | Minimum useful content | Next action |
| --- | --- | --- | --- |
| `/fixtures` | Which teams have favorable upcoming fixtures? | Next three/five gameweeks, home/away, explicit difficulty legend, current update time | Open a team's relevant players |
| `/players` | Which players fit my position and budget? | Fast position/price filters, minutes and availability, shareable filter state | Open or save a player |
| `/gameweek` | What should I check before this deadline? | Deadline, a small explained shortlist, uncertainty and links to supporting stats | Compare or save a shortlist |

Build fixtures and browse first if there is no weekly writing capacity. Add the gameweek page only with an owner for updates. An evergreen explanation of how to find a manager ID can support the existing homepage form.

Later, test one comparison page pattern only when comparisons actually help. Do not index every player pair or every filter combination. Stable, useful landing pages should have their own titles, canonicals, crawlable links, and sitemap entries. Use dated archives only when their historical content is preserved and useful.

For positioning context, [FPL Team](https://fpl.team/) already promotes transfer planning, live ranks, and predictions. That is evidence of an established product offer, not evidence of its traffic. FantasyPL should test clarity and fast beginner decisions before trying to match every feature.

### 10. P2: Trust and sharing need more support

**Source and live evidence.** The header says FantasyPL while metadata/footer use FPL Insights. The footer contains copyright only. All sampled pages use the same social image. Player and manager data lack a clear visible freshness statement in the inspected areas.

**Change:** Choose one public name and apply it consistently. Add concise About, contact, data-source, and methodology information, including the site's independent status if accurate. Show a last successful data update time, separate from a ticking deadline clock. Provide a share button and useful per-page preview images after core pages are stable.

Manager predictions need explicit availability and provenance. `pages/manager/[id].vue:468` tolerates a failed prediction request, while `components/PlayerCardPick.vue:61` still labels the area Predicted. `composables/usePremiereLeague.ts:463` fetches an external provider. Verify current data shape, season/gameweek, and failure handling before promoting predictions.

**Acceptance:** A visitor can identify who maintains the site, where the numbers come from, and when they were updated. A shared player or fixture link opens the relevant destination with accurate preview text and image. Missing predictions are explained rather than blank.

### 11. P2: Fix small interaction and readability problems

**Source evidence, with live visual support.** Homepage manager submission navigates directly from its input at `pages/index.vue:30`; the empty button is styled as inactive without a real disabled state. Small uppercase labels recur across cards. Fixture difficulty appears as `Diff` and a number in `components/PlayerFixtureCard.vue:40`.

**Change:** Validate and trim numeric manager IDs, use real form states, and explain invalid input before navigation. Give the player search a persistent programmatic label. Increase critical label readability, reduce excessive letter spacing, explain difficulty in text, and verify focus order and contrast with actual rendered colors. Add a main landmark and skip link to the shared layout.

**Acceptance:** Empty and malformed form submissions produce helpful inline feedback. Keyboard users can search and open a player. At 200% zoom, controls remain usable. Difficulty remains understandable without color. Verify text contrast and controls at mobile size before claiming WCAG conformance.

### 12. P2: Make the indexing purpose of utility routes explicit

**Source evidence.** Outside the excluded route, `/test`, `/instagram`, and `/fifa` exist. `/test` includes a debug-style fetch display. The latter two use page metadata titles but do not declare route-specific SEO through `useSeoMeta` in the inspected code. They are absent from the sitemap, but absence from a sitemap is not an indexing rule.

**Change:** Confirm which routes are intended public products. For internal utilities, plan authentication if needed and `noindex` for search exclusion. For a deliberately public utility, provide useful copy and distinct metadata. Treat the browser-local watchlist as a utility rather than an acquisition landing page. Do not apply broad route rules that touch the excluded scheduler.

**Acceptance:** Each non-excluded route has an explicit public/indexable or utility policy, verified in its actual HTML and access behavior. Noindex is not access control, and robots blocking should not prevent crawlers from seeing a noindex instruction.

## Distribution plan

Use a small weekly publishing routine connected to the tool. This is proposed work; nothing has been posted or scheduled.

- Before the deadline, publish one useful fixture or player comparison with a specific explanation and uncertainty. Link to the exact supporting page instead of sending everyone to the homepage.
- After the gameweek, revisit the same comparison and explain what happened. Keep a record of misses as well as successes. This builds a reason to trust later analysis.
- Share useful answers in relevant FPL discussions only where the community permits promotion. Lead with the answer. Avoid repeated bare links and mass posting.
- Test one creator collaboration around a shareable fixture view or comparison that their audience already asks for. Personal outreach requires separate authorization.
- Use consistent campaign tags to distinguish source, medium, and content. Measure referred visitors who actually use a player, fixture, or watchlist feature.

Run each channel experiment across four gameweeks where practical. Continue channels that produce useful visits or returning users. If clicks arrive but visitors do not use the tool, improve the destination before increasing posting volume.

A custom domain can help brand recall but is not a guaranteed ranking improvement. Decide on the name/domain before a major content push if possible. A later move requires redirects, canonical and sitemap updates, and verification in Search Console. No purchase or migration is part of this audit.

## Implementation sequence

Estimates are focused developer effort, not calendar guarantees. They assume existing data can support the proposed pages and exclude account verification, external approvals, editorial research, and deployment waiting time.

| Phase | Work | Main files or boundaries | Estimate | Completion gate |
| --- | --- | --- | --- | --- |
| 1, first few days | Repair public origin, sitemap, player aliases, and missing-player handling | Sitemap/robots routes, `useCanonicalUrl`, `usePlayerRoute`, player page and API | 1–2 days | Local route checks pass; separately verify public responses after an authorized release |
| 1, alongside fixes | Verify Search Console and available analytics; record baseline | Existing analytics plugin, future small event composable if supported | 0.5–1 day plus verification wait | Known test visit and baseline report; corrected sitemap accepted for processing, not assumed indexed |
| 2, alongside early improvements | Build the admin-backed blog and launch the first reviewed transfer article | See BLOG_GROWTH_PLAN.md for storage, admin, generation and public-page stages | 6–10 development days for all three data-led formats, plus editorial time | Durable drafts, verified evidence, explicit publish, public HTML and article discovery pass |
| 2, week 1–2 | Move player search up, compact the deadline, explain manager IDs, validate input | Homepage, countdown, shared navigation; extract focused components/composables | 1–2 days | First-screen mobile search and keyboard journey pass |
| 2, week 1–2 | Reduce initial data and image work | Store, public data response design, repeated cards | 1–3 days | Measured reduction with identical useful data; shared consumers remain compatible |
| 3, week 2 | Repair watchlist, add save controls and empty state (local correction complete 6 September 2026) | Watchlist page/card, dedicated composable/store, profile, layout | 1–2 days | Local add/reload/remove and malformed-storage checks pass; hosted verification remains |
| 3, week 2 | Add data freshness, prediction states, source/about information | Data handlers, profile/manager presentation, footer | 1–2 days | Accurate timestamps and explicit missing-data behavior |
| 4, weeks 3–4 | Build fixtures and player browse pages | New thin pages backed by reusable filter/fixture composables; sitemap additions | 3–5 days | Useful server-rendered landing pages; tested filter state and mobile use |
| 4, after core pages | Add concise player interpretation and related links | Player summary and comparison components, existing profile | 1–2 days | All claims match source data; meaningful onward actions |
| 5, weeks 4–8 | Test a maintained gameweek page, sharing, and distribution | One editorial/data page, social metadata, campaign reporting | 1–3 development days plus weekly content work | Four-gameweek review of acquisition, useful visits, and return behavior |
| 6, weeks 8–12 | Expand only the pages and channels that show demand | Determined by Search Console and usage evidence | Scope after review | Decision tied to observed queries and visitor behavior |

Dependencies: fix identity and indexing before submitting the sitemap; establish measurement before the homepage experiment; repair the watchlist before promoting it; define data freshness before publishing decision summaries; prove useful landing pages before scaling distribution.

Keep Nuxt pages focused on composition. Put URL logic, saved-player state, filtering, and data formatting in small shared composables or stores. Use Nuxt UI where appropriate and Tailwind for layout, maintaining full-width inputs at both component root and inner-control level.

## Measurement and decision rules

Start with the first complete 28-day baseline, while reviewing deadline-relative gameweek windows. FPL demand changes around deadlines and breaks, so compare similar periods and annotate releases.

| Metric | Definition | Decision it supports |
| --- | --- | --- |
| Search discovery | Search Console impressions, clicks, CTR and queries by landing page | Which real questions deserve better pages |
| Indexing quality | Submitted canonical URLs, indexing states, duplicate and soft-404 reports | Whether crawl fixes reached search systems |
| Useful first visit | Sessions with a successful player open, fixture interaction, or successful team open / eligible landing sessions | Whether homepage and landing pages help visitors start |
| Save rate | Successful player saves / player-profile sessions | Whether the shortlist offers value |
| Return behavior | Returning visitors or an available consent-respecting cohort measure across gameweeks | Whether the site earns another visit |
| Referral quality | Useful visits by campaign/source, alongside total referred visits | Which distribution work deserves more time |
| Reliability | Data fetch failures and age of last successful data | Whether visitors can trust a deadline visit |

If supported by the chosen analytics plan, add `player_search_result_open`, `manager_open_success`, `watchlist_add`, `watchlist_remove`, `fixture_filter_change`, and `share_link_copy`. Count successful results rather than only clicks. Do not collect manager IDs, manager names, or raw search text as custom event properties. Review automatic manager-route pageview handling as part of analytics setup.

There is no defensible percentage traffic-growth target without a baseline. The first month succeeds if the discovery defects are fixed, measurement works, search is easy to reach, and the watchlist works. After that, choose targets using observed volume. At low traffic, avoid underpowered A/B tests; compare sequential gameweek cohorts and gather a few direct usability observations.

## Verification checklist for implementation

- [ ] Production origin is configured once and is consistent across sitemap, robots, canonical, and social URL metadata.
- [x] Local sitemap, robots, and canonical generation use the validated configured public origin; hosted verification is still pending.
- [ ] All sitemap locations are canonical HTTPS public URLs, including after cache revalidation.
- [x] Local player alias checks return 301 to one preferred slug, and the preferred page returns one matching canonical and `og:url`; hosted verification is still pending.
- [x] Local player-detail checks distinguish valid, missing, malformed, and controlled upstream-failure responses; hosted verification is still pending.
- [ ] Valid players return 200; aliases redirect; missing players return 404; outages do not impersonate missing players.
- [ ] Search Console ownership and analytics collection are verified separately from code installation.
- [ ] Mobile search is visible immediately and supports keyboard operation.
- [x] Local save/remove survives reload with exact player matching, one card per saved player, and no watchlist debug output; hosted behavior remains pending.
- [ ] Homepage payload and image behavior improve in repeatable measurements.
- [ ] Player summaries, fixtures, and predictions show accurate context and freshness.
- [ ] Utility indexing policy excludes the scheduler from all proposed changes.
- [x] The local P1 sitemap and player-route checks plus `npm run build` pass; hosted verification and other implementation checks remain pending.
- [ ] Local preview, hosted behavior, authenticated manager use, and physical-phone checks are recorded separately.
- [ ] Commit, push, publishing, and deployment occur only if explicitly requested.

## What to defer

Do not start with a visual rebrand, paid acquisition, an AI chatbot, native apps, a large CMS, paid keyword tooling, hundreds of generated articles, or accounts solely for watchlist sync. Do not spend time on meta keywords or sitemap priority values. A structured-data pass can follow the useful content, but should describe visible facts and should not promise rich-result eligibility.

The owner has chosen an admin page using AI to publish data-led articles. Remaining decisions are the primary audience, available weekly review time, article storage/auth provider, desired public name/domain, current analytics plan, and the public purpose of the non-excluded utility routes. None blocks the initial sitemap, canonical, missing-player, or measurement work. A blog does not need to wait for every proposed tool page.
