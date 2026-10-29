# FantasyPL visitor growth audit and implementation plan

Audit date: 6 September 2026. Public site at that audit: [fantasyleague.vercel.app](https://fantasyleague.vercel.app/).

Follow-up: the owner requested a blog with an AI-assisted admin publishing workflow. [BLOG_GROWTH_PLAN.md](BLOG_GROWTH_PLAN.md) adds a four-site competitor comparison, article strategy, and implementation scope. Its blog schedule takes priority over the later editorial timing in the initial plan below.

SEO follow-up, 29 October 2026: [IMPROVE_SEO.md](IMPROVE_SEO.md) now owns the phased SEO implementation and current search verification evidence. It covers indexing, structured data, fixture and club pages, player browsing, player interpretation, and article/tool links. Search Console access and sitemap submission are now verified, and sampled hosted URLs use the `www` canonical origin. See that guide for the exact checks and limits. The 27 October status and older findings below remain dated evidence; their SEO sequence is superseded by the new guide.

## Current priorities and open work, 27 October 2026

This is the site-wide roadmap. The statuses below combine local source review with the read-only hosted and account checks on 27 October. Detailed requirements and evidence remain in the owning documents. Earlier observations below describe their dated checkpoints, not the current hosted state.

| Priority | Current status | Next work or verification |
| --- | --- | --- |
| Search discovery | The live apex redirects to `www`, while the current deployed metadata and sitemap still use the apex. Local code now uses `https://www.sportsync.in`, including when an older apex environment override is set. A controlled outage now returns a player-page 502 with recovery; the live numeric alias and missing-player response were checked separately. | Release only when authorized, then verify canonical/social tags, robots, sitemap, calendar, redirects and cache revalidation on the hosted site. Decide whether the old Vercel host should redirect. |
| Measurement | Vercel reports 102 visitors and 286 pageviews for 29 September–26 October UTC. Search Console access has not been verified. | Confirm a known visit, establish Search Console access, and use comparable periods before claiming visitor growth. |
| First visit and return | Isolated Brave checks passed live search at mobile and desktop sizes and a mobile watchlist save, reload and remove journey. | Check physical devices and comparable homepage payload/image measurements. See [HOMEPAGE_UX_PLAN.md](HOMEPAGE_UX_PLAN.md). |
| Blog | The live blog, one published article, its image, sitemap entry and RSS feed returned successfully. Production uses the configured Convex development deployment. Local publishing checks now validate evidence age, season and gameweek. | Verify the authenticated draft-to-publish journey, production backend strategy and content quality. Unattended publishing and article-to-Instagram automation remain planned. See [BLOG_GROWTH_PLAN.md](BLOG_GROWTH_PLAN.md). |
| Daily recommendations | The 27 October buy snapshot was reviewed; the live trade review failed with JEV HTTP 400 and fallback results appeared. Local trade review now identifies each candidate and uses smaller batches. | After an authorized release, verify the next scheduled reviewed trade snapshot and provider response. The precise cause of the earlier 400 is not yet confirmed. See [HOMEPAGE_UX_PLAN.md](HOMEPAGE_UX_PLAN.md). |
| Later growth | Dedicated player/fixture browse pages, player interpretation, and clearer source/methodology information remain proposals. | Prioritize them using observed demand. Add recent article selections when published content and the relevant page integrations are ready. |

On 27 October, Vercel showed the apex domain configured with a 308 redirect to `www.sportsync.in`; the previous Vercel host also served the site without redirecting. The inspected live deployment's Git revision matched the source revision before the local changes. Its sitemap listed 672 URLs, all using the apex host. Local code now aligns the canonical origin with the `www` redirect; no hosted settings were changed.

The working audience, sustainable editorial time/cadence, and purpose of `/test`, `/instagram`, and `/fifa` still need owner decisions. The scheduler remains a separate workflow; its checks and integration rules are in [docs/instascheduler/AGENTS.md](docs/instascheduler/AGENTS.md).

Verification, 27 October: the original check reported 51 project-wide TypeScript diagnostics; the direct TypeScript and Convex checks now pass locally on Node 24. The local build, focused synthetic security/evidence/trade checks, and isolated Brave player-outage recovery passed. Local HTTP checks found `www` canonical URLs in the player page, sitemap, robots and calendar. Live public routes, Vercel settings and read-only Convex logs were checked before these local changes. No model-provider request, article publication, posting, deployment or account change was made. Search Console, authenticated hosted workflows, native calendar clients and physical devices remain unverified.

## Recommendation

The recommendation and findings below preserve the original 6 September audit. Use the current status above before treating an original finding as still open.

Fix search discovery and the first useful visit before investing in promotion. Then build a repeatable reason to return before each gameweek deadline.

The strongest direction is a fast, understandable FPL decision tool for casual managers. The README describes the site as a simplified view for newcomers. This remains a working audience assumption, not a confirmed audience choice. The original audit had no Search Console or traffic figures and did not claim rankings, conversion rates, or projected gains. A later Vercel baseline is recorded in the current status above.

At the original audit, the site delivered player data in server-rendered HTML and had readable player URLs. The observed weaknesses were a broken live sitemap, duplicate player URLs, a heavy homepage, buried player search, and an unfinished watchlist. Later local corrections and outstanding hosted checks are recorded below and in the current status above.

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

**Earlier hosted status:** The public response and cache revalidation had not been verified at this checkpoint. See the current status above for the later sitemap check and remaining host mismatch.

Google documents that it crawls sitemap URLs as listed and recommends canonical absolute URLs. [Sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).

### 2. P1: Multiple addresses claim to be the same player's canonical page

**Verified live.** `/player/erling-haaland-411` and `/player/411` both returned 200 with Haaland content. Each emitted a canonical pointing to itself.

**Why it matters:** Shared links and discovery can accumulate against several addresses for one player. This creates avoidable ambiguity about the preferred URL.

**Original source, 6 September 2026:** `composables/useCanonicalUrl.ts:10` used the incoming path. `composables/usePlayerRoute.ts` extracted the trailing ID and generated the preferred name slug, but the player page did not normalize aliases to it.

**Change:** Resolve the player, compute one preferred URL with `getPlayerRoute`, and permanently redirect numeric and incorrect-name aliases to it. Generate canonical and social URL metadata from that resolved identity. Decide how seasonal ID reuse and renamed players are handled before expanding the indexed catalog; do not silently make an old player's URL describe a different person.

**Acceptance:** Numeric and wrong-slug aliases redirect to one destination. That destination returns 200 and exactly one matching canonical. Query parameters do not create competing canonical pages. Test old saved URLs explicitly.

Google describes redirects and canonical signals as ways to consolidate duplicate URLs. [Canonical guidance](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls).

**Local correction completed (6 September 2026).** `pages/player/[id].vue` now resolves the route's trailing player ID against the current bootstrap catalog and permanently redirects numeric and wrong-name aliases to `getPlayerRoute(player)`. The redirect uses HTTP 301 semantics during server rendering and replaces the URL during client navigation. `useCanonicalUrl` accepts the resolved player path, and the player page uses it for both the canonical link and `og:url`. On the local built server, `/player/411`, `/player/wrong-name-411`, and `/player/411?utm_source=test` each returned HTTP 301 with `Location: /player/erling-haaland-411`; that preferred URL returned HTTP 200 with exactly one canonical and one `og:url`, both set to `https://fantasyleague.vercel.app/player/erling-haaland-411`. Unknown-player handling is recorded under P1 #3 below.

**Earlier hosted status:** Alias redirects and metadata had not been checked at this checkpoint. See the current status above for the later live checks.

### 3. P1: Invalid players return successful loading pages

**Previously verified live.** `/player/99999999` returned 200 with the title `Loading player... FPL Stats, Fixtures & Ownership | FPL Insights` and a self-canonical.

**Why it matters:** Visitors cannot tell whether to wait or leave. Crawlers receive a success response for missing content, creating a soft-404 risk.

**Original source, 6 September 2026:** `pages/player/[id].vue:252` did not expose the detail request's error state; the computed player fell back to loading text. `server/api/players/[id].ts:3` and `composables/usePremiereLeague.ts` could return null or error-shaped data.

**Change:** Separate pending, missing player, and temporary upstream failure. Return a real 404 for a confirmed missing player, with a route back to search. Return an appropriate temporary failure state for upstream outages, with retry or a clearly dated last successful response. Do not classify every API outage as a missing player.

**Acceptance:** Known valid, invalid, malformed, and upstream-failure cases produce distinct UI and correct HTTP behavior. No settled missing-player page retains a loading title.

**Local correction completed (6 September 2026).** `getPlayerInfoDetails` now lets upstream failures reach the player API route for classification instead of converting them to `null`. `server/api/players/[id].ts` rejects malformed IDs with a 404, maps a confirmed upstream 404 to `Player not found`, and maps other upstream or unusable responses to a 502 temporary-failure response. `pages/player/[id].vue` now tracks detail and bootstrap loading separately, renders explicit loading, not-found, invalid-link, and temporary-failure states, sets the SSR response status, removes the loading title from settled missing pages, links back to player search, and offers `Try again` for temporary failures.

On the local built server, `/api/players/99999999` returned HTTP 404 with `Player not found`, `/api/players/not-a-player` returned HTTP 404 with `Invalid player URL`, and the corresponding page routes returned HTTP 404. Their rendered titles were `Player not found | FPL Insights` and `Invalid player link | FPL Insights`; both included `Search players` and neither included a loading title. `/player/411` continued to return HTTP 301 to `/player/erling-haaland-411`, and the preferred route returned HTTP 200. A controlled local preview with an unreachable upstream proxy returned HTTP 502, rendered `Player data temporarily unavailable` and `Try again`, did not render `Player not found`, and did not retain a loading title. The local production build, diff check, and UI detector passed.

**Earlier hosted status:** Player responses and outage behavior had not been checked at this checkpoint. See the current status above for the later live and controlled-local checks.

### 4. P1: Search visibility and useful visits have no available baseline

**Original audit evidence.** No Search Console figures were supplied. `plugins/analytics.client.ts:1` injected Vercel Analytics, but the inspected visitor code had no custom event calls. Dashboard access and actual collection were not checked.

**Why it matters:** Without measurement, a redesign can look successful while attracting the same number of visitors or reducing useful visits.

**Change:** Verify or create a Search Console URL-prefix property for the current HTTPS site. If a property already exists, use it. Establish pageviews, referrers, landing pages, search clicks, impressions, and conversion events before changing the main journey. Verify one known test visit appears in the chosen analytics tool.

Vercel currently limits custom events to Pro and Enterprise. Check the actual plan before choosing that route. Start with available pageview reports if necessary; do not buy or add a second analytics system automatically. [Vercel custom events](https://vercel.com/docs/analytics/custom-events).

24 October 2026: the owner confirmed Vercel Hobby and requested manager sharing without a paid service. Local implementation adds a Share button with native sharing, clipboard fallback, and a selectable-link fallback if clipboard access fails. Cancelling native sharing exits without copying. The existing Convex backend stores one aggregate per UTC day for button clicks and successful programmatic copies; it stores no manager IDs, names, visitor identifiers, or raw share-event history. These are action totals, not distinct people or confirmed message deliveries. `/admin/sharing` and its server-authorized API report the last 30 UTC days. The counter reuses the private content database configuration and `CONTENT_SERVICE_TOKEN`; no Vercel custom events, new dependencies, paid plans, or billing changes were added.

Local verification: nine isolated sharing checks passed, along with in-memory counter authorization, daily increments, reporting bounds and cross-origin rejection with zero database calls. Convex TypeScript and four affected Vue components compiled. The local admin statistics endpoint returned 401 without login, and an invalid event returned 400. Connected Brave initially showed Share on a resolved manager page; a stale component-resolution warning led to explicit imports, but the final mobile recheck timed out. Physical-device share sheets, final responsive appearance, authenticated statistics display, and durable backend recording remain unverified. No Convex deployment or live counter writes were performed. Existing local environment files did not provide `NUXT_ADMIN_GITHUB_ID`, so authenticated local access also needs that existing admin configuration completed. Automatic approval review rejected the live cross-origin POST check because it could alter persistent counters; the check was completed entirely in memory instead.

**Acceptance:** A documented baseline, a verified test visit, and a repeatable weekly report. If search data is not yet available, record that explicitly rather than reporting zero demand.

### 5. P1: The useful player search is buried beneath summary content

**Verified live.** At the top of the page, the search input began about 1,338 pixels down on desktop and 2,007 pixels down at 390 × 844. A newcomer first sees a manager ID form, a large countdown, a previous/current gameweek summary, and fixtures.

**Why it matters:** The advertised player tool takes effort to find. Visitors who do not know their manager ID have no obvious first action in the first screen.

**Source:** `pages/index.vue:14`, `:30`, and `:74` establish this order. The global navigation exposes only the home brand.

**Change:** Put player search directly after a shorter explanation of the weekly task. Keep manager lookup as a secondary action with instructions for locating the ID. Reduce the deadline to a compact, useful date/time block. Offer a direct route to the current gameweek's decision page when that page exists. Keep the existing color identity.

**Acceptance:** Search is visible in the first 844-pixel mobile viewport with no keyboard open. New visitors can find a player without knowing a manager ID. Compare player-open rate with the baseline; do not equate moving a control with proven growth.

**Local implementation status (6 September 2026).** The initial homepage revision passed the local hierarchy and interaction checks in [HOMEPAGE_UX_PLAN.md](HOMEPAGE_UX_PLAN.md). A later revision moved search into the shared header. Check the current search surface separately; hosted behavior and player-open measurement remain unverified.

### 6. P1: The homepage sends far more content than its first screen needs

**Measured live.** The downloaded homepage HTML was 2,539,782 bytes. The embedded Nuxt data script accounted for 1,817,421 bytes. The inspected DOM contained 306 image elements and seven groups of 20 player links.

These are HTML and element counts, not compressed browser transfer totals or 306 unique image downloads. A local gzip estimate was approximately 254 KB for the HTML. One request took 2.92 seconds, which is not a representative speed benchmark.

**Source:** `pages/index.vue:156` onward renders repeated card carousels, and `:583` onward selects 20 players per position. `stores/players.ts:20` fetches the full bootstrap object. `components/PlayerCardNew.vue:88` and `components/PlayerPerformanceCard.vue:124` lack image lazy-loading attributes. A `Lazy` component name alone does not defer every rendered image.

**Change:** Profile the serialized payload before changing data contracts. Return only fields needed by the public journey, show a smaller initial player selection, and move complete lists onto useful browse pages. Lazy-load below-fold images and preserve their dimensions. Keep the main content server-rendered. Preserve fields required by other consumers, including excluded routes, rather than blindly shrinking a shared endpoint.

**Acceptance:** Record before/after HTML, payload, image requests, and a mobile performance trace on the same route and conditions. Aim initially to halve the homepage HTML and embedded payload without breaking search or cards; this is a project budget, not a Google requirement. Field targets, when enough data exists, are LCP ≤2.5 seconds, INP ≤200 milliseconds, and CLS ≤0.1 at the 75th percentile. [Web Vitals](https://web.dev/articles/vitals).

**Local implementation status (6 September 2026).** A homepage-only data projection preserves the full shared bootstrap contract while reducing the local SSR homepage from 2,550,303 to 447,235 bytes and the largest Nuxt data script from 1,818,063 to 398,188 bytes. The corrected visual pass renders 6 player portraits and 18 club badges with fixed dimensions and lazy loading, while server-rendered profile links fall from 140 to 6. This is not a compressed-transfer, field-performance, or hosted measurement; see [HOMEPAGE_UX_PLAN.md](HOMEPAGE_UX_PLAN.md) for the complete local record.

29 October 2026: a further local payload reduction covers both the homepage and player profile, with viewport-triggered secondary requests, portrait preloads and Vercel ISR configuration. Current measurements, checks and hosted limitations are in [HOMEPAGE_UX_PLAN.md](HOMEPAGE_UX_PLAN.md). The new player directory and its URL policy are recorded in [IMPROVE_SEO.md](IMPROVE_SEO.md).

### 7. P1: The watchlist cannot yet support repeat visits

**Initial live and source evidence.** Before this correction, the inspected live watchlist showed only its title and the site shell. The navigation link was commented out in `layouts/default.vue:18`. The current main player profile and card had no visible save action in the inspected journey.

The initial `pages/watchlist.vue:7` rendered raw player data when populated. At `:29`, it stored a JSON string directly as watchlist state and then used substring membership. The initial `components/PlayerWatchlistCard.vue:2` rendered debug content and contained overlapping legacy/current card markup. At `:311`, it parsed storage without handling an empty or malformed string. Populated live rendering was not tested, so these were source-confirmed defects rather than a claimed live save/remove failure.

**Why it matters:** A player shortlist is a natural reason to come back before the next deadline. The existing implementation cannot be promoted as a finished feature.

**Change:** Centralize saved player codes in a small composable or store, validate stored arrays, and use exact membership. Render one card per saved player, add a helpful empty state, and add accessible save/remove controls to the actual player journey. Expose Watchlist in navigation. Keep the behavior browser-local without implying account sync, and avoid repeating storage details across the saved-player journey.

**Acceptance:** Add two players, reload, remove one, and navigate between homepage/profile/watchlist. Confirm exact membership, no duplicate cards, and recovery from missing or malformed storage. Test the existing saved format before migrating it. Avoid creating accounts just to launch this improvement.

**Local correction completed (6 September 2026).** `composables/useWatchlist.ts` now owns the `savedWatchlist` browser-local state, accepts the existing numeric and string code formats, normalizes exact codes, removes duplicates, and repairs malformed or non-array values. `components/PlayerWatchlistButton.vue` provides the accessible save/remove control used on player profiles and saved-player cards. `pages/watchlist.vue` now has a browser-local empty state, loading and data-failure states, one card per current saved player, and `noindex,follow` utility metadata. `components/PlayerWatchlistCard.vue` is a single focused card without debug output, and `layouts/default.vue` exposes the route in navigation.

The local production build returned HTTP 200 for `/watchlist`, rendered `Watchlist | FPL Insights`, included the watchlist states, and emitted `noindex`. An isolated Brave run at 390 × 844 covered the requested journey: `/player/411` redirected to `/player/erling-haaland-411`; saving Haaland stored `["223094"]` and survived reload; saving a second current player stored `["223094","154561"]` and displayed two saved cards; removing the first left `["223094"]` and one card after reload; and replacing storage with `not-json` repaired it to `[]` and rendered the empty state. The run also navigated home → profile → watchlist. A direct normalization check accepted the prior numeric-array format, deduplicated mixed numeric/string codes, and reduced malformed/non-array input to an empty list. The local preview emitted the existing Vercel Insights script 404; no watchlist-specific page errors or console errors occurred.

**Copy cleanup (6 September 2026).** The profile, watchlist page, and saved-player cards no longer repeat browser-storage notices. Save/remove behavior and local persistence are unchanged; hosted behavior remains unverified.

**Visual follow-up (23 October 2026).** `pages/watchlist.vue` now follows the homepage's portrait-card style, with position filtering, sorting, deadline context, and a three-gameweek fixture run for each saved player. `components/WatchlistPointsChart.vue` groups player history by completed gameweek and renders a labeled six-gameweek bar chart, including double-gameweek points. Fixture and history details load when a card nears the viewport through the cached `/api/players/:id` route; no chart dependency was added. The watchlist now refreshes the Pinia bootstrap on SPA visits while reusing the SSR payload during hydration, preventing a long-lived store snapshot from limiting either chart history or fixture gameweeks. The production build and `git diff --check` passed. The local preview returned HTTP 200 for `/watchlist` with the expected title and `noindex`; current API data reported completed GWs 2–7, player history for GWs 1–7, and player fixtures for GWs 8–10. The build ran on installed Node 22.23.1 although `package.json` declares Node 24.x, and still reports unresolved font paths and Tailwind sourcemap warnings. Responsive browser interaction was not verified because no connected Brave session was available; hosted behavior remains unverified.

**Data-loading correction (24 October 2026).** Following reports of truncated history and missing fixtures until a hard refresh, the watchlist now renders its own `useFetch` bootstrap response rather than relying on a shared Pinia store updated as a request side effect. Bootstrap and player-detail requests revalidate browser caches. The chart now includes the last seven completed gameweeks instead of six. A player-detail response must include both history and fixture arrays; incomplete responses show the existing error/retry state. Local read-only API checks returned completed GWs 1–7, player history for GWs 1–8, and upcoming player fixtures. The scoped diff check passed. No build or automated tests were run for this small fix, and the normal-navigation journey has not been browser-verified.

**Search access (25 October 2026).** The watchlist navbar now offers the homepage search icon. Removed the separate Find players button. Browse players and Search current players use the existing lime accent and dark border styling and open the shared search surface without leaving the watchlist. Shared component details are in `HOMEPAGE_UX_PLAN.md`. Source review and scoped diff checks only; no tests, build, browser, or hosted verification for this small change.

**Earlier hosted status:** The watchlist journey had not been checked at this checkpoint. See the current status above for the later live browser check; hosted cache behavior remains open.

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

**Local metadata update, 24 October 2026.** The owner selected OG concept 2 and approved `https://sportsync.in` as the canonical origin. The shared origin default now uses that host, so existing canonical, robots, and sitemap consumers follow it. The sitemap cache name changed to avoid reusing the previous host's cached XML. Shared Open Graph and Twitter tags use the configured origin and the new `public/og-transfer-count.png` banner, including image alt text, actual dimensions (1733 × 907), image type, website type, and site name. Homepage search metadata now describes player stats, fixtures, and transfer trends; social titles use “Make your next transfer count” and the homepage supplies `og:url`. The image displays `sportsync.in`; the public name remains FPL Insights. The earlier branding and trust recommendations remain open.

Verification for this small change is limited to source/diff review and checking the saved image's dimensions. No build or browser check was run. Deployment, Vercel domain attachment, the `NUXT_PUBLIC_SITE_URL` production setting, old-host redirects, and hosted metadata/cache checks remain pending. Historical live evidence elsewhere in this audit refers to the previous Vercel address.

**Change:** Add concise About, contact, data-source, and methodology information, including the site's independent status if accurate. Show a last successful data update time, separate from a ticking deadline clock. Provide a share button and useful per-page preview images after core pages are stable. The header and footer use different existing names; retain them until the owner requests a change.

**Manager estimate source check, 24 October 2026.** The older page and line references above are stale. Current manager cards use FPL's `ep_next` from the bootstrap snapshot for the next gameweek (`server/utils/manager-squad.ts`); `PlayerCardPick.vue` labels the gameweek and its title identifies FPL as the source or explains a missing value. The manager page no longer requests the third-party prediction endpoint described in the original observation. Local homepage and player-profile sources now display the FPL fetch time. Manager-page freshness and hosted verification remain open.

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

The original audit proposed considering a custom domain before a major content push. The owner initially approved `https://sportsync.in`; see the current status above for the `www` redirect and local canonical changes. Search Console verification remains open. A custom domain is not a guaranteed ranking improvement.

## Implementation sequence

This sequence and its estimates are the original proposal, not the current task list or a calendar commitment. Some local work has since been completed; use the status table above. Estimates exclude account verification, external approvals, editorial research, and deployment waiting time.

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
- [ ] Verify the current header search icon, panel, and keyboard operation on the hosted site.
- [x] Local save/remove survives reload with exact player matching, one card per saved player, and no watchlist debug output; hosted behavior remains pending.
- [x] Redundant browser-storage notices are removed from the profile, watchlist page, and saved-player cards; persistence behavior remains unchanged locally, and hosted verification remains pending.
- [ ] Measure current homepage payload and image behavior under comparable conditions, including the hosted release.
- [ ] Player summaries, fixtures, and predictions show accurate context and freshness.
- [ ] Utility indexing policy excludes the scheduler from all proposed changes.
- [x] The local P1 sitemap and player-route checks plus `npm run build` pass; hosted verification and other implementation checks remain pending.
- [ ] Local preview, hosted behavior, authenticated manager use, and physical-phone checks are recorded separately.
- Commit, push, publishing, and deployment occur only if explicitly requested.

## What to defer

Do not start with a visual rebrand, paid acquisition, an AI chatbot, native apps, a large CMS, paid keyword tooling, hundreds of generated articles, or accounts solely for watchlist sync. Do not spend time on meta keywords or sitemap priority values. A structured-data pass can follow the useful content, but should describe visible facts and should not promise rich-result eligibility.

The owner has chosen the public origin, the article storage/auth approach, and a Vercel Hobby plan was confirmed on 24 October; their current configuration still needs verification. Remaining product decisions include the primary audience, available weekly review time, and the public purpose of the non-excluded utility routes. The header and footer currently use different existing names; do not rebrand without an owner request. A blog does not need to wait for every proposed tool page.

Homepage visual follow-up, 6 September 2026: the owner rejected the sparse rows. Rich player cards, a compact utility area, an expanded recap, and matching player-profile styling are implemented locally. See HOMEPAGE_UX_PLAN.md for the current direction and verification; earlier measurements remain historical.

### Player detail simplification, 6 September 2026

The owner requested plain values and a page that is easier to scan. The local player profile now uses aligned label/value pairs instead of stat tiles and booking badges. The portrait and existing dark/green identity remain; all stats precede the portrait on mobile. Fixtures, recent matches, and previous seasons use divided rows without individual card backgrounds or circular scores. Labels are larger and use normal spacing. Recent matches show the gameweek instead of an internal fixture ID, display points once, and spell out Home/Away. Previous-season playing time uses exact minutes. All three scrolling lists have accessible names, keyboard focus, and visible focus outlines.

Changes are confined to `pages/player/[id].vue` and its four dedicated presentation components. The data handlers, preferred player URLs, metadata, and watchlist implementation are unchanged. Existing unrelated work was preserved.

Verification: the production build and `git diff --check` pass. Connected Brave checks on the local built Haaland profile at 390 × 844 and 1280 × 900 found no document horizontal overflow, no decorated definition values, and no captured browser warnings/errors. Saving by keyboard persisted after reload; removal restored the Save control. Page Down scrolled the focused fixture region. A light-preference check confirmed the existing dark player surface remains readable. The 320-pixel check exposed cramped stat columns, corrected and confirmed with a two-column layout at 320 pixels and three columns at 390 pixels, both without document overflow. Hosted Vercel behavior and physical-device execution remain unverified; no release actions were performed.

23 October 2026 local homepage follow-up: budget/position filtering, factual Differential/Most sold/Most bought sections, saved-player return links, six upcoming matchups, and three-gameweek player fixture runs were implemented. The owner requested no homepage AI calls, fewer initial inputs, full viewport use, and full player names. The later approved daily JEV job runs separately from homepage requests. See `HOMEPAGE_UX_PLAN.md` for current ranking rules, checks, and remaining hosted verification.

### Manager page loading, 24 October 2026

The owner requested faster `/manager/[id]` loading. `useManagerPage` now starts separate manager and squad requests with lazy client navigation, so the summary can appear while the squad loads. Direct page requests retain server-rendered summary and squad content. The squad endpoint starts the catalogue and manager lookup together, requests picks as soon as the manager's gameweek is known, and returns only the selected players and required fields. The full shared bootstrap response remains available to its other consumers. Manager details and picks use a 60-second cache without stale responses; picks remain distinct by manager and gameweek. Invalid inputs and failures return HTTP errors rather than cacheable success objects. Upstream manager/picks requests have a 10-second timeout and no automatic retry; the shared bootstrap fetch also has a 10-second timeout. A squad failure keeps the summary visible and offers a retry.

Local verification: `npm run build` and `git diff --check` passed. Built-server checks confirmed 15 selected players, 11 starters, four substitutes, matching captain, starting cost and season points, separate gameweek cache entries, and HTTP 400/no-cache for invalid manager or gameweek inputs. A repeat cached manager response took about 3 ms in one local sample. The sample squad response was 25,123 bytes uncompressed, replacing the 2,505,521-byte catalogue download during client navigation; the manager summary is still a separate response. These sizes do not establish hosted loading times.

Connected Brave checks covered 390 × 844 with a light preference and a desktop dark preference, keyboard team lookup, Gallery and Bench controls, and client navigation requesting manager/squad data without a bootstrap request. Blocking a squad request left the manager summary visible with the retry control; removing the block and retrying restored the squad. Hosted performance, cold server starts, and physical-device behavior remain unverified. No commit, push, or deployment was performed.

### Manager recommendations and portraits, 24 October 2026

At this 24 October checkpoint, manager pages showed an automatically generated **Recommendations** section once squad data was available. That version made a TypeSafe System One evaluation per page load without a response cache. Candidate swaps were filtered in code for same position, current availability, a 90-minute sample, exact budget and FPL's three-player club limit. Sale value was reconstructed from manager transfer history or the player's starting price, applying FPL's current profit/loss rule and excluding historical Free Hit transactions. A candidate had to be no worse on available form, points per game, and next-gameweek FPL estimate, and improve at least one; price was a feasibility check rather than a ranking goal. The interface used a shared portrait component on recommendations, pitch, bench, and gallery.

Current source review, 27 October: the manager recommendation endpoint reuses matching responses by fingerprint in server memory, coalesces matching in-flight requests, and supports a browser-stored response. A page reload does not necessarily create a new provider evaluation. This source review did not verify the live provider or hosted deployment; current planner and presentation details are in [DESIGN.md](DESIGN.md).

Local checks: `npm run build`, `git diff --check`, synthetic sale-price/Free Hit/affordability/performance-gate checks, and a live public FPL schema check reconstructing sale values for all 15 sample picks passed. The built manager route returned HTTP 200 with the recommendation loading section; an invalid recommendation ID returned HTTP 400 and `Cache-Control: no-store`. The UI detector reported no findings. No live model request was made. Connected-browser visual/keyboard verification and hosted Vercel verification remain open.

### Manager metadata and share image, 24 October 2026

`pages/manager/[id].vue` now emits manager-specific SSR title, description, canonical `og:url`, and large-card Twitter metadata. Nuxt OG Image v5 renders a manager-specific 1200 × 630 PNG with the current starting XI, formation, captain/vice-captain, and gameweek/season stats. Canonical and image origins use the configured `https://sportsync.in` site URL; generated images are cached for one hour.

Local verification: `npm run build` and `git diff --check` pass. Built HTML for manager 1 had one `og:image` and `twitter:image`, with canonical and `og:url` set to `https://sportsync.in/manager/1`. The local image route returned `200 image/png` at 1200 × 630, and its rendered template contained the manager/team details. Hosted Vercel and browser visual verification remain pending; no deployment was performed.

### Manager share-image layout correction, 24 October 2026

Owner review found the first generated image compressed the player rows and overlapped the stats. The template now uses fixed 1200 × 630 positioning, four explicit formation rows on a pitch surface, and one separated stat rail with overall points/rank, gameweek points/rank, captain, and vice-captain. The pitch divider sits between player rows. The manager API data was intact; the layout was the cause.

Local verification: final `npm run build` and `git diff --check` passed; the Impeccable detector returned no findings. Built-server checks for manager 5689801 returned one `og:image` and one `twitter:image`, canonical `https://sportsync.in/manager/5689801`, and a `200 image/png` at 1200 × 630. The rendered template contained all 11 starters and both captain details. The current FPL response for that ID differs in name/team from the submitted screenshot. Browser visual and hosted Vercel checks remain pending; no deployment was performed.

### Manager share-image simplification and club palette, 24 October 2026

The follow-up visual direction replaces that intermediate stat-rail composition with one full-bleed surface and no stat cards. The background uses the captain's stable FPL club code through the scheduler's `getInstagramClubTheme`; it falls back to the first starter's club. Light club-palette text and player markers stay high contrast. The image now shows only the team and manager names, one gameweek summary, formation, starting XI, total points, and compact overall rank. It removes the manager ID, separate captain/vice-captain rows, footer, and repeated headings.

Local verification: `npm run build` passed. Built-server checks for managers 5689801 and 1 returned valid 1200 × 630 PNGs with distinct club-dark backgrounds (`#381019` and `#082642`), all 11 starter names, and one each of `og:image` and `twitter:image`. The template contains one brand label and one rank label. Sample club text contrast exceeded 14:1; the Impeccable detector returned no findings. Hosted Vercel and browser visual checks remain pending; no deployment was performed.
