# FantasyPL agent guide

## Start here

This file applies to the whole repository. Use current project files and applicable nested `AGENTS.md` files as the source of truth. Follow the user's current request when it changes a decision recorded here.

Before editing, confirm the working directory, Git remote, branch, dirty state, installed runtime, and intended deployment target. Preserve existing changes, including untracked files. Read the relevant source before assuming an audit finding is still open.

- Expected checkout: `/Users/balsimpson/Documents/Projects/FantasyPL`.
- Expected remote: `https://github.com/balsimpson/FantasyPL.git`.
- Approved canonical public site: `https://sportsync.in` (owner decision, 24 October 2026). Hosting remains on Vercel; the previous address is `https://fantasyleague.vercel.app`. Domain attachment, redirects, deployed commit, and authenticated Vercel settings require separate verification. Keep `NUXT_PUBLIC_SITE_URL` aligned with the approved canonical origin.
- The branch was `main` when this guide was created. Check it each session; do not switch branches automatically.
- Use npm only; install dependencies with `npm i`. Do not use pnpm, Yarn, Bun, or another package manager. Keep `package-lock.json` aligned with intentional dependency changes.

## Documentation ownership

Read the relevant existing document before proposing work or creating another plan. Each topic has one primary document:

| Document | Owns |
| --- | --- |
| [AGENTS.md](AGENTS.md) | Repository-wide working rules, boundaries, and pointers to topic documents |
| [SITE_GROWTH_AUDIT.md](SITE_GROWTH_AUDIT.md) | Site-wide growth priorities, original audit evidence, and discovery/data/retention findings outside the dedicated plans |
| [DESIGN.md](DESIGN.md) | Homepage visual direction, shared content width, spacing, and presentation rules |
| [HOMEPAGE_UX_PLAN.md](HOMEPAGE_UX_PLAN.md) | Homepage structure, behavior, affected files, implementation checklist, and homepage verification evidence |
| [BLOG_GROWTH_PLAN.md](BLOG_GROWTH_PLAN.md) | Blog, editorial, admin publishing, and article acquisition requirements and implementation status |
| [Article visual cards](docs/ARTICLE_VISUAL_CARDS.md) | Supported article data visuals, evidence rules, selection guidance, and implementation status |
| [Scheduler guide](docs/instascheduler/AGENTS.md) | Instagram scheduler design, player assets, preview, export and scheduling rules |

The [scheduler template editing reference](docs/instascheduler/TEMPLATE_EDITING.md) is a quick component map and scoped edit workflow; the scheduler guide remains authoritative for design and behavior requirements.

For homepage work, read `HOMEPAGE_UX_PLAN.md` first and use the audit for its supporting evidence. `DESIGN.md` supplies the shared visual direction; the homepage plan remains the authority for structure, behavior, and implementation status. The blog plan brings the blog forward alongside early site improvements and takes priority over the audit's original later editorial schedule. These documents provide context, not permission to implement every item.

When generating or editing article visuals, follow [docs/ARTICLE_VISUAL_CARDS.md](docs/ARTICLE_VISUAL_CARDS.md). It defines when each card is useful, which captured evidence it needs, and what claims it cannot support. Keep this guide current when card types or their data contracts change.

- Update the primary document in place when requirements, decisions, or completion status change. Do not create another audit, plan, checklist, or status file for the same topic unless the user explicitly requests it.
- Keep detailed recommendations, acceptance checks, and verification evidence in the owning document. Elsewhere, use a short cross-reference instead of copying them. Keep this guide focused on durable working rules.
- Preserve historical audit evidence as dated observations. When work covered by a dedicated plan advances, add only a concise status pointer in the audit if needed; record the detailed results in that plan.
- Before repeating a recommendation or implementing an old finding, inspect current source and the owning document's latest status. Distinguish planned work, local implementation, browser verification, and hosted verification.
- If documents disagree, follow the user's latest instruction and verified current behavior, then correct the owning document and any conflicting summary. Do not leave competing instructions in multiple files.

## Product direction and scope

The public UI currently uses **FPL Insights**; the repository is **FantasyPL**. Keep existing names, domain, assets, and color identity unless a rebrand is requested.

The working audience is casual or newer Fantasy Premier League managers who need understandable decisions backed by visible numbers. The README supports this direction, but the owner has not finalized the audience. Help visitors find a player, understand relevant stats and fixtures, and return before another gameweek deadline.

Use this order when asked to choose the next growth task:

