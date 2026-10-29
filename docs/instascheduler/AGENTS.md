# Instagram scheduler guide

Read this guide before changing `/admin/insta-scheduler` or its artwork, editor, asset loading, export, or scheduling code. The root [AGENTS.md](../../AGENTS.md) still applies. Current source and the user's latest instructions take priority over an older design decision here.

For a visual template change, use the [template editing reference](TEMPLATE_EDITING.md) to locate the exact design component and follow a narrow edit/verification loop. This guide remains authoritative for design constraints and workflow behavior.

## Scope and file ownership

The scheduler is a separate workflow. Do not include it in homepage, SEO, blog, or growth changes unless the user requests scheduler work. Preserve unrelated changes. Use npm. Do not commit, push, publish, upload, schedule, or post without explicit authorization for that action.

| Source | Responsibility |
| --- | --- |
| `pages/admin/insta-scheduler.vue` | Editor composition, design choices, controls and preview inside the authenticated admin workspace |
| `composables/useInstagramEditor.ts` | Selection, suggestions, visible stats, fixtures, draft and caption state |
| `composables/useSchedulerPicks.ts` | Candidate batches, thumbnail picks and removal of unavailable players |
| `components/SchedulerPostHistory.vue`, `components/SchedulerHistoryPlayerLink.vue`, `composables/useSchedulerPostList.ts`, `composables/useSchedulerClock.ts` | Masonry history gallery, player linking, filters, session cache and a local clock for relative labels (no polling) |
| `components/SchedulerInstagramPost.vue` | Shared Instagram-style account header, image frame, decorative action icons and caption spacing for the editor and History |
| `components/SchedulerHistoryPostCard.vue`, `utils/instagram-caption.ts` | Saved-post cards, full captions, safe hashtag styling, status icons and card menus |
| `composables/useInstagramExport.ts` | Asset readiness, PNG capture, download and explicit scheduling |
| `server/api/scheduler/retry-x.post.ts` | Authorized retry of a rejected X submission with an editable caption |
| `utils/instagram-templates.ts` | Content formats, normalized player data, stat labels and formatting |
| `utils/instagram-designs.ts` | Design IDs, stable club palettes and transfer calculations |
| `components/SchedulerPostPreview.vue` | Responsive display of the fixed-size artwork |
| `components/SchedulerTemplateEditor.vue`, `composables/useSchedulerCanvas.ts` | Inline selection, group navigation, move/resize, snapping, alignment and contextual toolbars |
| `composables/useSchedulerLayouts.ts`, `utils/scheduler-layout.ts`, `utils/scheduler-element.ts` | Browser-saved layout overrides, undo/redo, geometry, validation and artwork transforms |
| `components/SchedulerPostArtwork.vue` | Shared artwork shell, branding, gameweek and transfer footer |
| `components/SchedulerPlayerDesign.vue` | A–H player layouts |
| `components/SchedulerComparisonDesign.vue`, `components/SchedulerComparisonPortrait.vue`, `components/SchedulerComparisonStats.vue` | Distinct A–J comparison layouts, paired identities and aligned stats |
| `components/SchedulerAnalystDesign.vue`, `components/SchedulerHeroDesign.vue` | I and J layouts |
| `components/SchedulerPlayerPhoto.vue`, `components/SchedulerArtworkAsset.vue` | Portrait bounds, image loading and missing assets |
| `components/SchedulerPlayerName.vue`, `components/SchedulerStatGrid.vue` | Fitted names and reusable stat presentation |
| `components/SchedulerClubGraphics.vue`, `components/SchedulerTransferBar.vue` | SVG backgrounds and the shared transfer bar |
| `server/api/image-proxy/[...slug].get.ts` | Shared image proxy; preserve other consumers |
| `public/scheduler/ASSETS.md`, `public/fonts/`, `assets/css/instagram-artwork.css` | Asset sources, font files, licenses and font declarations |

