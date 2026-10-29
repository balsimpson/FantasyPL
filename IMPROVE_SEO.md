# FantasyPL SEO implementation guide

Created 29 October 2026. Public origin: `https://www.sportsync.in`.

## Purpose and ownership

Implement the owner's selected improvements in phases: measure indexing, add a fixture planner and club pages, add a player directory, improve player interpretation and related links, and connect focused articles to these tools. Include suitable structured data throughout.

This document owns the cross-page SEO sequence, new discovery-page requirements, structured-data requirements, and SEO verification evidence. It supersedes the older proposed SEO sequence in [SITE_GROWTH_AUDIT.md](SITE_GROWTH_AUDIT.md). The audit retains historical findings and wider growth priorities. [BLOG_GROWTH_PLAN.md](BLOG_GROWTH_PLAN.md) still owns editorial policy, publishing, evidence and admin security. [HOMEPAGE_UX_PLAN.md](HOMEPAGE_UX_PLAN.md) and [DESIGN.md](DESIGN.md) own homepage behavior and shared presentation. Follow [AGENTS.md](AGENTS.md) for repository rules.

The current task creates this guide only. The feature work below is planned. When asked to implement it, use the next incomplete phase and the user's requested scope. A local implementation request does not authorize deployment, article publication, Search Console changes, provider spending, or external account changes. Do not change the scheduler or enable unattended publishing as part of this plan.

## Verified starting point, 29 October 2026

These are dated observations from this chat, not guarantees about future deployments. Recheck only the evidence needed for the next change.

| Area | Evidence | Remaining work |
| --- | --- | --- |
| Search Console | The `sportsync.in` Domain property is accessible and the account is a verified owner. | Track indexing and useful search queries. No new property is needed for this work. |
| Sitemap | Submitted `https://www.sportsync.in/sitemap.xml` on 29 October. Google reported Success and 673 discovered pages: 669 player profiles, two articles, homepage and blog index. | Discovery is not indexing. Check later processing and inspect representative URLs. |
| Public origin | Live sitemap XML parsed successfully; all 673 locations used HTTPS `www.sportsync.in`. Live robots.txt advertised that sitemap. Homepage, blog index and one player profile returned 200 with matching `www` canonicals. | This sample does not verify every route, the calendar, social metadata, or cache revalidation. |
| Indexing | The report dated 23 October showed zero indexed pages and one crawled but not indexed page. Its example was the homepage, last crawled 24 October; validation had started 27 October. | Use URL Inspection for current evidence. This old report does not describe the result of today's submission. |
| Search baseline | The selected seven-day performance report showed three impressions and zero clicks; the chart contained 24–27 October. | Too little data to infer keyword demand or ranking progress. Preserve report filters and dates in later comparisons. |
| Crawl setup | Search Console said all robots files were valid and showed 607 crawl requests over its last 90 days. | A valid robots file does not prove every page is indexable. |
| Article markup | The live article `/blog/why-defenders-should-be-your-transfer-priority-in-gameweek-9` contained parseable `BlogPosting` JSON-LD with headline, description, author, publisher, dates, image and canonical page URL. Current article source also provides this markup. | Full Rich Results Test and image-access checks have not been completed. Extend the existing implementation. |
| Other markup | The sampled live homepage and `/player/david-raya-martin-1` contained no JSON-LD. | Add site identity and useful breadcrumb markup; inspect rendered HTML before assuming no other markup format exists. |
| Routes and content | Current source has player profiles, manager pages, watchlist and blog. It has no dedicated `/fixtures`, `/clubs` or `/players` pages. Profiles already show data freshness and the next five fixtures with an expansion control. | Add discovery routes and interpretation without duplicating existing profile features. |

No application code, deployment, publication or ranking improvement is established by this document.

## How an implementing agent should work

