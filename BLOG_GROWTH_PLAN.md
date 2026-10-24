# FantasyPL blog growth and admin publishing plan

6 September 2026. Companion to [the site audit](/Users/balsimpson/Documents/Projects/FantasyPL/SITE_GROWTH_AUDIT.md).

## Decision

Build a blog into the existing site, with an admin page for generating and publishing articles from verified FPL data. Launch it alongside the search-discovery fixes and homepage improvements. Do not wait for every proposed tool to be complete.

The owner wants a content engine that researches gameweek-relevant search topics, checks competing coverage, recommends useful articles, generates from evidence, and supports Instagram distribution. On 24 October 2026 the owner confirmed that unattended publishing is a first-class mode that can be turned on or off. Manual review remains available when that mode is off. The requested local foundation now includes the private workspace, editor and saving, followed by research suggestions and concurrent background article generation. Public publishing and Instagram integration remain outside this implementation stage.

Confirmed setup decisions (24 October 2026): use GitHub directly through Nuxt Auth Utils, restrict access to the configured numeric GitHub account ID, use the existing Convex infrastructure for storage and background tasks, and use Nuxt UI's rich text editor with structured JSON. No Auth0 setup is required. Use OpenRouter for writing and its web-search plugin for research. The engine must choose and place player cards and fixture visuals itself; the owner should not have to assemble them. Do not invent search volumes or ranking difficulty from web search results.

The chosen flow is web research → competitor coverage benchmarks → suggested article angles → owner selects suggestions → independent Convex writing jobs → editable visual drafts. The research implementation uses cited search excerpts, not a verified full-page crawl or a keyword-volume service. Its benchmarks must say when coverage is not visible in an excerpt rather than claiming a competitor lacks it. Suggestions are hypotheses about useful topics, not measured demand.

The first audit was stronger on technical defects than competitive acquisition strategy. This follow-up compares four relevant publishers/tools and revises the growth plan. These are justified experiments, not a claim that we have found the highest-traffic keywords. No competitor analytics, backlink database, search volumes, or ranking difficulty were available.

## What similar sites do

Research covered publicly accessible homepages, article listings, representative article/hub pages, and a comparison-tool description. It was not a visual or authenticated audit of competitors. Their stated performance claims and article statistics were not independently verified or adopted as facts.