Read the current export composable and server handlers before changing external integrations. The editor uploads one PNG to Cloudinary, then `/api/send-buffer-post` reserves separate Instagram and X posts in one Convex mutation. Internal actions submit them to Buffer and record each result; `/api/scheduler/status` reports task progress while the page is open. Each post uses its channel's next available queue slot. `/api/buffer-status` checks both connections. Buffer call budget: channel lookups (`server/utils/buffer.ts`) are cached on the server for one hour, and a missing channel is rechecked after five minutes. A Buffer 429 makes the server stop sending Buffer requests for fifteen minutes; cached channel data still serves during that window. Opening the editor adds no Buffer requests once the channel cache is warm. Opening History adds one import request at most every ten minutes per session. Do not add a request that bypasses this cache. The legacy Instagram builder retains its single-channel submission. The Buffer key must be set as `BUFFER_API_KEY` in the Convex deployment environment as well as the Nuxt server environment. If more than one X channel is connected, set `BUFFER_X_CHANNEL_ID` in the Nuxt server environment. Do not replace this with an older integration described in chat history. Never print credentials or put server secrets in public configuration.

Scheduler history, status, caption generation and submissions require the existing admin session at the server. State-changing requests also require the same origin. The legacy Instagram builder submits through the protected Buffer handler; do not expose an automation webhook in browser configuration. Local protections require an authorized release and verification before they apply to the hosted site.

## Design direction

Build reusable artwork in Vue, HTML, Tailwind and SVG. Generated concept sheets and supplied screenshots are design references. Do not bake them into the exported artwork. Text, stats, player photos, crests, backgrounds and transfer values must remain data driven.

The player is the hero. Use a large, correct portrait, clear name, club crest, club name, position and a small set of readable stats. Make the information easy to scan at Instagram size.

Support every club in the current data, not just Manchester City. Use club colours or a complementary palette that works with the jersey. Club identity must use stable club codes. Avoid dark text on dark club colours; use a light field or a contrasting text colour. A background effect must never reduce text readability.

Keep FPL Insights small, discreet and blended into the design. It must not compete with the player name. Keep the gameweek clear.

The full-screen editor keeps its viewport-height workflow and fixed-size artwork. Align its top toolbar and bottom player-pick rail to the shared `.site-content-rail` from `assets/css/main.css`; retain the narrower preview canvas. History uses the full rail width for its masonry gallery.

### Existing design family

Keep the choices distinct while sharing data, assets and export behavior. The source defines the current names and IDs.

| Option | Design | Direction |
| --- | --- | --- |
| A | Editorial | Light paper, bold name, large portrait and aligned stat rules |
| B | Matchday | Dark club poster and one leading stat |
| C | Scout report | Open stat ledger with a supporting portrait |
| D | Studio | Light club or complementary field, dark readable name, portrait left and leading stat right |
| E | Club edition | Club palette and abstract SVG structure |
| F | Warm contrast | Complementary paper, portrait left and name right |
| G | Night game | Dark club field, large player and restrained lights away from club text |
| H | Club profile | Stat ledger beside a large portrait that rises above its background box |
| I | Analyst | Dark stat ledger beside a large framed portrait |
| J | Hero | Central portrait, large background name and surrounding stats |

The design gallery must render the active content format, selected players, palette and stats. Never force its thumbnails to spotlight mode. Each A–J comparison must retain a distinct composition, rather than changing only the background colour. Keep the first player on the left or top and use the same stat order for both players.

Visual designs are separate from content formats. Preserve spotlight, comparison, shortlist, fixture and transfer workflows when changing a design. Do not assume every content format uses the single-player layout.

## Portraits, edges and borders

- Anchor the portrait and its section background to the same bottom boundary. Use their shared container or layout flow instead of separate hard-coded positions that can drift when stat rows change height.
- The visible bottom of the photo must meet that boundary. Check the rendered image as well as its wrapper: borders, padding and transparent image space can create a visible gap.
- The portrait must not cross or cover the lower divider or stats panel. In H, the player may rise above the top of the coloured box, but its bottom must end at the box's bottom edge.
- Keep faces and heads fully visible. Use contained, bottom-aligned portraits; do not crop the player with `object-cover` to fill a box. Size the portrait generously without crowding key information.
- Keep useful section dividers and panel borders. Do not remove every border. Remove duplicate, floating or misaligned rules, especially a photo underline beside an existing stats divider.
- Avoid unnecessary nested cards and outlines. One clean section boundary is enough.
- Keep club name, position and crest in separate layout space. They must not overlap each other. Allow long club names to fit or wrap.
- In D, retain the light background and high-contrast name. Keep the crest and club text beside each other, with the leading stat below them.
- In G, keep glow and floodlight shapes away from the club name and position. A readable text area takes priority over the lighting effect.