1. Confirm checkout, remote, branch, dirty files, runtime and target. Preserve unrelated edits. Use npm and Node 24 for application installs/builds. The documentation session found Node 22.23.1 on PATH; locate an existing Node 24 runtime or report its absence before application checks. Do not install a runtime without authorization.
2. Read this guide's phase, the relevant owner document and the current source landmarks below. Check for work completed since this guide was written.
3. Implement a small coherent part, including its loading/error states, metadata and links. Keep pages focused on composition; reuse helpers before adding new ones. Do not build a generic SEO framework or install a package just to emit JSON-LD.
4. Run relevant non-destructive checks. Use a Node 24 build when appropriate for new routes/shared behavior. Use focused checks for data calculations and failure paths; do not add a test framework for this plan.
5. Verify affected views in connected Brave, unless the user requests another browser. Cover 390 × 844 and desktop, supported themes, keyboard use, full names, and full-width controls. State unavailable browser or device checks.
6. Update the phase status and evidence here. Keep subsystem implementation details in their existing owner documents. Record local, browser, hosted, authenticated and physical-device results separately. Never mark a phase verified from a build alone.

| Existing source | Reuse or inspect for |
| --- | --- |
| `utils/site-url.ts`, `composables/useCanonicalUrl.ts`, `composables/usePlayerRoute.ts` | Public origin, canonical metadata and preferred player routes |
| `server/routes/sitemap.xml.ts`, `server/routes/robots.txt.ts` | Public discovery; sitemap currently combines homepage, blog, players and published articles |
| `server/utils/fpl-bootstrap.ts`, `utils/fpl-fetch.ts`, `server/api/fixtures.ts` | Validated upstream data, recovery, caching and existing fixture contract |
| `server/utils/manager-fixtures.ts`, `server/api/managers/fixtures.get.ts`, `utils/manager-planner.ts` | Cached five-gameweek projection and week selection; preserve current manager consumers |
| `utils/homepage-shortlist.ts`, `composables/useHomepageShortlist.ts`, `composables/usePlayerSearchData.ts` | Filtering, ranking, fixture grouping and loaded catalog reuse; avoid sharing homepage preference state accidentally |
| `components/HomePlayerSearch.vue`, `components/PlayerSearchSurface.vue`, `layouts/default.vue` | Current player search and public navigation |
| `pages/player/[id].vue`, `components/PlayerPerformanceCard.vue`, `components/PlayerProfileHistory.vue`, `composables/useWatchlist.ts` | Player identity, profile data, history and existing save behavior |
| `pages/blog/[slug].vue`, `pages/blog/index.vue`, `server/utils/articles.ts`, `server/api/articles/`, `shared/articles.ts` | Published content, article metadata, current JSON-LD and article contracts |
| `plugins/analytics.client.ts` | Existing Vercel Analytics injection; this alone does not prove custom-event collection |

## Phase order and status

| Phase | Deliverable | Starting status | Dependency |
| --- | --- | --- | --- |
| 1 | Indexing baseline and technical verification | Sitemap submission complete; follow-up open | None |
| 2 | Site identity, article markup validation and existing-page breadcrumbs | Existing article markup only; additions planned | Phase 1 source/status check |
| 3 | Fixture planner and linked club pages | Planned | Shared URL/data rules; phase 2 markup conventions |
| 4 | Public player directory | Planned | Club routes and shared filtering decisions |
| 5 | Player summaries, alternatives and contextual links | Planned | Club/directory destinations; validated player history |
| 6 | Focused articles connected to the tools | Existing blog; new integrations/content planned | Target tools available; existing publishing requirements |
| 7 | Authorized release verification and measurement | Planned per release | Relevant local checks pass; release explicitly authorized |

Indexing observation continues while local phases proceed. Do not wait for all players to be indexed before building useful pages. Existing editorial work can continue alongside tool work; link only to destinations that exist.

## Phase 1: Establish the indexing baseline

**Outcome:** distinguish discovery, crawl access, indexing and traffic with actual evidence.