1. Correct search discovery: public origin/sitemap, preferred player URLs, and missing-player responses.
2. Establish Search Console and available analytics evidence without assuming account access or buying a service.
3. Bring player search into the first mobile screen and make manager lookup a clear secondary action.
4. Repair the browser-local watchlist and reduce homepage payload and below-fold image work.
5. Build the admin-backed blog alongside these improvements. Do not wait for every proposed tool page.
6. Expand fixtures, player browsing, comparisons, and distribution based on observed demand.

Keep the scheduler outside growth work. Do not change `pages/admin/insta-scheduler.vue`, its workflow, integrations, or indexing behavior unless explicitly requested. Before authorized scheduler work, read [docs/instascheduler/AGENTS.md](docs/instascheduler/AGENTS.md); it also applies to scheduler components, composables, utilities, assets and integration handlers outside that directory. For a visual template change, use [docs/instascheduler/TEMPLATE_EDITING.md](docs/instascheduler/TEMPLATE_EDITING.md) to go directly to the relevant component before broadening the search. Shared API changes must preserve existing contracts. Read shared consumers only as needed to check compatibility. Do not send test requests to posting, upload, webhook, or other side-effect endpoints.

Defer a visual rebrand, paid acquisition, chatbot, native app, large CMS, mass-generated articles, and accounts solely for watchlist sync unless the user changes scope. Confirm the intended public purpose of `/test`, `/instagram`, and `/fifa` before changing their access or indexing policy.

## Project map and runtime

Verified locally on 6 September 2026: Node 22.23.1, npm 10.9.8, Nuxt 4.4.2, Nuxt UI 4.7.0, Vue 3.5.33, Tailwind 4.2.4, and Pinia. `package.json` declares Node `24.x`; use Node 24.x for installs and builds, and check `node --version` because the dated snapshot is not a runtime pin.

This project uses root-level Nuxt directories. Follow that structure instead of introducing an `app/` migration as part of unrelated work.

