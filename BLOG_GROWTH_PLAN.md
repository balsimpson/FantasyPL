# FantasyPL blog growth and admin publishing plan

6 September 2026. Companion to [the site audit](/Users/balsimpson/Documents/Projects/FantasyPL/SITE_GROWTH_AUDIT.md).

## Decision

Build a blog into the existing site, with an admin page for generating and publishing articles from verified FPL data. Launch it alongside the search-discovery fixes and homepage improvements. Do not wait for every proposed tool to be complete.

The owner wants an admin page using AI to publish articles about transfer numbers, best teams, and similar topics. The proposed first workflow is admin-initiated generation, an editable preview, and an explicit Publish action. Unattended publishing and scheduled generation are not assumed.

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

1. Open Articles in the protected admin area and choose New article.
2. Select Transfer trends, Fixture analysis, Budget shortlist, Comparison, or Guide. Choose the relevant gameweek, horizon, budget, position, and players where appropriate.
3. Fetch a fresh, validated data snapshot. Show its timestamp, scope, and the calculated table before generation.
4. Generate an article draft from that evidence. Return a title, excerpt, structured sections, caveats, and suggested links to real player pages.
5. Review and edit in a full-width editor with a public-page preview. Display any unsupported claim or stale-data problem next to the content it affects.
6. Publish explicitly. The server checks authorization, the approved revision, the source snapshot, slug uniqueness, and required metadata before publishing.
7. Return the public URL and verify the page, sitemap entry, and article metadata. Later edits create a new revision, and previous published text remains recoverable.

The article must be readable if the FPL API fails later. Store the evidence used when it was written. A separately labeled current-stats block may refresh, but it must not silently change the historical argument.

No automatic publish after generation in the first version. Failed generation leaves the existing article untouched. Retrying a publish must not create duplicate articles. A partial stream must never become a published article.

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

Current evidence: this is Nuxt 4 on the declared Vercel target. The inspected package and server inventory do not establish an existing persistent article database or admin-auth system. `server/api/get-response.ts` generates Instagram-style captions and is not a blog publishing workflow. Do not repurpose it blindly or disturb its consumers. The scheduler remains excluded.

For the requested in-browser admin publishing, use durable database-backed article storage behind Nuxt server APIs, with a small single-admin authentication setup. Choose the provider after confirming any existing account and deployment constraints. Provider selection is open; the article schema and public URLs need not wait for that decision in the plan. Use managed persistent storage rather than Vercel function-local files or localStorage.

Nuxt Content is a reasonable alternative for repository-authored Markdown, with collections and supported Vercel deployment. It is not the default recommendation for this requested admin workflow because generation/publishing would then need an additional repository-writing and build process. [Nuxt Content collections](https://content.nuxt.com/docs/collections/define), [Vercel support](https://content.nuxt.com/docs/deploy/vercel).

Proposed implementation boundaries:

| Boundary | Responsibility |
| --- | --- |
| `pages/blog/index.vue`, `pages/blog/[slug].vue` | Public index and server-rendered article page |
| `components/blog/` | Article header, safe content renderer, evidence table, related player links |
| `pages/admin/articles/` | List, generate, edit, preview, publish |
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
| 4 | Transfer evidence calculation, generation, editor, preview and explicit publish | 2–3 days | Figures match snapshot; failed generation preserves content; publishing is idempotent |
| 5 | Fixture and budget templates; initial reviewed articles | 1–2 development days plus editorial time | Edge cases validated; each post has sources and a useful internal destination |
| Alongside blog | Raise homepage search, repair watchlist, reduce payload | Retain original audit estimates | Acquisition pages lead into a functioning visitor journey |
| After four publishing weeks | Review query/page performance and editorial cost | Half-day review | Expand the useful format rather than simply increasing article count |

These are provisional developer effort estimates, not a promise of a launch date. Authentication/provider integration and editor requirements can change them. Launch with the transfer format first if the full scope is too large. No new tool page is required to publish an article with a useful table and links to existing player profiles.

Targeted implementation checks must cover transfer net totals, period/reset handling, price conversion, blank/double gameweeks, invalid generated output, stale evidence, unauthorized requests, draft leaks, and repeated publish requests. Test the full admin draft/edit/preview/publish journey locally, then public rendering and persistence on an explicitly authorized deployment. Do not infer hosted success from a build.

## How to tell whether the blog brings useful visitors

Measure blog impressions and clicks by query and article in Search Console, external referrals to articles, and reader actions into a player page or tool. If custom analytics events are supported, track `article_player_open` and `article_tool_open` with article/category and destination type, without manager identifiers or raw personal data.

Define article-to-tool conversion as article landing sessions with a successful internal player/tool open divided by article landing sessions. Track editorial hours per post alongside useful visits. A blog that attracts unrelated search traffic but no FPL usage is missing the intended audience.

After four weeks, inspect indexing and early query patterns rather than declaring SEO success or failure. After eight to twelve weeks, review which topics earn relevant impressions, clicks, and onward actions, while accounting for gameweek timing. A new site may need longer for organic discovery; social/referral tests can provide earlier feedback.

For distribution, share one evidence table or answer from each article where relevant and permitted, with a link to that article. Do not post automatically as part of Publish unless separately requested. Delay newsletter signup infrastructure until there is a sustainable publishing routine and a clear promise worth subscribing to.

Open before implementation: database/auth provider and accounts, preferred editor format, and available weekly review time. The planned default is one admin, manual Publish, three data-led article formats, and no scheduler changes. This document proposes the design; it does not implement or authorize deployment.