- [ ] Inspect homepage, one player and one published article in Search Console. Record inspection time, last crawl, fetch/indexing permissions, user-declared canonical and Google-selected canonical when available. A live test confirms current access, not inclusion in the index.
- [ ] Review the homepage exclusion and its existing validation status before requesting any further action. Do not repeatedly resubmit the unchanged sitemap or restart validation without a diagnosed reason. Request indexing only when authorized and useful for a few changed pages.
- [ ] Verify apex-to-`www` redirect, numeric/wrong player aliases, true missing-player 404, temporary upstream failure handling, and matching canonical/social URLs. Check sitemap and robots after cache revalidation on an authorized release. Preserve the old Vercel-host redirect question as an explicit unresolved release decision.
- [ ] Review Search Console security/manual-action and HTTPS reports. Record actual findings rather than assuming an account problem from low traffic.
- [ ] Establish a reproducible search baseline using dates, search type, country/device/page filters, clicks, impressions, CTR and position. Track page groups for articles, players and later clubs/tools. Do not call an impression a visit or a discovered URL an indexed URL.
- [ ] Confirm a known visit appears in Vercel Analytics. If custom events are supported by the configured account, measure a small set of useful actions such as opening a player from a tool and saving a player. Keep manager IDs, search text and personal data out of event payloads. If unavailable, use pageviews/referrers and report the limitation.

**Acceptance:** evidence explains which checks passed and which remain unavailable; no invented traffic or completion. Google says crawling can take days to weeks and a request does not guarantee indexing. See [recrawl guidance](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl).

## Phase 2: Add appropriate structured data and publisher context

