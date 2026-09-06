# FantasyPL agent guide

## Start here

This file applies to the whole repository. Use current project files and applicable nested `AGENTS.md` files as the source of truth. Follow the user's current request when it changes a decision recorded here.

Before editing, confirm the working directory, Git remote, branch, dirty state, installed runtime, and intended deployment target. Preserve existing changes, including untracked files. Read the relevant source before assuming an audit finding is still open.

- Expected checkout: `/Users/balsimpson/Documents/Projects/FantasyPL`.
- Expected remote: `https://github.com/balsimpson/FantasyPL.git`.
- Declared public site: `https://fantasyleague.vercel.app`, hosted on Vercel. This does not establish the deployed commit or authenticated Vercel project configuration.
- The branch was `main` when this guide was created. Check it each session; do not switch branches automatically.
- Use npm only. Keep `package-lock.json` aligned with intentional dependency changes. The README's alternative package-manager examples are not the project preference.

Read [SITE_GROWTH_AUDIT.md](SITE_GROWTH_AUDIT.md) for site priorities, evidence, affected files, and acceptance criteria. Read [BLOG_GROWTH_PLAN.md](BLOG_GROWTH_PLAN.md) for blog, editorial, admin, or acquisition work. The blog plan brings the blog forward alongside early site improvements and takes priority over the audit's original later editorial schedule. These documents provide context, not permission to implement every item.

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

Keep the scheduler outside growth work. Do not change `pages/instaScheduler.vue`, its workflow, integrations, or indexing behavior unless explicitly requested. Shared API changes must preserve its existing contracts. Read shared consumers only as needed to check compatibility. Do not send test requests to posting, upload, webhook, or other side-effect endpoints.

Defer a visual rebrand, paid acquisition, chatbot, native app, large CMS, mass-generated articles, and accounts solely for watchlist sync unless the user changes scope. Confirm the intended public purpose of `/test`, `/instagram`, and `/fifa` before changing their access or indexing policy.

## Project map and runtime

Verified locally on 6 September 2026: Node 22.23.1, npm 10.9.8, Nuxt 4.4.2, Nuxt UI 4.7.0, Vue 3.5.33, Tailwind 4.2.4, and Pinia. Recheck installed versions rather than treating this dated snapshot as a pin.

This project uses root-level Nuxt directories. Follow that structure instead of introducing an `app/` migration as part of unrelated work.

| Location | Responsibility |
| --- | --- |
| `pages/index.vue` | Homepage, manager lookup, player search, and ranked player lists |
| `pages/player/[id].vue` | Player profile, fixtures, history, and metadata |
| `pages/manager/[id].vue` | Manager and team journey |
| `pages/watchlist.vue`, `components/PlayerWatchlistCard.vue` | Existing incomplete saved-player experience |
| `layouts/default.vue`, `components/AppFooter.vue` | Shared shell, navigation, and footer |
| `assets/css/main.css` | Tailwind/Nuxt UI imports, Public Sans, and green palette |
| `stores/players.ts` | Shared bootstrap/player loading and state |
| `composables/usePremiereLeague.ts` | Existing FPL fetching, lookup, and scoring helpers; preserve this exact filename |
| `composables/usePlayerRoute.ts` | Player slug creation and route ID parsing |
| `utils/site-url.ts`, `composables/useCanonicalUrl.ts` | Shared public-origin normalization and canonical URL generation |
| `server/routes/sitemap.xml.ts`, `server/routes/robots.txt.ts` | Crawl discovery |
| `server/api/bootstrap-static.ts`, `server/api/players/`, `server/api/fixtures.ts`, `server/api/managers/` | Public data handlers |
| `plugins/analytics.client.ts` | Existing Vercel Analytics injection |
| `nuxt.config.ts` | Modules, global metadata, and runtime configuration |

Available scripts are `npm run dev`, `npm run build`, `npm run preview`, and `npm run generate`. `postinstall` runs Nuxt preparation. There are currently no dedicated test, lint, or typecheck scripts in `package.json`; do not claim they passed or treat the `/test` route as a test suite. Do not add a test framework for a documentation-only change.

## Implementation rules

- For answers, reviews, audits, diagnoses, and plans, inspect and report without modifying files unless implementation is requested. For build/fix/change requests, make the smallest in-scope local change and run relevant non-destructive checks.
- Do not commit, push, publish, deploy, delete, post, contact others, purchase services, or change external accounts without explicit authorization. An approved local implementation does not authorize a release.
- Continue routine authorized work without repeated confirmation. Ask only when an unresolved choice changes scope or side effects. If delegation is needed and permitted, use Luna subagents only.
- Use Nuxt UI where appropriate and Tailwind for layout and styling. Prefer one visual layer over nested cards. Keep inputs and textareas full width at both the component root and inner control. Use real workflow-specific copy and placeholders.
- Keep pages focused on composition. Extract cohesive state, filtering, URL handling, and formatting into small composables, stores, or utilities. Avoid growing the homepage or player page into another monolithic file.
- Preserve useful server-rendered HTML. Profile serialized data before trimming shared responses, and check all consumers before changing fields, validators, identity, or units.
- Keep secrets server-only. Do not print `.env` values or move model credentials into public runtime configuration.
- Search official or primary sources when facts may have changed, library behavior is uncertain, or documentation is requested. Cite sources for current FPL rules, news, and recommendations. Do not infer injuries or starting lineups from stats alone.

