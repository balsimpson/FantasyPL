<script setup lang="ts">
import type { Ref } from 'vue'
import { useSchedulerCanvas } from '~/composables/useSchedulerCanvas'
import { useWallpaperExport } from '~/composables/useWallpaperExport'
import type { useWallpaperStudio } from '~/composables/useWallpaperStudio'
import { wallpaperArtboard, wallpaperFilename, type WallpaperDesignId, type WallpaperPalette } from '~/utils/wallpaper'
import { getDeviceGuides, getDeviceZones, overlaps } from '~/utils/wallpaper-devices'
import WallpaperStage from '~/components/wallpaper/WallpaperStage.vue'
import WallpaperPlayerPicker from '~/components/wallpaper/WallpaperPlayerPicker.vue'
import WallpaperDesignPanel from '~/components/wallpaper/WallpaperDesignPanel.vue'
import WallpaperStatsPanel from '~/components/wallpaper/WallpaperStatsPanel.vue'
import WallpaperInspector from '~/components/wallpaper/WallpaperInspector.vue'
import WallpaperSaveModal from '~/components/wallpaper/WallpaperSaveModal.vue'

const props = defineProps<{ studio: ReturnType<typeof useWallpaperStudio> }>()
const { players, player, prefs, prefsError, design, palette, stats, model, modelFor, layouts, interacting, now, widgets, requestedMissing, setStat, resetStats } = props.studio

const stage = useTemplateRef<InstanceType<typeof WallpaperStage>>('stage')
const surface = computed(() => (stage.value?.surface as HTMLElement | null | undefined) ?? null)
const editing = ref(true)
const fitTick = useState('wallpaper-fit-tick', () => 0)
const revision = computed(() => JSON.stringify([prefs.value.design, player.value?.code, stats.value, prefs.value.texts[prefs.value.design], palette.value, layouts.layout.value, prefs.value.device, prefs.value.screen, fitTick.value]))
const artboard = computed(() => ({ ...wallpaperArtboard, guides: getDeviceGuides(prefs.value.device, prefs.value.screen) }))
const canvas = useSchedulerCanvas(() => stage.value?.getArtwork(), surface as unknown as Ref<HTMLElement | null>, computed(() => editing.value && Boolean(model.value)), revision, layouts, { artboard })
watch(canvas.dragging, value => { interacting.value = value })
watch(() => [prefs.value.design, player.value?.code], () => { canvas.navigateGroup(''); canvas.select('') })

const zones = computed(() => getDeviceZones(prefs.value.device, prefs.value.screen))
const clockWarning = computed(() => {
  const clock = zones.value.find(zone => zone.id === 'clock')
  if (!clock) return ''
  const covered = canvas.elements.value.find(item => !item.parentId && design.value.dataIds.includes(item.id) && !layouts.layout.value[item.id]?.hidden && overlaps(item, clock))
  return covered ? `The clock covers the ${covered.label.toLowerCase()}` : ''
})
const status = computed(() => layouts.storageError.value || prefsError.value || clockWarning.value || (layouts.dirty.value ? 'Saving…' : layouts.notice.value))
const statusTone = computed(() => layouts.storageError.value || prefsError.value ? 'text-red-300' : clockWarning.value ? 'text-amber-300' : 'text-stone-400')

const topLevel = computed(() => canvas.elements.value.filter(item => !item.parentId))
const confirmReset = ref(false)
const layerItems = computed(() => [
  topLevel.value.map(item => {
    const hidden = Boolean(layouts.layout.value[item.id]?.hidden)
    return {
      label: hidden ? `${item.label} (hidden)` : item.label,
      icon: hidden ? 'i-lucide-eye-off' : canvas.selectedId.value === item.id ? 'i-lucide-check' : 'i-lucide-square-dashed',
      onSelect: () => {
        if (hidden) {
          const { hidden: _hidden, ...rest } = layouts.layout.value[item.id]!
          layouts.change({ ...layouts.layout.value, [item.id]: rest })
        }
        editing.value = true
        canvas.navigateGroup('')
        canvas.select(item.id)
      },
    }
  }),
  [{ label: 'Reset layout…', icon: 'i-lucide-rotate-ccw', disabled: !Object.keys(layouts.layout.value).length, onSelect: () => { confirmReset.value = true } }],
])
function resetLayout() {
  layouts.change({})
  canvas.select('')
  confirmReset.value = false
}

