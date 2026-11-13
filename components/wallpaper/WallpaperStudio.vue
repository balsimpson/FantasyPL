<script setup lang="ts">
import type { Ref } from 'vue'
import { useSchedulerCanvas } from '~/composables/useSchedulerCanvas'
import { useWallpaperExport } from '~/composables/useWallpaperExport'
import type { useWallpaperStudio } from '~/composables/useWallpaperStudio'
import { isWallpaperColour, wallpaperArtboard, wallpaperFilename, type WallpaperDesignId, type WallpaperPalette } from '~/utils/wallpaper'
import { getDeviceGuides, getDeviceZones, overlaps } from '~/utils/wallpaper-devices'
import WallpaperStage from '~/components/wallpaper/WallpaperStage.vue'
import WallpaperPlayerPicker from '~/components/wallpaper/WallpaperPlayerPicker.vue'
import WallpaperDesignPanel from '~/components/wallpaper/WallpaperDesignPanel.vue'
import WallpaperStatsPanel from '~/components/wallpaper/WallpaperStatsPanel.vue'
import WallpaperInspector from '~/components/wallpaper/WallpaperInspector.vue'
import WallpaperSaveModal from '~/components/wallpaper/WallpaperSaveModal.vue'

const props = defineProps<{ studio: ReturnType<typeof useWallpaperStudio> }>()
const { players, player, prefs, prefsError, design, palette, stats, model, modelFor, layouts, interacting, now, remix, requestedMissing, setStat, resetStats, canResetTemplate, resetTemplate } = props.studio

const stage = useTemplateRef<InstanceType<typeof WallpaperStage>>('stage')
const surface = computed(() => (stage.value?.surface as HTMLElement | null | undefined) ?? null)
const fitTick = useState('wallpaper-fit-tick', () => 0)
const revision = computed(() => JSON.stringify([prefs.value.design, prefs.value.backdrop, prefs.value.background, player.value?.code, stats.value, prefs.value.texts[prefs.value.design], palette.value, layouts.layout.value, prefs.value.device, fitTick.value]))
const artboard = computed(() => ({ ...wallpaperArtboard, guides: getDeviceGuides(prefs.value.device) }))
const canvas = useSchedulerCanvas(() => stage.value?.getArtwork(), surface as unknown as Ref<HTMLElement | null>, computed(() => Boolean(model.value)), revision, layouts, { artboard })
watch(canvas.dragging, value => { interacting.value = value })
watch(() => [prefs.value.design, player.value?.code], () => { canvas.navigateGroup(''); canvas.select('') })

const zones = computed(() => getDeviceZones(prefs.value.device))
const clockWarning = computed(() => {
  const clock = zones.value.find(zone => zone.id === 'clock')
  if (!clock) return ''
  const covered = canvas.elements.value.find(item => !item.parentId && design.value.dataIds.includes(item.id) && !layouts.layout.value[item.id]?.hidden && overlaps(item, clock))
  return covered ? `The clock covers the ${covered.label.toLowerCase()}` : ''
})
const status = computed(() => layouts.storageError.value || prefsError.value || clockWarning.value || (layouts.dirty.value ? 'Saving…' : layouts.notice.value))
const statusTone = computed(() => layouts.storageError.value || prefsError.value ? 'text-red-300' : clockWarning.value ? 'text-amber-300' : 'text-stone-400')