## Backgrounds and typography

Use code-generated SVG graphics, abstract stadium structures, pitch lines, sweeps and restrained lighting. Do not add real stadium photographs. Do not add raster AI backgrounds to the coded templates.

Use the existing self-hosted display and number fonts and preserve their licenses. Fit long player names with the shared name component. Do not allow long names or large values to escape the artwork or collide with other content. Check the final layout after fonts load.

Use Tailwind for layout and styling and Nuxt UI for editor controls where appropriate. Keep inputs and textareas full width at both their component root and inner control. Keep state in focused composables and reusable artwork parts in shared components; do not keep growing the page file.

## Player identity and data

Use one normalized player record for the name, portrait, club, position and stats. Choose portraits from the player's photo code and crests from the club's stable code. Never pair names and images by array position, randomized lists or a guessed seasonal ID.

Keep recommendations deterministic across server rendering and client hydration. Randomizing the two renders separately caused names and portraits to disagree. Do not reintroduce that behavior.

Wait for both channels' post history before showing player thumbnails. Exclude players queued on either channel, including pending or uncertain submissions, and players with any recorded published post on either channel, including earlier gameweeks. Remove them when history or a local submission changes. “Show more players” adds the next eight eligible candidates without replacing edited picks or repeating visible players. Buffer posts without linked player identities cannot supply player exclusions; link those players in History.

Mix thumbnail picks across differential, most-bought, most-sold, budget, form and completed-gameweek standout stories. Keep the existing available-player and 90-minute eligibility checks. Differential picks need ownership below 10%, form of at least 4 and 270 season minutes. Budget picks use the same form/minutes checks and position-specific ceilings: £4.5m for goalkeepers/defenders, £6.0m for midfielders and £6.5m for forwards. In-form picks need form of at least 5 and 270 season minutes. Transfer stories use the top ten eligible players for gameweek buys or sales separately; calculate ranks before posted-player exclusions and label their eligible-player scope. Standouts need at least eight event points and a current gameweek marked finished and data checked. Skip unavailable categories instead of inventing reasons. Each pick carries its evidence and angle into the thumbnail, artwork stats and caption prompt. Buying/selling activity is a discussion angle, not a buy/sell recommendation, and gameweek transfers must never be described as 24-hour movement.

Preserve the strict image-proxy path for scheduler assets. Missing images must show an honest missing-asset state, not an unrelated player. An archive fallback must preserve the same player identity. An older jersey is not proof of the wrong person, and a matching URL or successful image load is not proof of the correct person. Visually check the actual portrait before claiming the identity is verified.

Preserve units and periods: price is supplied in tenths of a million; ownership is a percentage; season totals and gameweek values are different fields. Missing values must remain unavailable, not become invented zeros. Do not infer availability, injuries, starting lineups or future returns from unrelated stats.

In the player thumbnail strip, overlay the selection reason on the thumbnail with a distinct icon and colour for each story angle. Keep the supporting numbers readable over a dark fade and keep these editor badges outside the exported artwork.

### Optional player age

24 October 2026: normalized players retain the official `birth_date` as optional `birthDate`. Show a small `26 yrs` identity badge near the player name, using the shared `PlayerAge.vue` artwork size. Keep it separate from position text and omit it entirely when the birth date is unavailable or invalid. `SchedulerPlayerName.vue` supplies the shared badge; the Hero background lettering suppresses it in favor of a separate readable badge. Analyst, shortlist, fixture and picker identities use the same badge. Keep legacy Instagram cards free of invented zero ages. The shared calculation uses a serialized reference date for consistent server/client output. Local production build, component compilation and age edge-case checks passed; browser artwork checks and hosted/export verification remain separate. No upload, generation, scheduling or posting action was used.