| Location | Responsibility |
| --- | --- |
| `pages/index.vue` | Homepage composition, manager lookup, player search, and ranked player lists; consumes the homepage-only data projection |
| `components/Home*.vue`, `components/GameWeekCardNew.vue` | Homepage deadline, collapsed lookup/filters, saved-player links, portrait shortlists, six upcoming matchups, three-gameweek player fixture runs, and recap |
| `composables/useHomepageShortlist.ts`, `utils/homepage-shortlist.ts` | Full-catalog price/position filtering, stat ranking, rule-based player trends, and gameweek/fixture grouping |
| `utils/carousel-layout.ts` | Shared public carousel sizing that reserves a preview of the next item; player-card fixture runs use a fixed grid instead |
| `composables/useHomepageBootstrap.ts` | Homepage loading, one client recovery attempt after an SSR failure, and retention of already loaded data |
| `server/utils/homepage-data.ts`, `server/api/homepage-data.ts` | Homepage-only FPL snapshot; the shared bootstrap contract remains unchanged |
| `server/utils/fpl-bootstrap.ts`, `utils/fpl-fetch.ts` | Shared validated bootstrap cache and bounded upstream JSON request recovery |
| `pages/player/[id].vue` | Player profile, fixtures, history, and metadata |
| `pages/manager/[id].vue` | Manager summary, published squad, five-gameweek planning and transfer recommendations |
| `components/ManagerGameweekPlanner.vue`, `components/ManagerSquadBoard.vue` | Responsive week selector, fixture modal and stable published/suggested pitch, bench and gallery views |
| `components/ManagerUpcomingFixtures.vue` | Full-width selected-gameweek fixture disclosure below the week controls, with tough published-XI matchups first and access to the five-week matrix |
| `components/ManagerSquadPick.vue`, `components/ManagerBenchPick.vue`, `components/ManagerPlayerFixture.vue`, `components/ManagerLineupComparison.vue` | Overlapping player pairs, aligned bench cards, per-player fixture strips and head-to-head comparisons |
| `components/ManagerPlayerNameplate.vue` | Shared pitch/changed-player identity panel with a bold name, price/points row and integrated fixture footer; `PlayerCardPick.vue` supplies an optional nameplate slot |
| `components/ManagerLeaguesPanel.vue` | Header trophy action and leagues slideover |
| `components/ManagerSquadPerformance.vue`, `composables/useManagerSquadPerformance.ts` | Unified XI price, actual manager points and published-versus-suggested lineup metrics, with gameweek-matched FPL estimates and historical points-per-game fallback |
| `composables/useManagerPlanner.ts`, `composables/useManagerPlannerDisplay.ts`, `composables/useManagerComparisonMetrics.ts`, `utils/manager-planner.ts` | Planner loading/preview state, stable lineup variants, signed comparisons, fixture summaries and deterministic legal-XI selection; method and limitations are in `DESIGN.md` |
| `server/api/managers/fixtures.get.ts`, `server/utils/manager-fixtures.ts` | Separate cached five-gameweek fixture feed; shared by the manager planner and transfer ranking without changing existing fixture APIs |
| `components/OgImage/ManagerTeam.vue`, `utils/manager-og-image.ts` | Fixed manager share-image layout, manager-specific palettes, and projected pitch/figures; design requirements and verification are in `DESIGN.md` |
| `components/ManagerTeamImageButton.vue`, `components/ManagerTeamShareCard.vue`, `composables/useManagerTeamImage.ts` | On-demand portrait team image, preview, PNG download and device file sharing; uses the published squad and existing manager palettes |
| `pages/watchlist.vue`, `components/PlayerWatchlistCard.vue` | Existing incomplete saved-player experience |
| `layouts/default.vue`, `components/AppFooter.vue` | Shared public shell, sticky navigation, and footer; public pages inherit these by default, while admin uses its separate layout |
| `components/PlayerSearchSurface.vue`, `composables/usePlayerSearchSurface.ts`, `composables/usePlayerSearchData.ts` | One layout-owned public player search, shared opening state and origin, and on-demand data that reuses loaded homepage/watchlist snapshots |
| `assets/css/main.css` | Tailwind/Nuxt UI imports, Public Sans, and green palette |
| `components/CalendarSubscribeActions.vue` | Shared deadline-calendar subscription and copy-link controls for the deadline panel and gameweek heading |
| `composables/usePlayerSearchAutoLoad.ts` | Scroll-based expansion of already-loaded search results, retaining a manual button fallback |
| `stores/players.ts` | Shared bootstrap/player loading and state |
| `composables/usePremiereLeague.ts` | Existing FPL fetching, lookup, and scoring helpers; preserve this exact filename |
| `composables/usePlayerRoute.ts` | Player slug creation and route ID parsing |
| `utils/site-url.ts`, `composables/useCanonicalUrl.ts` | Shared public-origin normalization and canonical URL generation |
| `server/routes/sitemap.xml.ts`, `server/routes/robots.txt.ts`, `server/routes/calendar/deadlines.ics.ts` | Crawl discovery and the public FPL deadline calendar feed |
| `server/api/bootstrap-static.ts`, `server/api/homepage-data.ts`, `server/api/players/`, `server/api/fixtures.ts`, `server/api/managers/` | Public data handlers; the homepage projection is separate so shared bootstrap consumers retain their full contract |
| `plugins/analytics.client.ts` | Existing Vercel Analytics injection |
| `pages/admin/articles/`, `components/admin/ArticleResearchPanel.vue` | Private article workspace and research/editor UI; read `BLOG_GROWTH_PLAN.md` before changing its workflow |
| `server/api/admin/`, `convex/`, `shared/` | Authorized admin APIs, durable article/research storage and shared contracts; preserve server authorization and read the blog plan for subsystem requirements |
| `nuxt.config.ts` | Modules, global metadata, and runtime configuration |

Available scripts are `npm run dev`, `npm run build`, `npm run preview`, and `npm run generate`. `postinstall` runs Nuxt preparation. There are currently no dedicated test, lint, or typecheck scripts in `package.json`; do not claim they passed or treat the `/test` route as a test suite. Do not add a test framework for a documentation-only change.

## Implementation rules

- For answers, reviews, audits, diagnoses, and plans, inspect and report without modifying files unless implementation is requested. For build/fix/change requests, make the smallest in-scope local change and run relevant non-destructive checks.
- Do not commit, push, publish, deploy, delete, post, contact others, purchase services, or change external accounts without explicit authorization. An approved local implementation does not authorize a release.
- Continue routine authorized work without repeated confirmation. Ask only when an unresolved choice changes scope or side effects. If delegation is needed and permitted, use Luna subagents only.
- Use Nuxt UI where appropriate and Tailwind for layout and styling. Prefer one visual layer over nested cards. Keep inputs and textareas full width at both the component root and inner control. Use real workflow-specific copy and placeholders.
- On the homepage, use the available viewport width and reveal secondary inputs on demand. Keep player names in full with wrapping; never use ellipsis or line clamping. Calculate Differential, Most sold, and Most bought sections from current FPL ownership and transfer counts; keep their ranking rules in `HOMEPAGE_UX_PLAN.md`. Do not make AI/provider calls during homepage requests. The owner-approved JEV buy and trade rankings run once per day through a shared Convex cron and recent-match research pool, and the homepage reads their stored snapshots; see `HOMEPAGE_UX_PLAN.md`.
- Keep pages focused on composition. Extract cohesive state, filtering, URL handling, and formatting into small composables, stores, or utilities. Avoid growing the homepage or player page into another monolithic file.
- Preserve useful server-rendered HTML. Profile serialized data before trimming shared responses, and check all consumers before changing fields, validators, identity, or units.
- Keep secrets server-only. Do not print `.env` values or move model credentials into public runtime configuration.
- Search official or primary sources when facts may have changed, library behavior is uncertain, or documentation is requested. Cite sources for current FPL rules, news, and recommendations. Do not infer injuries or starting lineups from stats alone.

