# Instagram scheduler guide

Read this guide before changing `/instascheduler` or its artwork, editor, asset loading, export, or scheduling code. The root [AGENTS.md](../../AGENTS.md) still applies. Current source and the user's latest instructions take priority over an older design decision here.

## Scope and file ownership

The scheduler is a separate workflow. Do not include it in homepage, SEO, blog, or growth changes unless the user requests scheduler work. Preserve unrelated changes. Use npm. Do not commit, push, publish, upload, schedule, or post without explicit authorization for that action.

| Source | Responsibility |
| --- | --- |
| `pages/instaScheduler.vue` | Editor composition, design choices, controls and preview |
| `composables/useInstagramEditor.ts` | Selection, suggestions, visible stats, fixtures, draft and caption state |
| `composables/useInstagramExport.ts` | Asset readiness, PNG capture, download and explicit scheduling |
| `utils/instagram-templates.ts` | Content formats, normalized player data, stat labels and formatting |
| `utils/instagram-designs.ts` | Design IDs, stable club palettes and transfer calculations |
| `components/SchedulerPostPreview.vue` | Responsive display of the fixed-size artwork |
| `components/SchedulerPostArtwork.vue` | Shared artwork shell, branding, gameweek and transfer footer |
| `components/SchedulerPlayerDesign.vue` | A–H player layouts |
| `components/SchedulerComparisonDesign.vue`, `components/SchedulerComparisonPortrait.vue`, `components/SchedulerComparisonStats.vue` | Distinct A–J comparison layouts, paired identities and aligned stats |
| `components/SchedulerAnalystDesign.vue`, `components/SchedulerHeroDesign.vue` | I and J layouts |
| `components/SchedulerPlayerPhoto.vue`, `components/SchedulerArtworkAsset.vue` | Portrait bounds, image loading and missing assets |
| `components/SchedulerPlayerName.vue`, `components/SchedulerStatGrid.vue` | Fitted names and reusable stat presentation |
| `components/SchedulerClubGraphics.vue`, `components/SchedulerTransferBar.vue` | SVG backgrounds and the shared transfer bar |
| `server/api/image-proxy/[...slug].get.ts` | Shared image proxy; preserve other consumers |
| `public/scheduler/ASSETS.md`, `public/fonts/`, `assets/css/instagram-artwork.css` | Asset sources, font files, licenses and font declarations |

Read the current export composable and server handlers before changing external integrations. The browser uploads the PNG to Cloudinary, then `/api/send-buffer-post` reserves the post in Convex and schedules an internal Convex action. That action submits to Buffer and records the confirmed result; `/api/scheduler/status` reports task progress while the page is open. `/api/buffer-status` supplies connection status. The Buffer key must be set as `BUFFER_API_KEY` in the Convex deployment environment as well as the Nuxt server environment. Do not replace this with an older integration described in chat history. Never print credentials or put server secrets in public configuration.

## Design direction

Build reusable artwork in Vue, HTML, Tailwind and SVG. Generated concept sheets and supplied screenshots are design references. Do not bake them into the exported artwork. Text, stats, player photos, crests, backgrounds and transfer values must remain data driven.

The player is the hero. Use a large, correct portrait, clear name, club crest, club name, position and a small set of readable stats. Make the information easy to scan at Instagram size.

Support every club in the current data, not just Manchester City. Use club colours or a complementary palette that works with the jersey. Club identity must use stable club codes. Avoid dark text on dark club colours; use a light field or a contrasting text colour. A background effect must never reduce text readability.

Keep FPL Insights small, discreet and blended into the design. It must not compete with the player name. Keep the gameweek clear.

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

Preserve the strict image-proxy path for scheduler assets. Missing images must show an honest missing-asset state, not an unrelated player. An archive fallback must preserve the same player identity. An older jersey is not proof of the wrong person, and a matching URL or successful image load is not proof of the correct person. Visually check the actual portrait before claiming the identity is verified.

Preserve units and periods: price is supplied in tenths of a million; ownership is a percentage; season totals and gameweek values are different fields. Missing values must remain unavailable, not become invented zeros. Do not infer availability, injuries, starting lineups or future returns from unrelated stats.

## Shared transfer bar

Use `SchedulerTransferBar.vue` for every design. Keep the same meaning and structure: gameweek transfers, total movement, one proportional in/out bar, and the incoming/outgoing values.

Adapt the bar's text, track and segment colours to the template. It must blend into its surface; do not paste the reference's black rectangle onto every design. Keep labels short, values clear and green/pink segments distinguishable on light and dark backgrounds. Do not replace the bar with unrelated badges or separate charts in individual designs.

Use gameweek incoming/outgoing values. Total movement is incoming plus outgoing, not net transfers. Preserve safe behavior for zero, unavailable or invalid values; avoid invalid percentages. Combined posts must clearly identify combined transfers.

## Copy and captions

Artwork contains useful player information only. Do not add filler such as “Source: Fantasy Premier League”, “Totals are season totals”, “Selected player”, “Generated with AI precision”, or decorative slogans copied from a reference. Keep period semantics correct in code and captions without adding unwanted footer prose.

Caption generation is an explicit action. Use supplied facts and selected stats. Keep manual editing available. A failed or stale request must not overwrite the current draft. Do not call a paid generation endpoint merely to check a visual change. Fixture data is loaded for only the first selected player and is the only fixture list sent with the caption draft. In comparison posts, the second player’s fixtures are not fetched or included; do not describe both schedules unless the data flow changes.

## Preview, export and scheduling

Keep the artwork at 1080 × 1080. Scale its preview to fit the editor; export the unscaled artwork. Keep preview and export driven by the same draft and components.

Wait for fonts and image readiness before capture. Preserve loading/error handling and draft revision checks. An old PNG or caption must not be presented as current after the draft changes. Clean up object URLs and observers on disposal.

Download and scheduling are separate explicit actions. Preserve visible progress, actionable errors and disabled states. Do not auto-upload or auto-post when a player, design or stat changes. Background Buffer submissions must be explicitly enqueued by the user, update Convex history on completion, and never retry a request with an uncertain provider result automatically. Keep progress space reserved so status updates do not move the layout. Show Buffer success only after the provider confirms it, and use player, channel and scheduled time in user-facing feedback instead of provider IDs.

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