// Mobile panels sit below the phone, so the preview shrinks instead of being covered.
type Sheet = 'player' | 'design' | 'stats'
const sheet = ref<Sheet | null>(null)
const isMobile = ref(false)
let media: MediaQueryList | undefined
const syncMedia = () => { isMobile.value = !media?.matches }
onMounted(() => { media = window.matchMedia('(min-width: 64rem)'); syncMedia(); media.addEventListener('change', syncMedia) })
onBeforeUnmount(() => media?.removeEventListener('change', syncMedia))
watch(canvas.selectedId, id => { if (id && isMobile.value) sheet.value = null })
const tabs = [
  { id: 'player', label: 'Player', icon: 'i-lucide-user-round' },
  { id: 'design', label: 'Design', icon: 'i-lucide-swatch-book' },
  { id: 'stats', label: 'Stats', icon: 'i-lucide-chart-no-axes-column' },
] as const
function toggleSheet(id: Sheet) {
  canvas.select('')
  sheet.value = sheet.value === id ? null : id
}

function selectPlayer(code: number) {
  prefs.value.playerCode = code
  if (isMobile.value) sheet.value = null
}
const setDesign = (id: WallpaperDesignId) => { prefs.value.design = id }
const setPalette = (value: WallpaperPalette) => { prefs.value.palettes = { ...prefs.value.palettes, [prefs.value.design]: value } }
const setText = (value: string) => { prefs.value.texts = { ...prefs.value.texts, [prefs.value.design]: value } }
const statsCustomised = computed(() => Boolean(player.value && prefs.value.stats[player.value.positionShort]))
function togglePreview() {
  editing.value = !editing.value
  canvas.select('')
}

const exporter = useWallpaperExport(() => stage.value?.getArtwork(), () => revision.value)
const saveOpen = ref(false)
function save() {
  if (!player.value) return
  canvas.select('')
  saveOpen.value = true
  void exporter.create(prefs.value.device, wallpaperFilename(player.value, prefs.value.design, prefs.value.device))
}
watch(saveOpen, value => { if (!value) exporter.clear() })

const segment = (active: boolean) => active ? 'bg-white text-black' : 'text-stone-300 hover:text-white'
const toolButton = 'size-9 justify-center rounded-full text-stone-300 hover:bg-white/10 hover:text-white'
</script>