## Search, data, and retention requirements

Use `getPublicSiteOrigin` and configured `runtimeConfig.public.SITE_URL` for the public origin. The environment override is `NUXT_PUBLIC_SITE_URL`. Do not derive production canonical or sitemap hosts from the incoming request in a cached handler. Keep robots, sitemap, canonicals, and social URLs consistent with the approved public host.

Use `getPlayerRoute` for preferred player links. Numeric and incorrect-name aliases now redirect permanently to the resolved preferred URL with matching canonical metadata when the current bootstrap catalog identifies the player. Hosted verification remains open. The current-season catalog is authoritative for old saved links and seasonal ID reuse; do not silently add historical identity handling without a separate source and decision.

Distinguish pending data, confirmed missing players, and upstream failures. A settled missing player needs a real 404 and recovery UI; an upstream outage must not become a false 404 or endless loading title. Show honest data freshness and omit unavailable predictions cleanly.

The existing watchlist uses `savedWatchlist` in localStorage and player `code` values. Inspect and validate its stored format before migration. Use exact membership, recover from missing/malformed storage, and centralize save/remove state. Test add, reload, remove, and navigation. Keep the behavior browser-local without implying account sync, but do not repeat that implementation detail across profiles and saved-player cards.

Preserve server-rendered player discovery while reducing homepage payload. The audit's initial target is roughly half the measured HTML and embedded payload under comparable conditions. Measure actual changes; do not call a smaller bundle proven visitor growth.

No Search Console baseline was available at the audit. Analytics injection does not prove delivery or custom-event availability. Verify account capabilities and a known test visit before reporting measurement success. Compare equivalent gameweek/deadline periods and never invent traffic, rankings, or projected gains.

## Blog requirements when implementation is requested

Read `BLOG_GROWTH_PLAN.md` before blog or article-workspace changes; it owns the detailed product, data, security, and verification requirements. Check the current source as well as the plan: planned public routes are not established features, and local code does not prove configured accounts or deployed services. Keep all admin operations server-authorized, protect drafts, and keep secrets server-only. Keep scheduler changes outside article work unless requested; article saving must not publish or post.

## Verification and handoff

Use the connected Brave browser by default; use Chrome only on explicit request. Verify the changed route, viewport, theme, keyboard behavior, and actual interaction in the local preview. For homepage search, the 390 × 844 acceptance viewport must show the header search icon without a keyboard; verify the full-width search surface and filters when opened. Check other relevant sizes and supported themes for the affected UI. State browser limitations if no connected session is available.

For application changes, run `npm run build` when appropriate and targeted checks for the changed behavior. Cover relevant error paths rather than adding tests that only repeat the implementation. Documentation-only changes need file/reference and diff checks, not an application build.

For URL changes, inspect HTTP status, redirect destination, canonical metadata, and parsed sitemap URLs. Verify the approved HTTPS host, no localhost/preview URLs, matching robots discovery, and cache revalidation after an authorized deployment. For future blog work, cover unauthorized access, draft leaks, evidence calculations, stale/invalid generation, repeat publishing, and the complete draft/edit/preview/publish journey.

Report separately what passed locally, in a browser, on the hosted site, in authenticated workflows, and on a physical device. A build, push, or HTTP 200 cannot establish all of these.

Look up implementation status in the owning document listed above and verify it against current source. Do not maintain a second dated feature-status snapshot in this guide.

When completing related work, update the owning document with the date, concrete checks, and any remaining hosted verification. Other documents need only a brief cross-reference where their existing summary would otherwise mislead. Before a broad repository search, consult this project map and the relevant implementation reference, then search narrowly from those landmarks. When an important file is added, moved, renamed, deleted, or changes responsibility, update this map or the relevant reference. Keep this guide current when a durable working rule or documentation ownership changes. Do not mark historical live findings resolved solely from local checks, and do not turn this guide into a transcript of temporary branch or dirty-file state.