## Shared transfer bar

Use `SchedulerTransferBar.vue` for every design. Keep the same meaning and structure: gameweek transfers, total movement, one proportional in/out bar, and the incoming/outgoing values.

Adapt the bar's text, track and segment colours to the template. It must blend into its surface; do not paste the reference's black rectangle onto every design. Keep labels short, values clear and green/pink segments distinguishable on light and dark backgrounds. Do not replace the bar with unrelated badges or separate charts in individual designs.

Use gameweek incoming/outgoing values. Total movement is incoming plus outgoing, not net transfers. Preserve safe behavior for zero, unavailable or invalid values; avoid invalid percentages. Combined posts must clearly identify combined transfers.

## Copy and captions

Artwork contains useful player information only. Do not add filler such as “Source: Fantasy Premier League”, “Totals are season totals”, “Selected player”, “Generated with AI precision”, or decorative slogans copied from a reference. Keep period semantics correct in code and captions without adding unwanted footer prose.

Caption generation is an explicit action and creates separate editable Instagram and X captions from the same supplied facts and selected stats. Aim for a short X caption suitable for a free account; Buffer enforces the channel's actual limit. A failed or stale request must not overwrite the current draft. Do not call a paid generation endpoint merely to check a visual change. Fixture data is loaded for only the first selected player and is the only fixture list sent with the caption draft. In comparison posts, the second player’s fixtures are not fetched or included; do not describe both schedules unless the data flow changes.

24 October 2026: the scheduler uses the shared admin navbar and collapsible sidebar. The sidebar state is saved in browser storage and restored after refresh. Caption failures now appear below the post preview with specific messages for missing configuration, rejected credentials, unavailable model, rate limits and other provider failures. The preview adds space after the username and lets the caption card keep its full height in the desktop scroller. Browser verification remains open.

## Preview, export and scheduling

History offers separate Instagram and X views in a full-width masonry gallery. Fit four columns when the available content width is at least 72rem, three from 52rem, two from 32rem, and one below that. Keep each card intact within its column and use saved artwork rather than regenerating historical images from current player data. Show the full caption without More/Less controls, and colour hashtags blue with escaped text rendering. Link player names to Buffer for posts with a Buffer record. Clicking artwork opens its platform permalink when available, otherwise the full image; do not add a separate Instagram button. Put Delete from history in every card menu. A failed X submission that Buffer did not accept can be edited and retried from X history without resending Instagram. Never automatically retry an uncertain result. Keep player linking in the menu for Buffer-imported posts because it supplies player exclusions for future picks. Show a visual loading indicator and retain loaded pages, filters and pagination during navigation in the same browser session.

Load saved history on entry. Buffer is contacted only when History is opened, and then only if the last Buffer import in this session is more than ten minutes old. Filters, search and paging read saved history from Convex only. Do not add timers, tab-focus refreshes, or per-minute status checks to History; status changes appear when History is opened again. The editor's submission check reads its Convex job every 1.8 seconds while a submission is in progress and makes no Buffer request. Show the existing compact, dismissible notice on a failed import. No Refresh button is required; "Older from Buffer" is an explicit user action. Keep older-history pagination available and invalidate saved history after scheduler changes. Status reconciliation must only read Buffer posts and update saved history; never create or retry a publishing request.

Show status as a small icon beside fplinsights in the card's top bar: a green tick for published, a blue clock for scheduled, and the existing warning/error icons for other states. Omit the visible Published/Scheduled wording. Keep an accessible status label and hover title. Once a scheduled time passes without provider confirmation, use an amber clock labelled Awaiting confirmation; elapsed time must never imply Published. Display the timestamp below the caption, using today, yesterday or tomorrow for nearby dates and a short calendar date otherwise, in IST. Use Buffer's confirmed publication time and keep the full timestamp on hover. Do not substitute creation time for an unknown publication or scheduled time.