**Outcome:** consistent machine-readable descriptions that match the visible page. Structured data can support search appearance and understanding; it does not guarantee a special display or a ranking gain. Follow [Google's general policies](https://developers.google.com/search/docs/appearance/structured-data/sd-policies).

| Page | Markup and implementation requirement | Priority |
| --- | --- | --- |
| Homepage | `WebSite` with canonical root URL and the real public site name. Use the current header name FantasyPL as primary; metadata/footer use FPL Insights, which can be an alternate name for the same site. Preserve the names unless the owner requests a change. Do not invent a SportSync rebrand from the domain. | High |
| Homepage or About page | One publisher `Organization` with a stable `@id`, real name, URL, existing suitable logo and verified public profile links where available. Reference the same publisher from articles. Omit unknown addresses, contacts and profiles. | High |
| Published article | Retain `BlogPosting`; include accurate headline, description, representative image, original publication time, meaningful modification time, author identity and canonical page reference. Add the author's real profile URL when ready. Do not switch every guide to `NewsArticle`. | High |
| Article, player, directory and club pages | `BreadcrumbList` derived from the same items as visible breadcrumbs. Include only real routes, ordered positions and canonical absolute URLs. Never link to a planned route. Google's breadcrumb search feature currently applies to desktop. | High |
| Real author page | A visible author biography and published work, with accurate `Person` details. `ProfilePage` is optional when Google's creator-affiliation requirements are met. Obtain missing personal facts from the owner; do not fabricate credentials or biographies. | Medium |
| Club/player subject | Optional `SportsTeam`/`Person` describing displayed facts. This has no dedicated Google FPL-statistics rich result. Do not label third-party footballer pages as affiliated creator profiles. | Later |

Author and publisher details follow [article guidance](https://developers.google.com/search/docs/appearance/structured-data/article), [organization guidance](https://developers.google.com/search/docs/appearance/structured-data/organization), [site-name guidance](https://developers.google.com/search/docs/appearance/site-names) and [profile-page eligibility](https://developers.google.com/search/docs/appearance/structured-data/profile-page). Breadcrumb requirements are in [Google's breadcrumb documentation](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb).

- [ ] Inspect all structured-data formats in rendered HTML and extend the current article emitter without duplicate/conflicting objects. Use a small shared helper/composable only where needed across routes; keep it reactive on client navigation.
- [ ] Emit safely serialized JSON-LD in server-rendered HTML. Escape HTML-significant content, including `<`, and test an article title containing `</script>`. Missing/error pages must not retain stale article/player metadata after navigation.
- [ ] Keep stable object IDs and all canonical/image/profile URLs on the approved origin. Confirm images return image content and are crawlable. A reachable OG image alone is not full Rich Results Test validation. Consider useful image crops in Google's recommended aspect ratios without making decorative variants a release blocker.
- [ ] Add useful About/source/method information and a real author destination where supported by verified details. Explain observed stats, fixture difficulty, predictions and editorial responsibility in plain language. Keep any needed owner information as an explicit remaining action.
- [ ] Keep visible dates and JSON-LD aligned. A data refresh or deployment must not pretend an old article was newly published. Public metadata must describe the published revision, never a draft.
- [ ] Parse JSON-LD locally, check supported types with [Rich Results Test](https://search.google.com/test/rich-results), and check general schema with [Schema Markup Validator](https://validator.schema.org/). Validate the released URLs separately when authorized. `WebSite` and general schema should not be judged only by Rich Results Test coverage.

Do not add ratings from FPL form scores, mark a price as a product offer, or use event markup on a fixture comparison table to chase search features. FAQ and HowTo rich results are retired; do not build them as an SEO deliverable. Recheck the [supported gallery](https://developers.google.com/search/docs/appearance/structured-data/search-gallery) and [Google's update log](https://developers.google.com/search/updates) before implementing changing search features. Site search markup is not a shortcut to a Google search box.

**Acceptance:** current article markup is preserved and validated; new identity/breadcrumb data matches the page and survives route changes. Author information gaps are visible in the handoff, not filled with invented facts.

## Phase 3: Build the fixture planner and club pages

**Outcome:** visitors compare upcoming club fixtures, then inspect that club's players.

Proposed routes are `/fixtures`, `/clubs` and `/clubs/[slug]`. These do not exist at this checkpoint. Create one shared club template driven by the current official FPL club catalog, with readable slugs and a centralized resolver. Do not hard-code a season's club count or assume seasonal IDs identify a club forever. Unknown clubs return 404; upstream failures show recovery rather than a false 404. Define any historical/renamed-club redirects from verified identity evidence before adding them.

- [ ] Provide an initial five-gameweek matrix across clubs, with an optional three-week view. Show opponents, home/away, official FPL difficulty and a legend. Group by gameweek, including blanks, doubles and unknown kickoff times; five matches are not necessarily five gameweeks.
- [ ] Explain comparison ordering. For a simple difficulty sort, use the arithmetic mean of available scheduled-match difficulty values within the selected horizon and show match/blank counts alongside it. A club with no fixtures has no difficulty score. Missing difficulty is unknown. Explain that this measure does not value double-gameweek opportunities or predict points, goals or clean sheets.
- [ ] Preserve home/away difficulty as assessed for the club shown. Reuse the existing cached fixture path where its contract fits; otherwise extract a compatible shared owner. Do not silently change the manager feed's horizon, fields or meanings.
- [ ] Add a crawlable club directory. Each club page contains its five-gameweek run, a current player table with position, price, points, season minutes, FPL form and ownership, and a short supported summary. Label time periods and units. Add recent minutes only when a suitable cached history source exists.
- [ ] Link every player through `getPlayerRoute`. Club links lead from fixture rows and player profiles to the same canonical club route. Club pages link to `/fixtures` and matching published articles when available.
- [ ] Render useful initial content on the server, with unique titles/descriptions and clear headings. Add visible breadcrumbs and the phase 2 markup. Include valid canonical club/index/planner routes in the sitemap. Use real update times if supplying `lastmod`.
- [ ] Keep the initial implementation data-driven with no provider calls on public requests. Avoid loading every player's individual history to render a club or planner table. Use existing badges/brand assets, Nuxt UI and Tailwind.

**Acceptance:** cover a normal week, blank, double, missing difficulty, postponed kickoff, end of season and upstream failure. Fixture→club→player links work in initial HTML and the browser. At mobile width, users can identify the club and week while navigating the matrix; scrolling does not hide all context. Check cache freshness across the deadline.

## Phase 4: Add the public player directory

**Outcome:** a stable `/players` destination supports browsing the whole catalog, rather than relying only on an opened search overlay.

- [ ] Reuse existing filtering and ranking utilities with page-owned URL/state handling. Provide name/club search, position, maximum price, club and clear sort controls. State whether a statistic is season-long or gameweek-specific. Apply filters to the full catalog before limiting visible results.
- [ ] Use a stable default sort and deterministic tie-breaker. Do not copy the homepage composable's randomized initial ranking or its storage keys into a crawlable directory. Parse and bound URL state; browser Back and reload must restore the same valid selection.
- [ ] Show availability accurately in the directory. It may list flagged/low-minute players; that is different from recommending them as incoming transfers. If adding recommendation labels, reuse the applicable availability rules without changing existing manager behavior.
- [ ] Serve an initial player list with real links in HTML. Add accessible expansion or pagination and a crawlable route through the rest of the catalog; a sitemap alone must not be the only way to find later players. If pagination has URLs, use each page's appropriate canonical and do not canonicalize distinct later player lists to page one.
- [ ] Index `/players` as the main directory. Keep arbitrary search/filter/sort combinations out of the sitemap and do not generate landing pages for every combination. For overlapping filtered views, use the base canonical where appropriate and avoid crawlable link grids for combinations. If a view needs `noindex`, allow crawling so Google can read it; robots blocking is not a substitute. Document the chosen URL policy before shipping.
- [ ] Preserve the shared header search, homepage preferences and browser-local watchlist. Add links to the directory from public navigation and the player breadcrumb when ready.

**Acceptance:** verify full-catalog filtering, price units, stable ties, valid/invalid URL state, empty results, pagination/expansion and history navigation. An empty valid search is useful empty-state UI, not a missing-player 404. Check the chosen URL policy against [Google's filter URL guidance](https://developers.google.com/crawling/docs/faceted-navigation).

## Phase 5: Explain player figures and connect related pages

**Outcome:** users can understand a player's current data and choose a useful next step without interpreting every statistic unaided.

- [ ] Add a concise factual summary using current price/position, ownership, recent playing time when supported, and the existing upcoming fixtures. State the period and limitations. Preserve the existing freshness display and five-fixture expansion instead of rebuilding them.
- [ ] Compute summaries from validated data in small helpers/composables. Use the already loaded profile history or a cached source, omit unavailable facts, and avoid AI/provider requests during page reads.
- [ ] Offer a bounded set of alternatives using a documented same-position and nearby-price rule, sufficient minutes and current availability. Show why each qualifies; do not treat low ownership or high transfers alone as quality. Use deterministic ranking and link to canonical profiles.
- [ ] Link to the club, player directory and a small set of relevant published articles. Match articles using resolved subject identity and season/context, not keyword substring alone. Do not silently map an old article's seasonal player ID to a different current player.
- [ ] Keep news claims separate from statistics. A low recent-minutes figure cannot prove injury or rotation plans. Do not publish unsupported buy/sell certainty or imply a guaranteed starting place.

**Acceptance:** summaries match displayed evidence, handle zero minutes/missing history/unavailable players, and do not retain the previous player's facts on navigation. Alternatives are bounded, eligible and explained. No profile-by-profile request burst is added to shared browse pages.

## Phase 6: Connect focused articles to the tools

**Outcome:** reviewed articles answer a specific question and lead to a relevant club, fixture view or player comparison.

Follow [BLOG_GROWTH_PLAN.md](BLOG_GROWTH_PLAN.md) for editorial cadence, article formats, authoring, source handling, evidence freshness and publication controls. Follow [docs/ARTICLE_VISUAL_CARDS.md](docs/ARTICLE_VISUAL_CARDS.md) for supported visuals. Do not redesign the content engine or enable automation under this phase.

- [ ] Add a small recent published-articles selection to the homepage and relevant selections to club/player pages. Reuse published-only server queries; never expose drafts through related lists, metadata, feeds or caches. Keep homepage presentation details in its owner plan.
- [ ] Use bounded, indexed article matching if storage changes are needed. Inspect existing article contracts before adding tags/subject references. Read the Convex expert guidance before editing `convex/`; preserve authorization and avoid per-player full-table scans.
- [ ] Prepare useful draft topics from the approved formats: upcoming fixture runs with an explained method, budget shortlists with stated thresholds, transfer popularity versus minutes, and evergreen help such as finding a manager ID. These are topic hypotheses, not proven keywords or current player recommendations.
- [ ] Keep article interpretation distinct from evergreen tool pages. A club page owns current club data; an article owns its dated question and reasoning. Preserve captured evidence and add a clearly labeled link to current data instead of rewriting historical claims silently.
- [ ] Add descriptive links in both directions when useful. Link only to live destinations and published revisions. Do not create empty club/tag archives or every possible player-pair article.
- [ ] Provide real bylines, sources where applicable, useful preview images, matching article markup, sitemap entries and RSS discovery. Verify image and article crawl access. Do not invent biographical or factual content to fill a template.
- [ ] Review drafts for calculations, rules, news, source support and a clear answer. Publish only under a separate explicit publication request or an already authorized publishing mode verified at execution. This guide does not enable that mode.

**Acceptance:** published article→tool→player paths work; related lists exclude drafts and broken targets. Failure of the live FPL API does not erase the saved article. Verify unauthorized access and draft isolation if publication/query code changes. Preparing a draft is not publication completion.

## Phase 7: Release checks and measure results

Run this phase for each authorized release. Keep a release separate from the local implementation. No production data import, backend migration or environment change is implied.

- [ ] Confirm the intended Nuxt/Vercel target and, if relevant, the actual Convex deployment. Do not assume a local function exists in production or switch the blog backend to finish an SEO task.
- [ ] After release, inspect status, redirects, one canonical, social URLs, server-rendered links, structured data, image access, robots and parsed sitemap locations. Repeat cache-sensitive checks after revalidation. Confirm only intended public routes appear.
- [ ] Inspect representative URLs and run supported rich-result validation. Record results or exact limitations. A successful validator does not guarantee Google will display an enhancement; an old report is not a failed release.
- [ ] Review Search Console once after a reasonable processing interval and then over comparable gameweek/deadline windows. This is a manual follow-up until the owner explicitly requests a monitor. Do not create an automation from this checklist.
- [ ] Compare impressions, clicks, queries and landing pages by page group. Treat CTR/position cautiously at low counts. Review actual useful visits and return behavior alongside search metrics; document any analytics limits.
- [ ] Check mobile loading and layout with comparable measurements before and after changes. Keep the initial HTML/data payload bounded; do not call a smaller bundle proof of traffic growth.
- [ ] Expand content based on observed useful queries, indexing results and maintained data quality. Useful site distribution may follow under a separate request; this plan does not authorize social posts, outreach, paid acquisition or purchased links.

**Acceptance:** distinguish implementation completion from deployment, indexing, search appearance and visitor outcomes. There is no promised rank, traffic target or requirement that every catalog player be indexed.

## Evidence and handoff log

Maintain one dated entry here for each completed SEO work slice. Include phase/deliverable, changed paths, actual local commands, browser routes/viewports, hosted/account checks, remaining work and the next useful phase. Preserve previous evidence rather than changing historical results.

### 29 October 2026: Guide created

The phase requirements above are planned. The dated starting point records checks already completed in this chat. This documentation change adds no application behavior. `git diff --check` passed. A local Markdown-link check found no missing file targets in this guide or its five referring documents; it also confirmed all seven phase headings and their incoming guide links. No application tests or build were needed. Next work: Phase 1 current indexing inspection and Phase 2 markup/identity work within the requested implementation scope.