## Search, data, and retention requirements

Use `getPublicSiteOrigin` and configured `runtimeConfig.public.SITE_URL` for the public origin. The environment override is `NUXT_PUBLIC_SITE_URL`. Do not derive production canonical or sitemap hosts from the incoming request in a cached handler. Keep robots, sitemap, canonicals, and social URLs consistent with the approved public host.

Use `getPlayerRoute` for preferred player links. Numeric and incorrect-name aliases now redirect permanently to the resolved preferred URL with matching canonical metadata when the current bootstrap catalog identifies the player. Hosted verification remains open. The current-season catalog is authoritative for old saved links and seasonal ID reuse; do not silently add historical identity handling without a separate source and decision.

Distinguish pending data, confirmed missing players, and upstream failures. A settled missing player needs a real 404 and recovery UI; an upstream outage must not become a false 404 or endless loading title. Show honest data freshness and omit unavailable predictions cleanly.

The existing watchlist uses `savedWatchlist` in localStorage and player `code` values. Inspect and validate its stored format before migration. Use exact membership, recover from missing/malformed storage, and centralize save/remove state. Test add, reload, remove, and navigation. Describe it as saved on this browser, with no implied account sync.

Preserve server-rendered player discovery while reducing homepage payload. The audit's initial target is roughly half the measured HTML and embedded payload under comparable conditions. Measure actual changes; do not call a smaller bundle proven visitor growth.

No Search Console baseline was available at the audit. Analytics injection does not prove delivery or custom-event availability. Verify account capabilities and a known test visit before reporting measurement success. Compare equivalent gameweek/deadline periods and never invent traffic, rankings, or projected gains.

## Blog requirements when implementation is requested

The owner wants an AI-assisted admin publishing workflow on the existing site. The planned default is one admin, evidence-backed generation, editable preview, and an explicit Publish action. Storage/auth provider, editor format, and available review time remain open. Inspect for later decisions before asking again; do not choose or provision a paid provider silently.

- Planned public routes are `/blog` and `/blog/[slug]`; planned admin routes are under `pages/admin/articles/`. These routes and the proposed article modules are not established features merely because they appear in the plan.
- Use durable storage for articles, evidence snapshots, and revisions behind server-authorized admin APIs. Function-local files and localStorage are not article storage. Preserve a draft independently of the published revision.
- Calculate rankings, net transfers, and tables in code; use AI to explain validated evidence. Capture source timestamps, season, gameweek, units, periods, and player identity. A 24-hour transfer claim requires comparable timestamped snapshots. Fixture analysis must account for blank/double gameweeks and unknown kickoff times.
- Start with transfer trends, fixture analysis, and budget shortlists, plus useful evergreen explanations. Connect articles to real player pages or tools. Do not generate unsupported news, arbitrary player pairs, or thin archives for search volume.
- Failed generation must preserve existing content. Validate generated output, sanitize rendered content, prevent draft leaks, and make publish retries idempotent. All admin operations, including preview and generation, need server-side authorization. Noindex and hidden navigation are not access control.
- Public articles must render in initial HTML and remain readable during FPL API outages. Include real authorship, sources, capture/publication/update times, relevant season/gameweek, canonical metadata, and accurate article structured data. Add only published articles to the sitemap and feed.
- Do not repurpose `server/api/get-response.ts` blindly; it is an existing caption-generation endpoint with other consumers. Keep the scheduler excluded. Publishing an article must not automatically post to social services.

## Verification and handoff

Use the connected Brave browser by default; use Chrome only on explicit request. Verify the changed route, viewport, theme, keyboard behavior, and actual interaction in the local preview. For homepage search, the audit's acceptance viewport is 390 × 844 with search visible without a keyboard. Check other relevant sizes and supported themes for the affected UI. State browser limitations if no connected session is available.

For application changes, run `npm run build` when appropriate and targeted checks for the changed behavior. Cover relevant error paths rather than adding tests that only repeat the implementation. Documentation-only changes need file/reference and diff checks, not an application build.

For URL changes, inspect HTTP status, redirect destination, canonical metadata, and parsed sitemap URLs. Verify the approved HTTPS host, no localhost/preview URLs, matching robots discovery, and cache revalidation after an authorized deployment. For future blog work, cover unauthorized access, draft leaks, evidence calculations, stale/invalid generation, repeat publishing, and the complete draft/edit/preview/publish journey.

Report separately what passed locally, in a browser, on the hosted site, in authenticated workflows, and on a physical device. A build, push, or HTTP 200 cannot establish all of these.

Dated status, 6 September 2026: the public-origin/sitemap correction and local player alias/canonical implementation are present in the checkout. The audit records a passing build, local XML/host checks, and local 301/canonical/`og:url` checks for player aliases. Deployment, hosted cache behavior, and hosted player redirects remain unverified. Missing-player handling, homepage improvements, watchlist repair, and the blog remain planned in the documents. Recheck source and subsequent evidence before acting on this snapshot.

When completing related work, update the relevant audit/plan status with the date, concrete checks, and any remaining hosted verification. Keep this guide current when a durable project decision changes. Do not mark historical live findings resolved solely from local checks, and do not turn this guide into a transcript of temporary branch or dirty-file state.