<template>
  <div class="relative flex h-[calc(100dvh-4.6rem-env(safe-area-inset-top))] min-h-[34rem] flex-col lg:site-content-rail lg:grid lg:grid-cols-[17rem_minmax(0,1fr)_19rem] lg:gap-8 lg:py-5">
    <!-- Desktop: player list -->
    <aside class="wp-rise hidden min-h-0 flex-col lg:flex" style="--wp-delay: 40ms">
      <h1 class="mb-4 text-xl font-bold tracking-tight text-white">Player wallpapers</h1>
      <WallpaperPlayerPicker :players="players" :selected-code="player?.code" class="min-h-0 flex-1" @select="selectPlayer" />
    </aside>

    <!-- Phone preview -->
    <section class="flex min-h-0 flex-1 flex-col" aria-label="Wallpaper preview">
      <h1 class="sr-only lg:hidden">Player wallpapers</h1>
      <div class="wp-rise flex shrink-0 items-center justify-between gap-2 px-4 pt-3 lg:px-0 lg:pt-0" style="--wp-delay: 80ms">
        <div class="flex items-center gap-2">
          <div class="flex bg-white/5 p-0.5" role="radiogroup" aria-label="Phone">
            <button v-for="item in (['iphone', 'android'] as const)" :key="item" type="button" role="radio" :aria-checked="prefs.device === item" class="h-8 px-3 text-xs font-semibold transition-colors" :class="segment(prefs.device === item)" @click="prefs.device = item">{{ item === 'iphone' ? 'iPhone' : 'Android' }}</button>
          </div>
          <div class="flex bg-white/5 p-0.5" role="radiogroup" aria-label="Screen">
            <button v-for="item in (['lock', 'home'] as const)" :key="item" type="button" role="radio" :aria-checked="prefs.screen === item" class="h-8 px-3 text-xs font-semibold transition-colors" :class="segment(prefs.screen === item)" @click="prefs.screen = item">{{ item === 'lock' ? 'Lock' : 'Home' }}</button>
          </div>
        </div>
        <div class="flex items-center gap-1">
          <UTooltip text="Preview widgets"><UButton icon="i-lucide-layout-grid" :color="prefs.widgets ? 'primary' : 'neutral'" :variant="prefs.widgets ? 'soft' : 'ghost'" size="sm" aria-label="Show widgets" :aria-pressed="prefs.widgets" @click="prefs.widgets = !prefs.widgets" /></UTooltip>
          <UTooltip v-if="prefs.device === 'iphone' && prefs.screen === 'lock'" text="Depth effect: player in front of the clock"><UButton icon="i-lucide-layers-2" :color="prefs.depth ? 'primary' : 'neutral'" :variant="prefs.depth ? 'soft' : 'ghost'" size="sm" aria-label="Depth effect" :aria-pressed="prefs.depth" @click="prefs.depth = !prefs.depth" /></UTooltip>
        </div>
      </div>

      <p v-if="requestedMissing" class="mx-4 mt-2 text-xs text-amber-300 lg:mx-0" role="status">That player isn’t in the current FPL data, so the top scorer is shown instead.</p>

      <div class="relative min-h-0 flex-1 px-4 py-3 lg:px-0 lg:py-4">
        <WallpaperStage v-if="model" ref="stage" :model="model" :canvas="canvas" :layout="layouts.layout.value" :editing="editing" :device="prefs.device" :screen="prefs.screen" :widgets="widgets" :show-widgets="prefs.widgets" :depth="prefs.depth" :zones="zones" :now="now" />
      </div>

      <div class="wp-rise flex shrink-0 justify-center px-4 pb-2 lg:px-0 lg:pb-0" style="--wp-delay: 140ms">
        <div class="flex h-12 max-w-full items-center gap-0.5 rounded-full bg-[#16181c] px-1.5 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.8)] ring-1 ring-white/10" role="toolbar" aria-label="Wallpaper tools">
          <UTooltip :text="editing ? 'Preview without handles' : 'Edit layout'"><UButton :icon="editing ? 'i-lucide-eye' : 'i-lucide-pencil'" color="neutral" variant="ghost" :class="toolButton" :aria-label="editing ? 'Preview' : 'Edit layout'" @click="togglePreview" /></UTooltip>
          <span class="mx-0.5 h-4 w-px bg-white/15" aria-hidden="true" />
          <UTooltip text="Undo"><UButton icon="i-lucide-undo-2" color="neutral" variant="ghost" :class="toolButton" aria-label="Undo" :disabled="!layouts.canUndo.value" @click="layouts.undo()" /></UTooltip>
          <UTooltip text="Redo"><UButton icon="i-lucide-redo-2" color="neutral" variant="ghost" :class="toolButton" aria-label="Redo" :disabled="!layouts.canRedo.value" @click="layouts.redo()" /></UTooltip>
          <UTooltip text="Snap to guides"><UButton icon="i-lucide-magnet" color="neutral" variant="ghost" class="size-9 justify-center rounded-full hover:bg-white/10 hover:text-white" :class="canvas.snapping.value ? 'bg-white/10 text-[#c8ff3d]' : 'text-stone-300'" aria-label="Snap to guides" :aria-pressed="canvas.snapping.value" @click="canvas.snapping.value = !canvas.snapping.value" /></UTooltip>
          <UDropdownMenu :items="layerItems" :content="{ align: 'center', side: 'top' }">
            <UButton icon="i-lucide-layers" color="neutral" variant="ghost" :class="toolButton" aria-label="Items and layout" />
          </UDropdownMenu>
          <p class="hidden h-5 w-44 items-center px-2 text-xs sm:flex" :class="statusTone" role="status" aria-live="polite" :title="status">
            <UIcon v-if="clockWarning && status === clockWarning" name="i-lucide-triangle-alert" class="mr-1 size-3.5 shrink-0" aria-hidden="true" />
            <span class="truncate">{{ status }}</span>
          </p>
          <UButton label="Save" icon="i-lucide-download" color="primary" class="ml-1 h-9 rounded-full px-4 font-semibold" :disabled="!player" @click="save" />
        </div>
      </div>
      <p class="h-5 shrink-0 truncate px-4 text-center text-[11px] sm:hidden" :class="statusTone" role="status" aria-live="polite">{{ status }}</p>

      <!-- Mobile panel and tabs -->
      <div class="shrink-0 border-t border-white/10 bg-[#0d0e11] lg:hidden">
        <div v-if="canvas.selected.value || sheet" class="max-h-[42dvh] overflow-y-auto overscroll-contain px-4 py-4">
          <WallpaperInspector v-if="canvas.selected.value" :canvas="canvas" :editor="layouts" compact />
          <WallpaperPlayerPicker v-else-if="sheet === 'player'" :players="players" :selected-code="player?.code" class="h-[36dvh]" @select="selectPlayer" />
          <WallpaperDesignPanel v-else-if="sheet === 'design' && player" :design="prefs.design" :palette="palette" :club-code="player.clubCode" :club="player.club" :model-for="modelFor" :thumb-width="64" row @update:design="setDesign" @update:palette="setPalette" />
          <WallpaperStatsPanel v-else-if="sheet === 'stats' && player" :design="design" :player="player" :stats="stats" :text="prefs.texts[prefs.design] ?? ''" :customised="statsCustomised" @stat="setStat" @text="setText" @reset="resetStats" />
        </div>
        <nav class="grid grid-cols-3 pb-[env(safe-area-inset-bottom)]" aria-label="Wallpaper settings">
          <button v-for="tab in tabs" :key="tab.id" type="button" class="flex h-14 flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors" :class="sheet === tab.id && !canvas.selected.value ? 'text-[#c8ff3d]' : 'text-stone-400'" :aria-expanded="sheet === tab.id" @click="toggleSheet(tab.id)">
            <UIcon :name="tab.icon" class="size-5" aria-hidden="true" />{{ tab.label }}
          </button>
        </nav>
      </div>
    </section>

    <!-- Desktop: context-aware settings -->
    <aside class="wp-rise hidden min-h-0 overflow-y-auto overscroll-contain pr-1 lg:block" style="--wp-delay: 120ms">
      <Transition mode="out-in" enter-active-class="transition duration-200 ease-out motion-reduce:transition-none" enter-from-class="opacity-0 translate-y-1" leave-active-class="transition duration-100 motion-reduce:transition-none" leave-to-class="opacity-0">
        <WallpaperInspector v-if="canvas.selected.value" key="inspector" :canvas="canvas" :editor="layouts" />
        <div v-else-if="player" key="content" class="space-y-7">
          <WallpaperDesignPanel :design="prefs.design" :palette="palette" :club-code="player.clubCode" :club="player.club" :model-for="modelFor" :thumb-width="84" @update:design="setDesign" @update:palette="setPalette" />
          <div class="border-t border-white/8 pt-6">
            <WallpaperStatsPanel :design="design" :player="player" :stats="stats" :text="prefs.texts[prefs.design] ?? ''" :customised="statsCustomised" @stat="setStat" @text="setText" @reset="resetStats" />
          </div>
          <p class="text-[11px] leading-relaxed text-stone-500">Tap anything on the phone to move or resize it. Changes save in this browser.</p>
        </div>
      </Transition>
    </aside>

    <WallpaperSaveModal v-model:open="saveOpen" :device="prefs.device" :busy="exporter.busy.value" :phase="exporter.phase.value" :error="exporter.error.value" :image-url="exporter.imageUrl.value" :can-share="exporter.canShare.value" :sharing="exporter.sharing.value" :player-name="player?.name ?? 'Player'" @download="exporter.download()" @share="exporter.share()" @retry="save" />

    <UModal v-model:open="confirmReset" title="Reset this layout?" description="Every item in this design goes back to its original place. You can undo this." :ui="{ content: 'rounded-none sm:max-w-sm border-t-2 border-t-[#c8ff3d] bg-[#101216]', footer: 'justify-end gap-2' }">
      <template #footer>
        <UButton label="Cancel" color="neutral" variant="ghost" @click="confirmReset = false" />
        <UButton label="Reset layout" color="primary" @click="resetLayout" />
      </template>
    </UModal>
  </div>
</template>

<style scoped>
/* One shared, subtle entrance for the studio's regions. */
.wp-rise { animation: wp-rise 420ms cubic-bezier(0.2, 0.7, 0.2, 1) both; animation-delay: var(--wp-delay, 0ms); }
@keyframes wp-rise { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .wp-rise { animation: none; } }
</style>