const confirmReset = ref(false)
const hiddenItems = computed(() => canvas.elements.value.filter(item => layouts.layout.value[item.id]?.hidden))
const layerItems = computed(() => {
  const visible = canvas.elements.value.filter(item => !item.parentId && !layouts.layout.value[item.id]?.hidden)
  return [
    visible.map(item => ({
      label: item.label,
      icon: canvas.selectedId.value === item.id ? 'i-lucide-check' : 'i-lucide-square-dashed',
      onSelect: () => {
        canvas.navigateGroup('')
        canvas.select(item.id)
      },
    })),
    hiddenItems.value.length ? [
      { label: 'Hidden items', type: 'label' as const },
      ...hiddenItems.value.map(item => ({
        label: `Show ${item.label}`,
        icon: 'i-lucide-eye',
        onSelect: () => {
          const layout = { ...layouts.layout.value }
          let ancestor: typeof item | undefined = item
          while (ancestor) {
            const id = ancestor.id
            if (layout[id]?.hidden) {
              const { hidden: _hidden, ...rest } = layout[id]!
              layout[id] = rest
            }
            const parentId = ancestor.parentId
            ancestor = canvas.elements.value.find(element => element.id === parentId)
          }
          layouts.change(layout)
        },
      })),
    ] : [],
  ]
})
function resetLayout() {
  canvas.finish()
  resetTemplate()
  canvas.navigateGroup('')
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
function setDesign(id: WallpaperDesignId) {
  canvas.finish()
  if (layouts.dirty.value) layouts.save()
  const palettes = palette.value === 'custom' ? { ...prefs.value.palettes, [id]: 'custom' as const } : prefs.value.palettes
  prefs.value = { ...prefs.value, design: id, backdrop: null, palettes }
  canvas.navigateGroup('')
}
function rollDice() {
  canvas.finish()
  if (layouts.dirty.value) layouts.save()
  remix()
  canvas.navigateGroup('')
}
function setBackground(value: string) {
  if (!isWallpaperColour(value)) return
  prefs.value.background = value
  setPalette('custom')
}
const setPalette = (value: WallpaperPalette) => { prefs.value.palettes = { ...prefs.value.palettes, [prefs.value.design]: value } }
const setText = (value: string) => { prefs.value.texts = { ...prefs.value.texts, [prefs.value.design]: value } }
const statsCustomised = computed(() => Boolean(player.value && prefs.value.stats[player.value.positionShort]))
const saveOpen = ref(false)
const exportRequest = computed(() => {
  const artwork = model.value
  if (!artwork) return null
  const device = prefs.value.device
  return { artwork, device, filename: wallpaperFilename(artwork.player, artwork.design, device), fit: fitTick.value }
})
const exporter = useWallpaperExport(() => stage.value?.getArtwork(), exportRequest, canvas.dragging, saveOpen)
function save() {
  if (!player.value) return
  canvas.select('')
  saveOpen.value = true
}

const segment = (active: boolean) => active ? 'bg-white text-black' : 'text-stone-300 hover:text-white'
const toolButton = 'size-9 justify-center rounded-full text-stone-300 hover:bg-white/10 hover:text-white'
</script>

<template>
  <div class="relative flex h-[calc(100dvh-4.6rem-env(safe-area-inset-top))] min-h-[34rem] w-full flex-col lg:mx-auto lg:grid lg:max-w-7xl lg:grid-cols-[17rem_minmax(0,1fr)_19rem] lg:gap-8 lg:px-8 lg:py-5">
    <!-- Desktop: player list -->
    <aside class="wp-rise hidden min-h-0 flex-col lg:flex" style="--wp-delay: 40ms">
      <h1 class="mb-4 text-xl font-bold tracking-tight text-white">Player wallpapers</h1>
      <WallpaperPlayerPicker :players="players" :selected-code="player?.code" class="min-h-0 flex-1" @select="selectPlayer" />
    </aside>

    <!-- Phone preview -->
    <section class="flex min-h-0 flex-1 flex-col" aria-label="Wallpaper preview">
      <h1 class="sr-only lg:hidden">Player wallpapers</h1>
      <div class="wp-rise flex shrink-0 flex-wrap items-center justify-between gap-2 px-4 pt-3 lg:px-0 lg:pt-0" style="--wp-delay: 80ms">
        <div class="flex bg-white/5 p-0.5" role="radiogroup" aria-label="Phone">
          <button v-for="item in (['iphone', 'android'] as const)" :key="item" type="button" role="radio" :aria-checked="prefs.device === item" class="h-8 px-3 text-xs font-semibold transition-colors" :class="segment(prefs.device === item)" @click="prefs.device = item">{{ item === 'iphone' ? 'iPhone' : 'Android' }}</button>
        </div>
        <div class="flex items-center gap-1">
          <UTooltip text="Remix wallpaper">
            <UButton icon="i-lucide-dices" color="primary" variant="soft" size="sm" aria-label="Remix wallpaper" :disabled="!player" @click="rollDice" />
          </UTooltip>
          <UButton label="Reset" icon="i-lucide-rotate-ccw" color="neutral" variant="ghost" size="sm" aria-label="Reset template" :disabled="!canResetTemplate" @click="confirmReset = true" />
        </div>
      </div>

      <p v-if="requestedMissing" class="mx-4 mt-2 text-xs text-amber-300 lg:mx-0" role="status">That player isn’t in the current FPL data, so the top scorer is shown instead.</p>

      <div class="relative min-h-0 flex-1 px-4 py-3 lg:px-0 lg:py-4">
        <WallpaperStage v-if="model" ref="stage" :model="model" :canvas="canvas" :layout="layouts.layout.value" :device="prefs.device" :zones="zones" :now="now">
          <WallpaperInspector :key="canvas.selectedId.value" :canvas="canvas" :editor="layouts" :artwork="() => stage?.getArtwork()" :ink="model.colours.ink" />
        </WallpaperStage>
      </div>

      <div class="wp-rise flex shrink-0 justify-center px-4 pb-2 lg:px-0 lg:pb-0" style="--wp-delay: 140ms">
        <div class="flex h-12 max-w-full items-center gap-0.5 rounded-full bg-[#16181c] px-1.5 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.8)] ring-1 ring-white/10" role="toolbar" aria-label="Wallpaper tools">
          <UTooltip text="Undo"><UButton icon="i-lucide-undo-2" color="neutral" variant="ghost" :class="toolButton" aria-label="Undo" :disabled="!layouts.canUndo.value" @click="layouts.undo()" /></UTooltip>
          <UTooltip text="Redo"><UButton icon="i-lucide-redo-2" color="neutral" variant="ghost" :class="toolButton" aria-label="Redo" :disabled="!layouts.canRedo.value" @click="layouts.redo()" /></UTooltip>
          <UTooltip text="Snap to guides"><UButton icon="i-lucide-magnet" color="neutral" variant="ghost" class="size-9 justify-center rounded-full hover:bg-white/10 hover:text-white" :class="canvas.snapping.value ? 'bg-white/10 text-[#c8ff3d]' : 'text-stone-300'" aria-label="Snap to guides" :aria-pressed="canvas.snapping.value" @click="canvas.snapping.value = !canvas.snapping.value" /></UTooltip>
          <UDropdownMenu :items="layerItems" :content="{ align: 'center', side: 'top' }">
            <UButton icon="i-lucide-layers" :color="hiddenItems.length ? 'primary' : 'neutral'" variant="ghost" class="size-9 justify-center rounded-full" :aria-label="hiddenItems.length ? `Items and layout, ${hiddenItems.length} hidden` : 'Items and layout'" :title="hiddenItems.length ? 'Show hidden items' : 'Items and layout'" />
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
        <div v-if="sheet" class="max-h-[42dvh] overflow-y-auto overscroll-contain px-4 py-4">
          <WallpaperPlayerPicker v-if="sheet === 'player'" :players="players" :selected-code="player?.code" class="h-[36dvh]" @select="selectPlayer" />
          <WallpaperDesignPanel v-else-if="sheet === 'design' && player" :design="prefs.design" :backdrop="prefs.backdrop" :palette="palette" :club-code="player.clubCode" :club="player.club" :model-for="modelFor" :background="prefs.background ?? model?.colours.field" row @update:background="setBackground" @update:design="setDesign" @update:palette="setPalette" />
          <WallpaperStatsPanel v-else-if="sheet === 'stats' && player" :design="design" :player="player" :stats="stats" :text="prefs.texts[prefs.design] ?? ''" :customised="statsCustomised" @stat="setStat" @text="setText" @reset="resetStats" />
        </div>
        <nav class="flex pb-[env(safe-area-inset-bottom)]" aria-label="Wallpaper settings">
          <button v-for="tab in tabs" :key="tab.id" type="button" class="flex h-14 flex-1 flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors" :class="sheet === tab.id ? 'text-[#c8ff3d]' : 'text-stone-400'" :aria-expanded="sheet === tab.id" @click="toggleSheet(tab.id)">
            <UIcon :name="tab.icon" class="size-5" aria-hidden="true" />{{ tab.label }}
          </button>
        </nav>
      </div>
    </section>

    <!-- Desktop: design settings -->
    <aside class="wp-rise hidden min-h-0 min-w-0 overflow-x-hidden overflow-y-auto overscroll-contain lg:block" style="--wp-delay: 120ms">
      <div v-if="player" class="space-y-7 px-1">
        <WallpaperDesignPanel :design="prefs.design" :backdrop="prefs.backdrop" :palette="palette" :club-code="player.clubCode" :club="player.club" :model-for="modelFor" :background="prefs.background ?? model?.colours.field" @update:background="setBackground" @update:design="setDesign" @update:palette="setPalette" />
        <div class="border-t border-white/8 pt-6">
          <WallpaperStatsPanel :design="design" :player="player" :stats="stats" :text="prefs.texts[prefs.design] ?? ''" :customised="statsCustomised" @stat="setStat" @text="setText" @reset="resetStats" />
        </div>
      </div>
    </aside>

    <WallpaperSaveModal v-model:open="saveOpen" :device="prefs.device" :busy="exporter.busy.value" :phase="exporter.phase.value" :error="exporter.error.value" :image-url="exporter.imageUrl.value" :can-share="exporter.canShare.value" :sharing="exporter.sharing.value" :player-name="player?.name ?? 'Player'" @download="exporter.download()" @share="exporter.share()" @retry="exporter.prepare()" />

    <UModal v-model:open="confirmReset" :title="`Reset ${design.name}?`" description="Restores the template’s colours, backdrop, text, and layers, and the recommended stats for this position. You can undo this." :ui="{ content: 'rounded-none sm:max-w-sm border-t-2 border-t-[#c8ff3d] bg-[#101216]', footer: 'justify-end gap-2' }">
      <template #footer>
        <UButton label="Cancel" color="neutral" variant="ghost" @click="confirmReset = false" />
        <UButton label="Reset template" color="primary" @click="resetLayout" />
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
