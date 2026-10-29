# Instagram Template Editing Reference

Use this quick map for visual changes to the scheduler artwork. Read [AGENTS.md](AGENTS.md) for the design, asset, preview, export, and workflow rules. Start with the exact component below; do not search the whole repository for a small layout adjustment.

## Find the Right Component

The A–J labels are visual design choices. Their string IDs are used in `draft.design`. Content formats such as spotlight and comparison are separate choices.

| Choice | Design ID | Single-player artwork |
| --- | --- | --- |
| A | `editorial` | `components/SchedulerPlayerDesign.vue` |
| B | `matchday` | `components/SchedulerPlayerDesign.vue` |
| C | `scout` | `components/SchedulerPlayerDesign.vue` |
| D | `studio` | `components/SchedulerPlayerDesign.vue` |
| E | `club` | `components/SchedulerPlayerDesign.vue` |
| F | `contrast` | `components/SchedulerPlayerDesign.vue` |
| G | `night` | `components/SchedulerPlayerDesign.vue` |
| H | `profile` | `components/SchedulerPlayerDesign.vue` |
| I | `analyst` | `components/SchedulerAnalystDesign.vue` |
| J | `hero` | `components/SchedulerHeroDesign.vue` |

For two-player comparisons, the A–J compositions are in `components/SchedulerComparisonDesign.vue`; portrait and stat details are in `SchedulerComparisonPortrait.vue` and `SchedulerComparisonStats.vue` beside it. The shared artwork shell is `components/SchedulerPostArtwork.vue`, rendered through `components/SchedulerPostPreview.vue`.

## Inline Layout Editing

Use **Edit** in the Instagram preview header, immediately left of Post options, to select and drag an item; **Done** leaves edit mode. The non-floating footer toolbar sits beside the Post ideas label above the thumbnail strip and contains layout controls, caption generation and scheduling. Corners resize an item in proportion. The contextual toolbar adjusts size and text alignment; its menu centres, arranges or resets the selected item. Snapping aligns edges and centres with the canvas, margins and other items. Hold Alt to bypass snapping or Shift to constrain a drag. Arrow keys move one artwork pixel; Shift moves ten. Undo, redo and Save also support the usual Ctrl/Command shortcuts.

Select the player name and open **… → Text contrast** for None, Outline, Shadow or Exclusion. Template G defaults to Outline. The choice saves with the layout and changes only how the text is painted, without moving or resizing it.

Select the stats group and use **Edit stats**, double-click it, or press Enter. Select a stat, then open its parts to move, resize or align its value and label separately. The breadcrumb returns to the stats group or full template. The artwork's numbers remain data driven.

**Save** retains the layout for that design and content format in the current browser and reuses it with other players. Unsaved changes remain in the current page session when switching templates. Saving does not sync across devices. Resetting a layout or item is undoable. The editor controls sit outside the exported artwork.

The implementation is in `SchedulerTemplateEditor.vue`, `useSchedulerCanvas.ts`, `useSchedulerLayouts.ts`, `utils/scheduler-layout.ts` and `utils/scheduler-element.ts`. Editable targets use `v-scheduler-element` with stable IDs. `SchedulerStatGrid.vue` supplies nested stat targets; the custom leading stats and Hero design use the same group pattern.

### Local verification, 23 October 2026

- `npm run build` passed. All ten single-player designs rendered with unique editable IDs and working stat groups in Brave.
- Checked drag, resize, live snapping guides, keyboard nudges, undo/redo, group navigation, independent value/label alignment, and save/reload. Nested movement retained the correct distance inside a resized group. Opening edit mode or groups did not change the artwork or surrounding control positions.
- Checked desktop and 390 × 844 previews, light/dark themes, reduced motion, and toolbar fit. Checked a downloaded 1080 × 1080 PNG with saved layout changes; controls and breadcrumbs were absent from the image.
- Targeted geometry, storage validation, malformed/blocked storage, per-design history and cancelled-gesture checks passed. A direct TypeScript check still reports existing errors outside the new editor modules; it is not a clean project-wide typecheck.
- Hosted, physical-device and scheduling-provider verification remain open. No upload, caption generation or scheduling action was used for these checks. Test layout adjustments were reset afterward.

## Common Visual Edits

- **Move or resize one design's player:** change the `SchedulerPlayerPhoto` usage in that design's branch first. For example, single-player A is the `draft.design === 'editorial'` branch in `SchedulerPlayerDesign.vue`.
- **Change image containment or loading behavior:** inspect `components/SchedulerPlayerPhoto.vue` and then `components/SchedulerArtworkAsset.vue`. These are shared; do not change their defaults for a one-design adjustment.
- **Change player-name fitting:** use `components/SchedulerPlayerName.vue` or the width/font props at the specific design usage.
- **Change stat sizing or rules:** use `components/SchedulerStatGrid.vue` or the specific design usage. Keep layout-specific spacing on that usage when only one design should change.
- **Change background geometry:** use `components/SchedulerClubGraphics.vue`; prefer a per-instance prop or class for a one-design variation.
- **Change design names or IDs:** check `utils/instagram-designs.ts`. Content formats and normalized player fields are in `utils/instagram-templates.ts`.

## Narrow Edit Loop

1. Use the A–J choice and content format from the request to pick the correct branch. Do not assume a comparison uses the single-player composition.
2. Read that component and only the directly involved shared child. If the issue is clipping at a parent boundary, inspect `SchedulerPostArtwork.vue` before changing a shared image component.
3. Make the smallest change in the selected design branch. Keep one-template spacing and sizing local; alter shared components only when the requested behavior is shared.
4. Preserve the 1080 × 1080 artwork dimensions and data-driven players, names, stats, and club assets. Do not change preview/export or scheduling behavior for a visual tweak.
5. If the user already has the dev server running, rely on its hot reload; do not start, stop, or replace it. Inspect the changed design after fonts and images load when a connected browser is available. State when browser verification is unavailable.
6. Use a focused diff check for a visual-only edit. Check an exported PNG only when export/capture code changed. Never call upload, scheduling, posting, or webhook endpoints for visual verification.

If a mapped file is missing or the issue clearly crosses component boundaries, search only the scheduler components first (for example, `components/Scheduler*.vue`) and expand scope only when the source confirms it is necessary.
