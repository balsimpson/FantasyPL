# Player wallpaper creator (`/wallpaper`): evaluation and implementation plan

Status, 13 November 2026: **Phases 1–6 and the nav/sitemap part of Phase 7 are implemented locally. None of it has been built, type-checked or browser-tested yet.** This file is the single owner document for the wallpaper feature.

### Implementation notes (13 November 2026)
- Photo spike: the PL `250x250` headshot path actually serves **500 × 500** PNGs. `premierleague25/.../500x500/{code}.png` also exists, and larger sizes returned 403. Portraits are sized at ≈1000–1150 px (≈2–2.3× upscale).
- Engine changes are backwards compatible: `ArtboardSpec` defaults to the scheduler's 1080 square, a `hidden` flag is kept only by the wallpaper parser, there is an opt-in `textContrast` binding, injectable layout storage, and `moveTo`/pinch helpers.
- The wallpaper uses a 1080 × 2400 artboard. The iPhone export is the centred 1080 × 2340 crop; both exports are at 1.2× pixel ratio.
- Layouts auto-save per design (`fpl-wallpaper-layouts-v1`). Choices are saved to `fpl-wallpaper-prefs-v1`. `?player=<code>&design=<id>` restores the player and design.
- Fonts: Anton and Oswald (self-hosted), plus Bodoni Moda and Archivo Black via Nuxt Fonts (configured in `nuxt.config.ts`).
- Device zones in `utils/wallpaper-devices.ts` are estimates until they are checked on a physical device.
- Open: the scheduler regression gate (§9.1), the wallpaper checks (§9.2), and the owner decisions in §10.

---

## 1. Goal

Add a public page at `/wallpaper` where any visitor can:

1. Pick a Premier League player.
2. Pick one of six poster-style wallpaper designs (the owner's reference sheet, described in §4).
3. Move, resize, align, layer and hide the artwork elements with the same direct-manipulation editor the InstaScheduler uses (snapping, guides, keyboard nudges, undo/redo, groups).
4. Preview the wallpaper inside a simulated **iPhone** or **Android** lock screen with the local date and time.
5. Save the wallpaper to the device as a PNG at phone resolution, or share it with the native share sheet.

The artwork stays data driven: name, portrait, crest, club colours and stats come from the normalised FPL player record. Nothing is baked from the reference image.

---

## 2. Evaluation summary

### 2.1 What can be reused from InstaScheduler

| Existing piece | Reuse | Notes |
| --- | --- | --- |
| `composables/useSchedulerCanvas.ts` | **Yes, after generalising** | Pointer-based move/resize, snapping, groups, keyboard, alignment and layering all apply. It hard-codes the 1080 px square (see §2.2). |
| `composables/useSchedulerLayouts.ts` | **Yes, after a small change** | Undo/redo stacks, gesture begin/end/cancel and explicit save are all reusable. The storage key and parser are scheduler-specific, so they need to be injectable. |
| `utils/scheduler-layout.ts` | **Yes, after generalising** | `snapSchedulerBox`, `resizeSchedulerBox` and the transform types are pure. Bounds are hard-coded to 1080. |
| `utils/scheduler-element.ts` (`v-scheduler-element`) | **Yes** | The directive applies transforms without wrapper elements. Text contrast is special-cased to the id `player-name` and should become a binding flag. |
| `components/SchedulerTemplateEditor.vue` | **Pattern only (Phase 1). Shared overlay later.** | Its toolbar, contextual menu, breadcrumbs and selection boxes are what we want. It is typed to `InstagramDraft`, renders `SchedulerPostPreview` directly, and assumes a square in its guide and context-menu maths. |
| `SchedulerPlayerName.vue`, `SchedulerStatGrid.vue`, `SchedulerPlayerPhoto.vue`, `SchedulerArtworkAsset.vue`, `PlayerAge.vue` | **Yes** | They take `InstagramPlayer` and already handle fitted names, nested stat targets, missing-asset states and asset readiness (`data-asset-state`). |
| `utils/instagram-templates.ts` (`normalizeInstagramPlayer`, stat formatting) | **Yes, extended** | It has one normalised player identity (photo from photo code, crest from stable club code). The wallpaper needs extra stat keys (§6.2). |
| `utils/instagram-designs.ts` (`getInstagramClubTheme`) | **Yes** | Stable club palettes for a "Club colours" palette mode. |
| `components/SchedulerClubGraphics.vue` | **Partly** | SVG backgrounds can feed the Floodlit and Split designs. |
| `composables/useManagerTeamImage.ts` | **Yes, best export base** | This is already a *public* PNG flow: it waits for fonts and images, then supports `html-to-image` capture, download and `navigator.share({ files })`, with object-URL cleanup. |
| `composables/useInstagramExport.ts` | **No** | It calls `/api/buffer-status` on mount, and its capture is fixed at 1080 × 1080. It is also tied to Cloudinary and Buffer. A public page must not load it. |
| `server/api/image-proxy/[...slug].get.ts` | **Yes, unchanged** | It enforces a strict host allow-list and falls back to an archived headshot with the same player code. Other consumers depend on it, so don't change its contract. |
| `layouts/default.vue`, `.site-content-rail` | **Yes** | It's a public page, so it inherits the sticky nav and player search. The editor's outer controls align to the rail (DESIGN.md "Shared page frame"). |

**Verdict:** this is feasible and a good fit. Roughly 60–70% of the editor engine carries over. The main work is (a) making the canvas engine handle any artboard size, not just a square, (b) building six new tall-format templates, (c) the device preview overlays and (d) making editing work well by touch on a phone.

### 2.2 Blocking coupling to fix first: the 1080 × 1080 assumption

The square is hard-coded in the following places. Every one must read from an artboard spec instead:

- `scheduler-layout.ts`: the snap targets `[0, 48, 540, 1032, 1080]`, the clamp in `snapSchedulerBox`, the `roomX`/`roomY` maths in `resizeSchedulerBox`, and the `±1080` validation in `parseSchedulerLayouts`.
- `useSchedulerCanvas.ts`: the `ratio = width / 1080` lines (measure, start), the `extent` in `align()`, the `maximum` in `resize()`, and the keyboard clamp.
- `SchedulerTemplateEditor.vue`: the `left: guide / 10.8 %` guide positioning (it assumes a square), the `previewWidth / 1080` ratio in `contextStyle`, and the `previewWidth - 48` vertical bound.
- `SchedulerPostPreview.vue`: `aspect-square` and the scale from width only.

Fix: add an `ArtboardSpec` with **scheduler defaults**, so the scheduler's behaviour and saved layouts are untouched (§7, Phase 1).

### 2.3 Risks and gaps found

| # | Risk | Severity | Mitigation |
| --- | --- | --- | --- |
| R1 | **Portrait resolution.** `photoUrl` is the PL `250x250` headshot, and the proxy fallback is `110x140`. The reference designs show the portrait 800–1000 px wide on a 1080-wide artboard, a 3–4× upscale that will look soft on a phone. | **High** | Phase 0 spike: check what larger official sizes exist for the same photo code. Don't guess URLs; verify them. If none exist, size the portrait so its upscale stays ≤ ~2.5×, and use treatments that tolerate softness (duotone, halftone, grain, a lower-body fade into the background). Don't use AI upscaling, and never swap in a different photo of the player. |
| R2 | **Rights and branding.** The reference sheet uses the Premier League lion and a "Fantasy Premier League" wordmark. The page would also let the public download PL player photography. The scheduler uses these photos for the site's own posts, but a public download tool is a wider use. | **High (owner decision)** | Don't reproduce the PL lion or wordmark. Use the small FPL Insights mark (the scheduler's rule: "small, discreet and blended"). The owner should confirm that public download of the official headshots is acceptable. The FPL API is unofficial and its terms can change. |
| R3 | **The lock-screen clock covers the top of the design.** References 1, 3, 4 and 6 put their hero number or numerals at the top. On iOS that area holds the clock and widgets. | Medium | Adapt each template to the tall format (§4). Show safe-zone guides in the editor, and let the snapping engine snap to safe-zone edges. Warn (without blocking) when a data element overlaps the clock zone in the active preview. |
| R4 | **Touch editing.** The canvas already uses pointer events and `touch-none`, but the 4 px corner handles and the 244 px contextual toolbar are desktop sized. There's also no pinch gesture. | Medium | Larger hit targets on coarse pointers, pinch-to-scale on the selected item, and a bottom-sheet inspector on narrow screens (§5.3). |
| R5 | **Export size and memory on phones.** iOS Safari limits canvas area, and very large `html-to-image` captures can fail. | Medium | Capture at 1080 × 2400 at pixel ratio 1 by default, with an optional 1.5× "Sharper" export. Test on a physical iPhone before offering larger sizes. Show a clear error with a retry. |
| R6 | **Missing stat keys.** The references use clean sheets, saves and bonus, which `InstagramStatKey` lacks. | Low | Add them to the wallpaper's stat model (§6.2). Confirm the field names against a live bootstrap response before wiring them up. Keep `null` for missing values, never invented zeros. |
| R7 | **Reference 4's "01".** FPL data has no shirt number. | Low | Make that slot a choice: a computed rank (for example "#1 GK by total points" over eligible players), the gameweek, or a short custom text the user types. Don't fabricate a squad number. |
| R8 | **Scheduler regression.** The scheduler is out of scope by default. The owner's request to reuse its editor authorises shared changes, but only backwards-compatible ones. | Medium | Defaults equal today's constants. Run the regression checks in §9.1 before any wallpaper UI work. |
| R9 | **Large public payload.** `/api/players/get-all` returns the whole bootstrap. | Low | Reuse `usePlayerSearchData` and the player directory snapshots, or add a small `/api/wallpaper/players` projection. Don't send the full bootstrap to every visitor. |
| R10 | **Fonts.** Only Anton and Oswald (OFL) are self-hosted. Reference 3 needs a high-contrast Didone serif, and references 1 and 5 use a heavy rounded grotesk. | Low | Add one or two OFL families, self-hosted with their licence files, next to the existing ones. Anton has no italic, so use a skew transform for the slanted poster type. |

---

## 3. Product decisions (proposed defaults; owner to confirm)

- **Public and indexable.** `/wallpaper` uses the default layout and goes in the sitemap. It doesn't need an account. Per-player deep links come later (§7, Phase 7).
- **One canonical artboard:** **1080 × 2400 px (20:9)**. The iPhone export is a **centred 1080 × 2340 crop (19.5:9)**, trimming 30 px top and bottom, so one layout works for both platforms. Every critical element must sit inside the shared safe rectangle `y ∈ [30, 2370]`. Check the actual device resolutions and aspect ratios in Phase 0. Don't hard-code specific models.
- **Drafts stay in the browser.** Save to `localStorage` with an explicit Save, like the scheduler. There is no account sync. A failed save keeps the draft in memory and shows an error (it is never silently dropped).
- **Overlays are preview-only.** The exported PNG contains the artwork alone.
- **No native `alert`/`confirm`.** Destructive actions (reset the layout, discard a draft) use in-app confirmation modals.

---

## 4. Template family (from the reference sheet)

The six references are roughly 2:3. A phone is roughly 9:20, so each design needs an extra ~45% of height. The general rule is that the **top third becomes atmosphere**: background type, texture and the portrait's head room, which can sit behind the clock. The **data moves to the middle and lower band**. The **bottom ~8%** stays visually quiet because of the camera/flashlight buttons and the home indicator.

| ID | Name | Reference | Tall-format adaptation | Movable elements (stable ids) |
| --- | --- | --- | --- | --- |
| `royal` | Royal | Blue field, giant ghost letters plus a sweep, huge points number with an "FPL POINTS" label, a footer strip with two stats | Ghost letters (the player's surname, or "FPL") fill the top 40% behind the clock. The portrait is centred and rises into them. The giant number and its label sit at ~62–75% height, and the two-stat strip at ~84%. | `bg-type`, `portrait`, `hero-stat` (group: value, label), `stats` (group), `brand` |
| `poster` | Name poster | Lime field, giant slanted condensed surname behind the portrait, season tag, black wedge, three-stat footer with dividers | The surname is fitted and skewed, running vertically through 10–55% (this suits the iOS depth effect). The portrait overlaps it. The wedge sits bottom right, and the three-stat row at ~82%. | `player-name`, `portrait`, `wedge`, `stats` (group), `season`, `brand` |
| `gallery` | Gallery serif | Lavender field, large Didone "84 / PTS", a hairline, spaced-caps stat lines, portrait right | The serif numerals move below the clock zone (~32–50%). The hairline and stat lines follow, and the portrait anchors bottom right, cropped at the shoulders. | `hero-stat` (group), `rule`, `stats` (group), `portrait`, `brand` |
| `halftone` | Halftone print | Cream paper, giant red halftone numerals, stacked red italic stats in the right column | The halftone numerals (rank, gameweek or custom text, see R7) fill 15–55%, partly behind the clock. The stacked stat column is on the right at ~35–70%, and the portrait sits bottom left. The halftone is done with an SVG pattern, not a raster. | `bg-number`, `stats` (group), `portrait`, `brand` |
| `floodlit` | Floodlit | Deep purple with a radial glow, central portrait, centred giant number with a spaced label, two split stats | The glow is centred behind the head at ~35%. The giant number sits at ~66% and the split stats at ~80%. Follow the scheduler's G and J lighting rule: glow never sits behind text. | `glow`, `portrait`, `hero-stat` (group), `stats` (group), `season`, `brand` |
| `split` | Split block | Orange/blue diagonal blocks, a stacked stats column on the right, a form/bonus footer | The diagonals run the full height. The stacked stat column is right-aligned at ~28–62%, the portrait sits left of centre at the bottom, and the footer stat pair is at ~88% (above the home-indicator zone). | `blocks`, `stats` (group), `footer-stats` (group), `portrait`, `brand` |

**Palette modes:** Signature, club colours, and a custom background with matching accents and light or dark text. Every mode must pass a text-contrast check against its field. Pink goalkeeper kits on lime or orange show that some combinations clash, so the jersey hue is a reason to switch palette, not to drop the design.

**Stats are position aware by default:** GK/DEF use points, clean sheets and saves (GK) or goals plus assists (DEF). MID/FWD use points, goals and assists. The user can change the hero stat and the supporting stats from the inspector. Values always come from data.

---

## 5. Page and editor UX

### 5.1 Layout

The design meets the owner's bar for editors: a modern full-screen app, not a form-heavy admin page.

- **Desktop:** the page header is followed by a single editor surface on the shared rail.
  - Centre: the phone preview frame at viewport height.
  - Left (compact): the player picker plus design thumbnails, rendered live with the selected player like the scheduler's design gallery.
  - Right: design, colour and stat controls stay visible while an item is selected. Each stat uses a searchable dropdown with the player's current value. The panel scrolls vertically when needed.
- **Mobile:** the phone preview fills the screen. Player and design are horizontal filmstrips under it. The selected item opens a compact toolbar beside the selection, as on desktop.
- **Canvas controls.** The canvas is always editable. Undo, Redo, Snap, Layers and Save are below it. The phone selector, dice and Reset are above it.
- Status text (saving, saved, export phase) sits in **fixed-size slots**, so changes never shift the layout.
- Page elements enter with the site's shared subtle staggered motion.

### 5.2 Editing behaviour (parity with the scheduler)

Everything in TEMPLATE_EDITING.md "Inline Layout Editing" applies: select, drag, proportional corner resize, snap to edges, centres, margins and other items, Alt to bypass, Shift to constrain, arrow keys ±1 / Shift ±10 artwork px, Ctrl/Cmd-Z/Y/S, group drill-down (double-click or Enter) with breadcrumbs, text alignment, layer up/down, reset item or all (undoable), and text contrast (None, Outline, Shadow, Exclusion).

The wallpaper adds:

- **Numeric readouts.** The inline toolbar opens position and size controls and shows the selected item's `x`, `y`, `w`, `h` in artwork px and scale in %, each editable, so spacing can be kept consistent.
- **Layer appearance and reset.** The inline toolbar opens the text colour picker in one click and has opacity, bring to front, send to back, and reset controls. The Reset button above the canvas restores the template's signature colours, backdrop, text, layers, and the recommended stats for the player's position. Undo and Redo include the whole reset. Local Brave verified reset on all six templates, undo for a mixed backdrop and custom colour, and direct colour selection.
- **Safe-zone guides.** Faint bands for the active preview's date and time area. Their edges are snap targets.
- **Show/hide per element.** Use Hide in the inline toolbar. Use Layers → Hidden items → Show to restore an item, including a part of a group.
- **Remix wallpaper.** The dice combines the composition from one template with the backdrop from another and keeps the selected player and any active custom background. The club logo is an independent layer that can be moved, resized, or hidden.
- **Swap content.** For the hero stat, supporting stats, background text (surname, "FPL", rank, gameweek or custom ≤ 3 chars) and palette mode. The data stays live.
- **Portrait framing.** Move and scale the portrait. The scheduler's head-visibility rule still applies: no `object-cover` cropping of the face by default, and a warning if the head leaves the artboard.

### 5.3 Touch

- `pointer: coarse` sets handles to ≥ 24 px visual and ≥ 44 px hit area, and the selection outline gets thicker.
- **Pinch on the selected item** scales it around the pinch centre. Two-finger pan on empty canvas pans the preview when zoomed.
- A tap selects, and a tap on empty canvas deselects. Long-press opens the item menu. Drag starts only after the existing 3 px threshold, so scrolling isn't hijacked outside edit mode.

### 5.4 Device preview overlays

The iPhone and Android lock-screen previews show the local date and time. The clock updates once a minute. The lower corners show flashlight and camera shortcuts on iPhone, and wallet and camera shortcuts on Android. The shortcuts stay above the artwork during edits. The overlay sits outside the captured artwork.

- Safe-zone percentages are **estimates** stored as named constants in one file, `utils/wallpaper-devices.ts`. Measure and correct them against real screenshots in Phase 0.

---

## 6. Data model

### 6.1 Types (`utils/wallpaper.ts`)

```ts
export type WallpaperDesignId = 'royal' | 'poster' | 'gallery' | 'halftone' | 'floodlit' | 'split'
export type WallpaperPalette = 'reference' | 'club' | 'complementary'
export type WallpaperDevice = 'iphone' | 'android'
export type WallpaperScreen = 'lock' | 'home'
export type WallpaperBackgroundText =
  | { kind: 'surname' } | { kind: 'brand' } | { kind: 'gameweek' }
  | { kind: 'rank'; scope: 'position' | 'all' } | { kind: 'custom'; text: string } // custom: ≤ 3 chars, sanitised

export interface WallpaperDraft {
  version: 1
  playerCode: number            // stable identity; re-resolved against the current catalogue on load
  design: WallpaperDesignId
  palette: WallpaperPalette
  heroStat: WallpaperStatKey
  stats: WallpaperStatKey[]     // 1–3 depending on design
  backgroundText?: WallpaperBackgroundText
  layout: SchedulerLayout       // reuse transform type (+ optional `hidden`)
  updatedAt: string
}
```

- The draft stores the **player code**, never a name or photo URL. On load, the code is resolved through `normalizeInstagramPlayer`. If the player is no longer in the current catalogue, show an honest "This player isn't in the current FPL data" state with a picker. Never substitute someone else.
- Each design has its own layout, keyed `wallpaper:<design>`, so a layout tuned for one design never corrupts another.

### 6.2 Stats

`WallpaperStatKey` is `InstagramStatKey` plus `clean_sheets`, `saves`, `bonus` and `goals_conceded`. Extend `normalizeInstagramPlayer` behind an **additive** optional field, or add a thin wallpaper normaliser that calls it. Don't change the scheduler's `InstagramStatKey` union or its stat picker. Labels and formatting live in `utils/wallpaper.ts`. Season totals and gameweek values stay separate fields.

### 6.3 Storage

- Key `fpl-wallpaper-drafts-v1`, value `{ version: 1, drafts: Record<WallpaperDesignId, WallpaperDraft>, last?: WallpaperDesignId }`.
- Validation uses the generalised parser with the wallpaper artboard bounds. Malformed entries are skipped individually, never wiping the rest.
- Merge at save time (as `useSchedulerLayouts.save` does) so a second tab's drafts survive.
- If saving fails, keep the in-memory draft, show "Couldn't save in this browser. Your changes are still here." and leave Download working.

### 6.4 Player data endpoint

Preferred: reuse `usePlayerSearchData` for search. Add `GET /api/wallpaper/players`, a cached handler (`maxAge` 600, `swr`) that returns only what the picker and artwork need (code, id, names, club code, team, position, photo code, birth date, the wallpaper stat fields, status), plus the current gameweek and season. It shares the existing validated bootstrap cache (`server/utils/fpl-bootstrap.ts`). Check the serialized size against the full bootstrap.

---

## 7. Implementation phases

Each phase lists its files, and each ends with the checks in §9. Nothing is committed, pushed or deployed without the owner's explicit go-ahead (root `AGENTS.md`).

### Phase 0: Spikes and visual approval (no app code)

1. **Portrait resolution (R1).** List which official headshot sizes resolve for a sample of current player codes across all four positions, and record the results in this doc. Decide the portrait size ceiling.
2. **Rights (R2).** Owner decision on public download of official headshots and on branding (FPL Insights mark only).
3. **Device zones.** Capture real lock and home screenshots on at least one iPhone and one Android device. Measure the clock, widget and bottom-control zones as percentages, and fill in `utils/wallpaper-devices.ts`.
4. **Mockups first.** Show side-by-side visual options in one grid, rendered in the site's real style (dark shell, the existing scheduler toolbar): (a) the editor on mobile and on desktop, and (b) all six tall-format template adaptations with one real player and palette. Get the owner's choice before Phase 2.

### Phase 1: Generalise the canvas engine (shared, backwards compatible)

- `utils/scheduler-layout.ts`
  - Add `export interface ArtboardSpec { width: number; height: number; margin: number; guides?: SchedulerGuide[] }` and `export const schedulerArtboard: ArtboardSpec = { width: 1080, height: 1080, margin: 48 }`.
  - Give `snapSchedulerBox(box, others, threshold, artboard = schedulerArtboard)` the targets `[0, margin, w/2, w - margin, w]` for x and the same with h for y, plus `artboard.guides`. The clamp uses `w` and `h`.
  - Give `resizeSchedulerBox(…, artboard = schedulerArtboard)` room calculations based on `width` and `height`.
  - Add `parseLayoutRecord(raw, { keyPattern, artboard })` and keep `parseSchedulerLayouts` as a wrapper with today's regex and 1080 bounds.
  - Add an optional `hidden?: boolean` to `SchedulerElementTransform`. The scheduler parser drops it, so scheduler data is unchanged.
- `utils/scheduler-element.ts`: replace the `value.id === 'player-name'` check with `value.textContrast === true || value.id === 'player-name'`, so the scheduler is unchanged. Apply `visibility: hidden` when `change?.hidden`.
- `composables/useSchedulerCanvas.ts`: add a final optional `options?: { artboard?: ComputedRef<ArtboardSpec> }`. Replace each `1080` with `artboard.width` or `artboard.height` as appropriate. Add a two-pointer pinch path that scales the selected item (off unless `options.pinch` is set, so the scheduler is unchanged).
- `composables/useSchedulerLayouts.ts`: add an optional `{ storageKey, parse, serialize }` argument. Defaults are today's key and functions.
- **Scheduler regression gate (§9.1)** before continuing.

### Phase 2: Route, data and skeleton

- `pages/wallpaper.vue`: composition only (page head/SEO, layout regions). Keep it small and put the logic in composables.
- `composables/useWallpaperPlayers.ts`: loads `/api/wallpaper/players`, normalises players, handles search and filtering, and returns position-aware default stats.
- `server/api/wallpaper/players.get.ts`: the cached projection from §6.4.
- `utils/wallpaper.ts`: types, stat keys, labels, formatting and design metadata.
- `utils/wallpaper-devices.ts`: artboard spec (`1080 × 2400`, margin 64), iPhone crop, and the safe-zone constants from Phase 0.
- `composables/useWallpaperDraft.ts`: the active draft, per-design layouts via the generalised `useSchedulerLayouts`, and local persistence (§6.3).
- Pending, error and missing-player states. The page stays useful without JS: it server-renders the picker shell and a default featured wallpaper.

### Phase 3: Templates

- `components/wallpaper/WallpaperArtwork.vue`: the fixed `1080 × 2400` `<article data-wallpaper-artwork>` shell that picks the design.
- `components/wallpaper/designs/Wallpaper{Royal,Poster,Gallery,Halftone,Floodlit,Split}.vue`: one file per design, built with Tailwind and SVG and reusing `SchedulerPlayerName`, `SchedulerStatGrid`, `SchedulerPlayerPhoto` and `PlayerAge`. Every movable item uses `v-scheduler-element` with the stable ids from §4.
- `components/wallpaper/WallpaperPreview.vue`: scales the artboard to fit its container by **both** width and height (`min(w/1080, h/2400)`) and exposes `getElement()`.
- Fonts: add the OFL serif (and a rounded grotesk if the mockups need one) to `public/fonts/` with licence files, and declare them in `assets/css/instagram-artwork.css` or a new `wallpaper-artwork.css`.
- Each design follows the scheduler's portrait rules: the bottom of the portrait meets its boundary with no gap, the head is fully visible, and text never sits on low-contrast glow.

### Phase 4: Editor

- `components/wallpaper/WallpaperCanvasEditor.vue`: the same chrome and behaviour as `SchedulerTemplateEditor.vue`, driven by the generalised composables with the wallpaper artboard. Guides are positioned as `% of width` for x and `% of height` for y, and the context-menu bounds use both dimensions.
  - *Follow-up (optional):* extract the shared selection overlay, guides, breadcrumbs and contextual toolbar into `components/artwork-editor/ArtboardSelectionOverlay.vue`, used by both editors, once the wallpaper editor is stable. This avoids risking the scheduler during the first build.
- `components/wallpaper/WallpaperInspector.vue`: selected-item toolbar on desktop and mobile, with hide and a popover for position, scale, alignment, contrast and layer order.
- `components/wallpaper/WallpaperToolbar.vue`: the floating toolbar from §5.1.
- In-app confirm modals for resetting the layout and discarding a draft.

### Phase 5: Device preview

- `components/wallpaper/DeviceFrame.vue`: a rounded phone frame with an iPhone or Android aspect. On iPhone, it masks the artwork to the 19.5:9 crop.
- `components/wallpaper/WallpaperDeviceOverlay.vue`: shows local date and time outside `[data-wallpaper-artwork]`.
- `composables/useWallpaperStudio.ts`: updates the clock at minute boundaries.
- A clock-overlap warning: if a data-bearing element intersects the active clock zone, a quiet inline note appears in the status slot.

### Phase 6: Export, save and share

- `composables/useArtworkImage.ts`: generalise `useManagerTeamImage` (keeping a thin wrapper so the manager page is unchanged) to accept `{ width, height, pixelRatio, crop? }`.
- The export flow:
  1. Wait for `document.fonts.ready` and decode every `<img>`.
  2. Require every `[data-asset-state]` to be `ready`. If any is `missing`, block the export with a clear message rather than exporting a broken portrait.
  3. Capture `[data-wallpaper-artwork]` at 1080 × 2400 (Android), or capture and crop to 1080 × 2340 (iPhone).
  4. Check the draft revision (as `useInstagramExport` does), so a changed draft never exports stale art.
- Prepare one PNG in the browser after edits settle. Save reuses the prepared file for the current artwork and device, and can start preparation immediately after a change. Embed the same TrueType and WOFF2 fonts used in the editor.
- Actions:
  - **Download PNG** (filename `fpl-wallpaper-<player-slug>-<design>-<device>.png`).
  - **Share** (`navigator.canShare({ files })`) when supported.
  - On iOS, show a short "Save to Photos, then set as wallpaper" hint after sharing. Don't claim the page can set the wallpaper directly.
- **Sharper (1.5×)** stays off until it is verified on a physical iPhone (R5).
- Busy, progress and error states use fixed slots, and object URLs are revoked on change and on dispose.

### Phase 7: Discovery and polish

- Add a nav entry (owner to choose its placement), a sitemap entry, canonical URL, OG image and structured data. Follow `IMPROVE_SEO.md`.
- Deep links: `/wallpaper?player=<code>&design=<id>` restore the player and design (not the layout). Player profile pages can link "Make a wallpaper".
- Optional later: per-player wallpaper landing pages, but only if `IMPROVE_SEO.md` priorities support it.
- Vercel Analytics events (download, share, design chosen) only if the owner wants them.
- Documentation: update this file's status, add the `AGENTS.md` table row, add `/wallpaper` to the `AGENTS.md` project map, and add a short "Wallpaper creator" note to `DESIGN.md` (shared rail and specialised workspace).

---

## 8. File plan (new and changed)

```
pages/wallpaper.vue                                   NEW
server/api/wallpaper/players.get.ts                   NEW
utils/wallpaper.ts                                    NEW
utils/wallpaper-devices.ts                            NEW
composables/useWallpaperPlayers.ts                    NEW
composables/useWallpaperDraft.ts                      NEW
composables/useWallpaperClock.ts                      NEW (or reuse useSchedulerClock)
composables/useArtworkImage.ts                        NEW (generalised from useManagerTeamImage)
components/wallpaper/WallpaperArtwork.vue             NEW
components/wallpaper/WallpaperPreview.vue             NEW
components/wallpaper/WallpaperCanvasEditor.vue        NEW
components/wallpaper/WallpaperInspector.vue           NEW
components/wallpaper/WallpaperToolbar.vue             NEW
components/wallpaper/DeviceFrame.vue                  NEW
components/wallpaper/designs/Wallpaper*.vue (×6)      NEW
components/wallpaper/overlays/*.vue (×4)              NEW
components/wallpaper/widgets/*.vue (×3)               NEW
public/fonts/<serif>.ttf + OFL.txt                    NEW
utils/scheduler-layout.ts                             CHANGED (artboard param, defaults preserved)
utils/scheduler-element.ts                            CHANGED (textContrast flag, hidden)
composables/useSchedulerCanvas.ts                     CHANGED (artboard option, opt-in pinch)
composables/useSchedulerLayouts.ts                    CHANGED (injectable storage)
composables/useManagerTeamImage.ts                    CHANGED (thin wrapper over useArtworkImage)
server/routes/sitemap.xml.ts                          CHANGED (Phase 7)
AGENTS.md, DESIGN.md                                  CHANGED (pointers only)
```

The scheduler's page, templates, export, Buffer and Cloudinary code are **not touched**.

---

## 9. Verification

Follow the repo's rule that a build, an HTTP 200 or a button state is not proof. Record evidence here, with dates, and keep local, browser, device and hosted verification separate.

### 9.1 Scheduler regression gate (after Phase 1)

- `npm run build` passes on Node 24.
- In `/admin/insta-scheduler`: drag, resize, snapping guides, keyboard nudges, undo/redo, group drill-down, text contrast and save/reload all behave as before for all ten designs, on desktop and at 390 × 844.
- Existing `fpl-scheduler-layouts-v1` data loads unchanged, and a saved layout produces an identical downloaded 1080 × 1080 PNG.
- Run no upload, caption, scheduling or Buffer action.

### 9.2 Wallpaper checks

On 13 November 2026, added the Nuxt UI tooltip provider around the wallpaper editor to fix the `/wallpaper` server error. The editor loaded after a reload in local Brave, and the Show widgets button toggled with Space. Hosted verification remains open.

Local Brave checks on 13 November 2026 confirmed that reopening Save reuses the prepared PNG and switching devices produces the correct 1296 × 2808 or 1296 × 2880 image. The Name poster PNG matched the editor's surname font and diagonal portrait cut. The Royal PNG preserved the portrait fade over the design behind it. The iPhone depth effect is clipped to the clock area in the editor. Physical device and hosted checks remain open.

Local Brave checks on 13 November 2026 confirmed the dice switched layout and backdrop while retaining the custom background. Light and dark backgrounds switched the text colour. The inline toolbar left the design controls in place, and Layers restored a hidden club logo and a stat inside a group. Two consecutive logo drags completed without a reload. The PNG preview rendered the edited artwork with no date or time overlay. The lock-screen-only controls were checked on desktop and at 390 × 844.

- **Every design × palette:** test light, dark and complementary clubs (not only one club), long names (for example a double-barrelled surname), a missing portrait (honest missing state, export blocked) and missing stats (shown as unavailable, never 0).
- **Editor:** check mouse, trackpad and a physical touch phone. Confirm pinch scale, that handles are reachable, and that the inline toolbar is reachable. Check that undo/redo and save/reload survive a reload, and that malformed storage recovers without losing other drafts.
- **Overlays:** check both lock-screen previews. Confirm the clock updates, the correct shortcuts appear in the lower corners, and they stay visible over the artwork during edits. Local Brave confirmed both shortcut pairs and their position above the artwork.
- **Export:** open the downloaded PNG and confirm it is the right size (1080 × 2400 or 1080 × 2340), with no overlays, controls or guides, correct fonts, a sharp-enough portrait at the chosen ceiling, and the same layout as the preview.
- **Devices:** actually set the image as the wallpaper on one iPhone and one Android phone, check the clock zone, and record the result. Until then, label the safe zones as estimates.
- **Performance:** no layout shift from status text, and the payload of `/api/wallpaper/players` is recorded against the full bootstrap.
- **Accessibility:** keyboard-only editing works, the canvas has an accessible label, `prefers-reduced-motion` is respected, and contrast meets WCAG AA for the editor UI.

---

## 10. Open questions for the owner

1. Is public download of the official PL headshots acceptable (R2)? Should the FPL Insights mark appear on every export, and where?
2. If no larger headshot exists, which do you prefer: a smaller portrait with stronger graphic treatment, or a soft large portrait (R1)?
3. What should the "01" slot in Halftone show by default: a computed rank, the gameweek, or custom text (R7)?
4. Nav placement for `/wallpaper`, and should it link from player profiles?
5. Should drafts also be shareable as a link with the layout (a compact encoded layout in the URL), or is player and design enough?
6. Analytics events on download and share: yes or no?

---

## 11. Next steps

1. The owner answers §10 Q1–Q3.
2. Phase 0 spikes, then the side-by-side mockups for approval.
3. Phase 1 engine generalisation and the scheduler regression gate.
4. Phases 2 to 6 in order, each delivered with visible UI early so it can be tested in the browser.