| Site and evidence | Observed approach | What FantasyPL should take from it |
| --- | --- | --- |
| [Fantasy Football Scout](https://www.fantasyfootballscout.co.uk/) and its [gameweek hub](https://www.fantasyfootballscout.co.uk/fpl-gameweek-4-tips-best-players-predicted-line-ups-team-news-more-4) | Organizes advice into player picks, team news, captaincy, fixtures, and expert articles, with routes into its tools. The sampled upcoming hub also contained many coming-soon sections. | Organize useful articles around a gameweek, but publish a hub only when it already answers something. A smaller site should not imitate the full editorial schedule. |
| [AllAboutFPL](https://allaboutfpl.com/) and its [gameweek guide](https://allaboutfpl.com/2026/08/fpl-gw3-ultimate-guide-tips-captaincy-differentials-more/) | Groups several distinct captain, differential, transfer, and chip articles under one guide. Named contributors and dated articles are visible. | Use topic clusters and meaningful internal links. Keep an identifiable editorial owner and clear dates. Start with one useful cluster rather than a large tag archive. |
| [FPL Team blog](https://fpl.team/blog/) and its [head-to-head article](https://fpl.team/blog/fpl-head-to-head-2-big-battles-for-your-gw1-team/) | Combines recaps, team previews, and player debates. The sampled comparison includes a verdict, named author, and a call to try the planner. | Connect an article's question to an actual tool action. This is the closest model for combining FantasyPL's existing player pages with editorial content. |
| [Fantasy Football Pundit](https://www.fantasyfootballpundit.com/) and its [player comparison tool](https://www.fantasyfootballpundit.com/fpl-player-comparison-tool/) | Exposes specific tools for fixtures, comparisons, prices, and other decisions. The comparison page explains periods and per-90 interpretation. | Pair data with a plain explanation. A useful query-specific page can attract readers, but the interpretation is what helps them use it. |

The repeated pattern is content connected to a specific decision and then a tool. Merely adding a blog index would not reproduce that value. Broad gameweek tips and captain picks already have substantial publisher coverage; this is an observation about competing supply, not a measured keyword-difficulty score.

## Positioning and article priorities

Working promise: understandable FPL decisions backed by visible numbers. Write for managers who want to understand a transfer or shortlist without opening several spreadsheets. This fits the current beginner-oriented README, though the audience remains a working assumption.

Prioritize narrow questions that connect to existing data. Start with these three data-led formats plus a small evergreen guide collection:

| Format | Candidate topic | Distinct contribution | Destination after reading |
| --- | --- | --- | --- |
| Transfer trends | Most transferred-in FPL players this gameweek: form, minutes and fixtures | Compare popularity against actual playing time and upcoming opponents. Explain cases where a popular transfer still has risks. | Relevant player profiles; watchlist once repaired |
| Fixture analysis | Which teams have the easiest next five FPL fixtures? | Show opponents, home/away, blank/double weeks, and the exact difficulty method. | Player profiles initially; full fixture tool when available |
| Budget shortlists | FPL midfielders under £6.5m: minutes, form and fixtures | Apply a transparent budget and minutes filter before making an editorial shortlist. | Player profiles and, later, the filtered player directory |
| Evergreen explanations | How to find your FPL manager ID; how to read fixture difficulty; when per-90 stats mislead | Teach a task or explain a common interpretation error using original worked examples. | Existing manager form or relevant stats page |

These are proposed titles and query themes, not finished posts or verified recommendations about current players. At drafting time, verify prices, season, gameweek, player eligibility, rules, and relevant official team news. Avoid pretending current FPL IDs are permanent identities across seasons.

Follow with a player-versus-player article only when there is a real choice worth explaining. Avoid generating all possible pairs. Differentiate it from the ordinary player page: the profile owns current player stats, while the article owns the specific decision and its dated reasoning.

For “best teams,” use “teams with favorable upcoming fixtures” as the first precise definition. Do not turn that into a claim that those are the strongest teams or guaranteed clean-sheet picks. An attack-versus-defense model would require separately defined inputs and validation.

## Editorial schedule for the first month

Target two reviewed posts per week at first, assuming roughly four to six hours of editorial work is available. AI drafting does not remove the time needed for research, checking, and revision. Reduce cadence before reducing quality.

| Week after blog launch | Post one | Post two | Product dependency |
| --- | --- | --- | --- |
| 1 | How to find your FPL manager ID | Transfer trends with form and minutes context | Existing lookup and profiles |
| 2 | How to read fixture difficulty | Best upcoming fixture runs with a transparent table | Fixture data; a separate fixture tool is optional |
| 3 | A budget-midfielder shortlist | One meaningful player comparison | Current prices, minutes, fixtures, and profiles |
| 4 | Why most transferred-in does not always mean best buy | Next gameweek transfer watch, with a follow-up on the earlier shortlist | Preserved source snapshots |

Choose the actual next gameweek from fresh data, not from a hard-coded calendar in this plan. Publish deadline-sensitive analysis with enough time for readers to act, then review late team news before the deadline. Keep a visible correction/update note if advice materially changes.

For an evergreen explanation, update the same URL when facts change. For gameweek-specific advice, use a season-specific slug and preserve the original context. Do not relabel last week's article as this week's without replacing its analysis. Add a prominent link to the current article from useful older posts.

## Admin workflow

1. Open Research in the protected admin workspace. Research the upcoming gameweek, optionally with a narrower focus.
2. Review cited competing articles, their observed strengths and gaps, and suggested article topics, reader questions, original angles and visual approaches. Choose several suggestions to start separate writing jobs. A manually authored article remains available under Articles.
3. Each Convex job fetches and validates a fresh official FPL snapshot. It selects relevant named players, or ranks candidates using stated form/transfer/fixture filters and any supported budget/position constraints. Current generation supports the current upcoming gameweek only; stale season/gameweek requests must fail clearly.
4. Generate a title, excerpt, structured prose and player/fixture block references. Resolve visual references against validated evidence in code. Save the generated result separately from the working draft; no background job may overwrite manual edits. The editor offers Use generated draft, with confirmation before replacing existing text.
5. Review and edit in a full-width editor with a public-page preview. Display any unsupported claim or stale-data problem next to the content it affects.
6. Publish manually when unattended publishing is off, or allow an authorized engine job to publish when it is on. Both paths must check the current mode, target revision, source snapshot, slug uniqueness, freshness, and required metadata on the server.
7. Return the public URL and verify the page, sitemap entry, and article metadata. Later edits create a new revision, and previous published text remains recoverable.

The article must be readable if the FPL API fails later. Store the evidence used when it was written. A separately labeled current-stats block may refresh, but it must not silently change the historical argument. Keep the automatic FPL source and selection note out of generated article body copy; retain source and capture metadata for the public article metadata area.

The initial visual blocks are a player card and a three-gameweek fixture run. They retain season, gameweek, player identity, prices/metrics, fixture difficulty, blank/double representation and capture time in the saved document. Visual values come from code, not model-authored numbers. Writing prompts request conversational British English, a direct opening, varied paragraph length and concrete tradeoffs, and reject hype, boilerplate, invented first-hand observation and unsupported news. These instructions are not proof that live output reads well; review a real model response once credentials are configured.

The workspace/editor stage saves private drafts only. The publishing engine must support unattended operation as a core mode with an owner-controlled on/off setting. Turning it off must prevent queued work from publishing at execution time. Article publishing and Instagram scheduling need separate permissions, results and retry handling. Failed generation leaves existing content untouched. Retrying a publish must not create duplicate articles. A partial stream must never become a published article.

## Data and generation rules

Calculate rankings in code and use AI to explain them. The model should not calculate source totals, choose arbitrary thresholds without disclosure, or supply missing statistics from memory.

- Transfers: store transfers in, transfers out, and calculated net transfers. Distinguish gameweek totals from season totals. A “last 24 hours” claim requires timestamped comparable snapshots, validation of the interval, and handling gameweek resets. Until that exists, publish gameweek totals with a capture time.
- Fixture runs: group by gameweek rather than simply taking the next five matches. Represent blank and double gameweeks and unknown kickoff times. Document aggregation so an average difficulty does not conceal a missing or additional fixture. Opponent difficulty alone is not a probability of scoring or keeping a clean sheet.
- Budget lists: use the API's price units consistently, exact position filters, and a stated minutes threshold. Keep a minimum-sample caveat near per-90 comparisons. Availability flags need a capture time and should not be treated as confirmed starting lineups.
- Comparisons: use matching periods and distinguish observed statistics from predictions. If predictions are used, show source, horizon, and freshness; omit them cleanly when unavailable.
- News and rules: bring in verified primary-source material when necessary. The existing stats endpoints alone cannot support claims about manager intent, tactical changes, injuries, or rule changes.

Each generated section should carry references to the supplied fact IDs internally. Check figures, identities, dates, and links against that snapshot. Such checks can catch many factual errors but do not prove every sentence is supported; editorial review still matters. Sanitize rendered content and restrict any embedded components to an approved set.

Google permits useful AI-assisted content, but warns against generating many pages without added value. The practical objective is accurate analysis with clear authorship and sources, not output volume. [Google's AI content guidance](https://developers.google.com/search/docs/fundamentals/using-gen-ai-content).

## Public article experience

Use `/blog` and `/blog/[slug]` on the existing domain. Add Blog to navigation and show a small selection of recent relevant posts on the homepage and player profiles.

Every article should provide the answer early, followed by a readable evidence table, reasoning, limitations, and one useful next action. Include a real author/editor, publication time, meaningful update time, applicable season/gameweek, data capture time, and source links. Keep the article in a readable single column and make tables usable on mobile. Avoid an oversized player image pushing the answer below the first screen.

Public HTML should contain the article without requiring client-side generation or a successful live data request. Provide a unique title, description, canonical, share image, and accurate BlogPosting or Article metadata. Structured data must match visible content; it does not guarantee special search treatment. [Google article guidance](https://developers.google.com/search/docs/appearance/structured-data/article).

Add published articles to the corrected sitemap with truthful modification times and an RSS feed. Keep drafts and admin routes out of public queries, feeds, search, and metadata. Begin with categories as navigation filters; do not index empty or near-empty tag archives. There is no need for blog search until the article count makes browsing difficult.

## Technical plan for this checkout

Current evidence (24 October 2026): this is Nuxt 4 on the declared Vercel target, with an existing Convex backend and Buffer scheduler. The local workspace implementation adds article tables/functions and private Nuxt admin APIs; this is separate from deploying those functions or configuring GitHub credentials. `server/api/get-response.ts` generates Instagram-style captions and is not a blog publishing workflow. Do not repurpose it blindly or disturb its consumers. Article publishing and scheduler posting remain separate workflows; the scheduler now sits inside the authenticated admin workspace without an article-to-Instagram integration.

Use Convex article storage behind server-authorized Nuxt APIs and single-admin GitHub login through Nuxt Auth Utils. Store each saved draft revision independently. Public article delivery must later read only a published revision, without exposing the working draft. Use managed persistent storage rather than Vercel function-local files or localStorage.

Nuxt Content is a reasonable alternative for repository-authored Markdown, with collections and supported Vercel deployment. It is not the default recommendation for this requested admin workflow because generation/publishing would then need an additional repository-writing and build process. [Nuxt Content collections](https://content.nuxt.com/docs/collections/define), [Vercel support](https://content.nuxt.com/docs/deploy/vercel).

Proposed implementation boundaries:

| Boundary | Responsibility |
| --- | --- |
| `pages/blog/index.vue`, `pages/blog/[slug].vue` | Public index and server-rendered article page |
| `components/blog/` | Article header, safe content renderer, evidence table, related player links |
| `pages/admin/articles/` | Combined research and article workspace; list, generate, edit, preview, publish |
| `components/admin/ArticleResearchPanel.vue` | Research controls, suggested angles, and direct draft creation within the article workspace |
| `pages/admin/research.vue` | Forward the existing research URL to its section in the article workspace |
| `composables/useArticleEditor.ts` | Focused draft/editor state and API calls |
| `server/api/admin/articles/` | Authorized generate, save, preview, publish, and revision operations |
| `server/utils/articleEvidence.ts` | Snapshot validation and deterministic calculations |
| `server/utils/articleGeneration.ts` | Evidence-constrained generation and response validation |
| `server/utils/articles.ts` | Storage access and published-only queries |
| Shared schema module | Article fields and validation used by client and server |
| Existing sitemap plus RSS route | Discoverable published URLs and feed |

Store articles, source snapshots, and revisions. Article fields should include slug, title, excerpt, safe body format, status, author, category, season, optional gameweek, related player identity, source snapshot reference, share image, and timestamps. Store the generation configuration with the draft for diagnosis. Preserve a draft independently of the published revision.

All generation, editing, preview, and publication endpoints require server-side admin authorization. Hiding a page or adding noindex is insufficient. Keep model credentials server-only, limit generation request size and frequency, and prevent public reads of drafts. This is part of building a private paid-generation editor, not a separate security project.

## Revised implementation order and acceptance

| Stage | Work | Estimate | Acceptance |
| --- | --- | --- | --- |
| 1 | Correct sitemap/canonical/missing-player defects; start Search Console and analytics | Retain original audit estimates | Public indexing signals verified after authorized release |
| 2 | Article schema, durable storage, single-admin access, draft/revision APIs | 2–3 days | Unauthorized writes denied; drafts absent from all public responses; saves survive restart/deploy |
| 3 | Blog index/article template, metadata, navigation, sitemap/feed | 1–2 days | Valid posts render in initial HTML; unknown slugs return 404; mobile article is readable |
| 4 | Transfer evidence calculation, generation, preview, manual and unattended publishing modes | 2–3 days | Figures match snapshot; failed generation preserves content; publishing is idempotent and checks the current automation mode |
| 5 | Fixture and budget templates; initial reviewed articles | 1–2 development days plus editorial time | Edge cases validated; each post has sources and a useful internal destination |
| Alongside blog | Raise homepage search, repair watchlist, reduce payload | Retain original audit estimates | Acquisition pages lead into a functioning visitor journey |
| After four publishing weeks | Review query/page performance and editorial cost | Half-day review | Expand the useful format rather than simply increasing article count |

These are provisional developer effort estimates, not a promise of a launch date. Authentication/provider integration and editor requirements can change them. Launch with the transfer format first if the full scope is too large. No new tool page is required to publish an article with a useful table and links to existing player profiles.

Targeted implementation checks must cover transfer net totals, period/reset handling, price conversion, blank/double gameweeks, invalid generated output, stale evidence, unauthorized requests, draft leaks, and repeated publish requests. Test the full admin draft/edit/preview/publish journey locally, then public rendering and persistence on an explicitly authorized deployment. Do not infer hosted success from a build.

## How to tell whether the blog brings useful visitors

Measure blog impressions and clicks by query and article in Search Console, external referrals to articles, and reader actions into a player page or tool. If custom analytics events are supported, track `article_player_open` and `article_tool_open` with article/category and destination type, without manager identifiers or raw personal data.

Define article-to-tool conversion as article landing sessions with a successful internal player/tool open divided by article landing sessions. Track editorial hours per post alongside useful visits. A blog that attracts unrelated search traffic but no FPL usage is missing the intended audience.

After four weeks, inspect indexing and early query patterns rather than declaring SEO success or failure. After eight to twelve weeks, review which topics earn relevant impressions, clicks, and onward actions, while accounting for gameweek timing. A new site may need longer for organic discovery; social/referral tests can provide earlier feedback.

For distribution, derive useful Instagram drafts from the same evidence as the article. The owner has requested automation of both articles and the Instagram scheduler; the mode controls and execution checks must be designed before enabling unattended external actions. Saving a draft must never post or schedule anything. Delay newsletter signup infrastructure until there is a sustainable publishing routine and a clear promise worth subscribing to.

Open before the publishing-engine stage: research quality with real provider responses, search/writing budget, full-page research if required, additional evidence freshness rules, publishing cadence, and separate Instagram automation controls. GitHub OAuth credentials, the allowed numeric account ID, and backend deployment/configuration must be verified independently. An approved local implementation does not authorize deployment or publication.

## Local implementation and verification, 24 October 2026

Implemented locally: `/admin/articles` combines research controls and suggestions with the saved-article list; new/edit/preview routes, GitHub OAuth and server account checks, draft/revision storage with optimistic concurrency and idempotent retries, five article formats, validated player-card/fixture blocks, background writing jobs, background cited-excerpt research, recommendation selection and atomic article/job creation. The job result is stored separately until applied in the editor. No public blog, publishing mode execution, Instagram integration, or external release was added.

Admin workspace update (24 October 2026): `/admin` now opens Articles. Research and saved articles appear on the same page, and research suggestions open their generated drafts directly. The Nuxt UI sidebar is resizable, collapsible, and remembers its state; it groups article work together and lists InstaScheduler under the admin workspace. The scheduler route is now `/admin/insta-scheduler` and uses the existing admin middleware. The existing `/admin/research` path forwards to the combined research section. The Articles page has no repeated saved-article heading or outer borders; article rows have compact edit and delete icons, with confirmation before deletion. `npm run build`, `git diff --check`, and the Impeccable detector passed. Review of the updated controls in the browser remains open. No deployment, posting, scheduling, or publication was performed.

Editor follow-up (24 October 2026): the editor opens in preview, switches to editing in the same layout, and saves changes after a short pause. Saved revisions and an unapplied generated result appear in the version selector; a selected earlier version can be previewed and restored as a new saved revision. New revision queries were added to Convex but were not deployed. This workspace has no `NUXT_CONTENT_CONVEX_URL`/`CONVEX_URL` or `NUXT_CONTENT_SERVICE_TOKEN` configured, so local article reads and writes cannot reach storage until those settings are added. The latest `npx tsc --noEmit` run reports errors in scheduler, homepage, and manager code, plus an import resolution error for `ArticleVisualNode.vue`; the edited article and Convex files have no reported diagnostics. Browser review of the updated version, auto-save, and preview controls remains open.

Configuration: set the GitHub OAuth client credentials, callback URL, `NUXT_ADMIN_GITHUB_ID`, and a private session password on the Nuxt server. Set `NUXT_CONTENT_SERVICE_TOKEN` on Nuxt and the same value as `CONTENT_SERVICE_TOKEN` in Convex. Set `OPENROUTER_API_KEY` in Convex, with optional `OPENROUTER_MODEL` (default `openai/gpt-4.1-mini`). The existing server `CONVEX_URL` remains the default; `NUXT_CONTENT_CONVEX_URL` is an optional isolated override. `.env.example` documents the names without credentials.

Local checks: Nuxt production build and Convex TypeScript checks passed on Node 22.23.1; `package.json` declares Node 24.x. Functions were applied only to an isolated localhost Convex database. HTTP checks passed for create/read/list/update, retry idempotency, revision conflicts, missing drafts, private cache headers, anonymous/wrong-account access, origin checks and backend service authorization. Official FPL snapshot tests passed for budget/position/minutes selection, visual serialization, fixture structure and invalid gameweek/comparison requests. Two independent scheduled writing jobs executed and retained clear missing-key failures without changing saved articles. Research enqueue/retry and its missing-key failure were checked locally.

Brave checks covered create/save/reload, formatted text persistence, template headings, preview, keyboard saving, unsaved navigation protection, full-width controls, and saved player/fixture blocks. Visual blocks had no horizontal overflow at 1440px or 390px width. The research route displayed the durable configuration failure. The preview used an isolated synthetic admin session, not a real GitHub OAuth login. Provider response fixtures used for parser/visual checks were synthetic and were not live OpenRouter output. At this local-only checkpoint, live provider calls and cloud deployment were still unverified. Later development verification is recorded below.

## Development deployment and verification, 24 October 2026

The owner explicitly approved applying the new tables and functions to `focused-cuttlefish-350`, the `tinkr-simpson:fpl-insights` development deployment. `npx convex dev --once --typecheck enable` completed successfully and added the article, revision, background-job, research and suggestion-choice indexes. The scheduler schema and functions were preserved. No production/Vercel deployment, Git commit/push, public article publication or Buffer submission was performed.

The development deployment already contained `OPENROUTER_API_KEY`. A new private `CONTENT_SERVICE_TOKEN` was configured there and the matching `NUXT_CONTENT_SERVICE_TOKEN` was added to the ignored local environment. Authenticated article storage reads passed, and an invalid service token was rejected. One live background research run using OpenRouter completed with eight cited competitor benchmarks and five suggestions. This verifies the research path and saved results, not the accuracy of every recommendation or full-page competitor coverage.

The first suggestion was selected through `articleResearch.writeSuggestion`. Repeating the same selection returned the same article rather than creating a duplicate. Its background OpenRouter writing job reached `ready` and stored “Best Budget Midfielders Under £6.0m for Gameweek 9: Value Picks and Fixture Analysis”, with four automatically selected player cards. The generated result was later applied to the private editor and saved as a draft; the owner-provided browser capture showed revision 2. It remains unpublished. Editorial quality and factual recommendation review are still required before publication.

Player-card follow-up (24 October 2026): cards use the saved club code for InstaScheduler colours and crests. The shared evidence builder maps the official photo identity, points per game, goals, assists and clean sheets. Legacy snapshots fall back to the existing portrait source; snapshots without the added metrics show missing values rather than reconstructed stats. The owner supplied a newly generated revision 1 whose metrics were still missing, so the updated functions were applied to the existing `focused-cuttlefish-350` development deployment with `convex dev --once --typecheck enable`; Convex reported that functions were ready. No article generation job was triggered during verification. A new generated result and browser verification remain open. The Convex CLI again warned that the team is above Free-plan limits; billing was not changed. Project-wide `tsc --noEmit` still reports existing errors across unrelated files; the local Nuxt build and `git diff --check` passed.

Live player-card refresh, fixture styling and source-note removal (24 October 2026): the editor card keeps its saved snapshot in the initial render, then requests current player data after mount through a small batched endpoint. The endpoint uses the existing cached official FPL bootstrap (up to 10 minutes between refreshes), and the UI replaces snapshot figures only when the FPL player code still matches the saved identity. It shows the data capture time, keeps the saved card if the request fails, and identifies when it is still showing the saved snapshot. The live block uses current price, team, name, position, gameweek, stats and gameweek transfers; the article's season/context and fixture visual remain saved. Fixture runs use the matching club palette and crest, opponent crests resolved from the official club list or saved opponent codes, IST kickoff dates and a five-step difficulty display. Newly generated fixture snapshots retain opponent club codes; older snapshots can resolve them when current FPL data loads. The score is shown beside the difficulty marks without the FDR label. Generated articles no longer append the automatic source/selection paragraph; an existing paragraph with that marker is removed from the editor draft and saved through the normal revision-checked save flow on page load. `git diff --check` passed locally. The admin editor browser session was not used to verify the save, and no Convex functions, generation jobs, public pages or hosted deployment changed.

Comparison selection follow-up (24 October 2026): the comparison template no longer requires two player names in the title. With no names, it selects the top two players with at least 180 minutes by current FPL form, then season points; with one name, it keeps that player and adds the top eligible player; with two names, it keeps that pair. Topic price and position limits still apply to automatic picks. `git diff --check` is the only verification for this small local change; no generation job was started, and deployment status is unchanged.

Convex reported that the team is over Free-plan limits. Deployment succeeded, but the warning says service interruption is possible. Billing was not changed. Live GitHub OAuth and a hosted admin frontend remain unverified; their credentials/configuration and frontend release are separate from this backend deployment.

Local development import fix: Nitro was resolving the runtime import of `convex/_generated/api` outside the checkout. `server/utils/articles.ts` now uses `anyApi` from `convex/server` with a type-only generated API import, matching the existing scheduler pattern. The running Nuxt server reloaded the change, `/admin/login` returned HTTP 200, and the bad runtime import was absent from the rebuilt development server. No additional Convex deployment was needed.

## Manual publishing implementation, 24 October 2026

Implemented locally: the admin editor can publish a saved draft or republish an updated draft. Publishing validates the title, summary, URL slug, source list, season where required, and article text. Non-guide data articles need a saved FPL visual with its capture time. The live article is stored as a separate snapshot, so saving later edits does not change the public copy until it is published again. Duplicate published slugs are rejected. Draft save and publish require the existing server-side GitHub admin check.

Public delivery now includes `/blog`, `/blog/[slug]`, server-rendered article content, metadata and BlogPosting JSON-LD, visible source links and data capture time, a published-only article API, an RSS feed, published article sitemap entries, and an Articles link in the site header. Drafts are not returned by public article queries. Unknown slugs return 404; temporary storage errors return 503 and noindex metadata.

Local verification: `npm run build` and `git diff --check` passed. Project-wide `npx tsc --noEmit` still reports errors in unrelated homepage, manager, scheduler, and utility code; the changed article and publishing files had no matching diagnostics after the route-typing adjustments. The preview server could not bind to localhost in this environment, so HTTP/browser status, metadata, feed output, and responsive appearance were not confirmed. No article was published and no Vercel production release was performed. The Convex schema and functions must be applied to the intended deployment before its publish action can work; production OAuth and storage configuration also remain separate checks. Unattended publishing controls are still not implemented.

Article workflow follow-up (24 October 2026): research and writing progress now use compact status indicators, suggestion rows keep details collapsed, and article generation status appears beside each suggestion. Opening a generated suggestion automatically applies its result when the saved draft is empty; existing edited drafts still require a deliberate replacement action. The editor supports selecting text, entering an instruction, and applying a server-side OpenRouter edit to only that selection. Nuxt production build and `git diff --check` passed locally. Full project TypeScript still reports errors in unrelated files. The connected browser was unavailable, so interaction and visual behavior were not browser-verified; the new Convex action was not deployed.

Article visual cards follow-up (24 October 2026): the editor, saved article validator, generator, and public renderer now support `comparisonCard`, `transferWatch`, `budgetShortlist`, and `teamFixtureTable` in addition to player and fixture cards. Each new block stores validated player snapshots, one matching capture time, and its selection or ranking rule. The generator adds one format-matched data card for comparison, transfer, budget, and fixture articles. `gameweekRecap` remains unsupported because article jobs do not capture completed-gameweek player points. See [docs/ARTICLE_VISUAL_CARDS.md](docs/ARTICLE_VISUAL_CARDS.md) for card rules and remaining limits. `npm run build` and `git diff --check` passed locally. `npx tsc --noEmit` still reports the Vue node-view import diagnostic and unrelated project errors. Browser checks remain pending; no Convex deployment, article generation, publication, or hosted change was performed.