The overview shows published counts for the last 7 and 30 rolling days, plus current scheduled and failed counts, across saved history rather than the visible page or filters. Count publishing by `sentAt`; exclude undated published posts and label that omission. Entries of any status can be soft-deleted from history. Keep deletion durable across Buffer refreshes without deleting, cancelling or unpublishing anything in Buffer or Instagram. Retain player exclusions for posts that remain queued or published on the platform. Authorize deletion on the server and verify the entry's channel. The earlier failed-only endpoint remains for compatibility; new card menus use the general history-delete endpoint and mutation.

The single-player A–J previews support inline layout editing. Keep editor chrome outside the captured artwork. Combine layout controls, caption generation and scheduling in one dark, rounded floating toolbar above the player thumbnail strip. Keep scheduling as a distinct primary action and retain tooltips, accessible labels and disabled states. Reserve toolbar and status space; selection, group navigation, edit mode and saving must not move the preview, caption or surrounding controls. Contextual toolbars and group breadcrumbs float over the preview. Keep their menus in portals so artwork clipping does not hide them.

Use a pencil and an Edit label to enter layout editing, and Done to leave it. Show snapping and artwork item controls only during editing, and show Undo and Redo only when available during editing. Show Save only for unsaved layout changes, including after leaving edit mode. Show caption generation and scheduling outside edit mode.

Keep the toolbar height fixed as controls change. Animate its width smoothly from the centre, including when entering or leaving edit mode, and respect reduced-motion settings.

Save layout explicitly stores overrides for the design and content format in this browser. Apply them to other players through the same draft used by the preview, thumbnails and export. Layout saving does not upload or schedule a post. Preserve the original coded layout when there are no overrides, and keep reset operations undoable.

Keep individual stat values and labels editable within their groups. Use stable stat-based IDs and account for parent scaling when moving or resizing a nested part. Text alignment is a presentation change; values still come from the player data. Double-click or Enter opens a group, and the breadcrumb returns to its parent. Keep snapping bypass, keyboard nudges, undo/redo and accessible item selection available.

Keep the artwork at 1080 × 1080. Scale its preview to fit the editor; export the unscaled artwork. Keep preview and export driven by the same draft and components.

Wait for fonts and image readiness before capture. Preserve loading/error handling and draft revision checks. An old PNG or caption must not be presented as current after the draft changes. Clean up object URLs and observers on disposal.

Download and scheduling are separate explicit actions. Preserve visible progress, actionable errors and disabled states. Do not auto-upload or auto-post when a player, design or stat changes. Background Buffer submissions must be explicitly enqueued by the user, update Convex history on completion, and never retry a request with an uncertain provider result automatically. Keep progress space reserved so status updates do not move the layout. Show Buffer success only after the provider confirms it, and use player, channel and scheduled time in user-facing feedback instead of provider IDs.

27 October 2026: paired Instagram and X scheduling is implemented locally. TypeScript checks, mocked submission and retry checks, and mocked Brave editor/history checks passed. A Node 24 build and authenticated Buffer and hosted verification remain open; no post or image was submitted during these checks.

## Verification and handoff

Use the smallest relevant checks. A documentation-only change needs link and diff checks, not a build. A small visual change needs a rendered check of the changed templates; do not add tests that repeat CSS values. Run broader checks only when the implementation warrants them.

For artwork changes, check:

- The actual preview at a useful size, after fonts and photos load.
- Portrait/background bottom edges, visible gaps and lower-border overlap.
- Player identity, long names, club crest/name spacing and text contrast.
- Dark, light and complementary club palettes when affected; do not validate only City.
- Existing shared components and other affected templates, without redesigning unrelated layouts.
- Editor fit on a narrow screen when editor layout changes.
- The exported PNG when capture/export changes; preview appearance alone does not verify the downloaded file.

Use the open in-app browser when requested and available. Otherwise use connected Brave. State browser failures honestly and distinguish the source change, preview check, PNG check and provider confirmation. Never call upload, scheduling, posting or webhook endpoints as a smoke test without explicit authorization. Do not claim success from a build, HTTP 200, asset URL, or button state alone.

Maintain this guide as the scheduler's design and workflow rules. Update it when the user changes a durable decision. Keep temporary progress reports and verification logs out of it.
