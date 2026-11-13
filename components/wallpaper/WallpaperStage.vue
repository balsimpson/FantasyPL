<script setup lang="ts">
import type { useSchedulerCanvas } from '~/composables/useSchedulerCanvas'
import { WALLPAPER_HEIGHT, WALLPAPER_WIDTH, type WallpaperArtworkModel } from '~/utils/wallpaper'
import { deviceScreen, type DeviceZone, type WallpaperDevice, type WallpaperScreen, type WallpaperWidget } from '~/utils/wallpaper-devices'
import type { SchedulerLayout } from '~/utils/scheduler-layout'
import WallpaperArtwork from '~/components/wallpaper/WallpaperArtwork.vue'
import WallpaperDeviceOverlay from '~/components/wallpaper/WallpaperDeviceOverlay.vue'

const props = defineProps<{
  model: WallpaperArtworkModel
  canvas: ReturnType<typeof useSchedulerCanvas>
  layout: SchedulerLayout
  editing: boolean
  device: WallpaperDevice
  screen: WallpaperScreen
  widgets: WallpaperWidget[]
  showWidgets: boolean
  depth: boolean
  zones: DeviceZone[]
  now: number
}>()

const container = useTemplateRef('container')
const surface = useTemplateRef('surface')
const host = useTemplateRef('host')
const size = ref({ width: 0, height: 0 })
let observer: ResizeObserver | undefined
onMounted(() => {
  observer = new ResizeObserver(([entry]) => { size.value = { width: entry!.contentRect.width, height: entry!.contentRect.height } })
  if (container.value) observer.observe(container.value)
})
onBeforeUnmount(() => observer?.disconnect())

// The phone frame fits the available space by both width and height.
const BEZEL = 0.034
const spec = computed(() => deviceScreen(props.device))
const screenWidth = computed(() => Math.max(0, Math.floor(Math.min(size.value.width / (1 + 2 * BEZEL), size.value.height / (spec.value.height / WALLPAPER_WIDTH + 2 * BEZEL)))))
const scale = computed(() => screenWidth.value / WALLPAPER_WIDTH)
const bezel = computed(() => Math.round(screenWidth.value * BEZEL))
const radius = computed(() => Math.round(screenWidth.value * (props.device === 'iphone' ? 0.135 : 0.085)))
const boardStyle = computed(() => ({ top: `${-spec.value.offset * scale.value}px`, width: `${WALLPAPER_WIDTH * scale.value}px`, height: `${WALLPAPER_HEIGHT * scale.value}px` }))
const artworkStyle = computed(() => ({ width: `${WALLPAPER_WIDTH}px`, height: `${WALLPAPER_HEIGHT}px`, transform: `scale(${scale.value})` }))
const pct = (box: { x: number; y: number; width: number; height: number }) => ({ left: `${box.x / WALLPAPER_WIDTH * 100}%`, top: `${box.y / WALLPAPER_HEIGHT * 100}%`, width: `${box.width / WALLPAPER_WIDTH * 100}%`, height: `${box.height / WALLPAPER_HEIGHT * 100}%` })

const { visibleElements, selected, selectedId, guides, dragging, scopeId } = props.canvas
const hitTargets = computed(() => visibleElements.value.filter(item => !props.layout[item.id]?.hidden))
const depthActive = computed(() => props.depth && props.device === 'iphone' && props.screen === 'lock')
const overlayOpacity = computed(() => !props.editing ? 1 : dragging.value ? 0.25 : selected.value ? 0.45 : 0.8)
const corners = [
  { id: 'nw', label: 'top left', class: '-top-3 -left-3 cursor-nwse-resize' },
  { id: 'ne', label: 'top right', class: '-top-3 -right-3 cursor-nesw-resize' },
  { id: 'sw', label: 'bottom left', class: '-bottom-3 -left-3 cursor-nesw-resize' },
  { id: 'se', label: 'bottom right', class: '-bottom-3 -right-3 cursor-nwse-resize' },
] as const

// Two-finger pinch resizes the selected item.
let pinchBase = 0
const distance = (touches: TouchList) => Math.hypot(touches[0]!.clientX - touches[1]!.clientX, touches[0]!.clientY - touches[1]!.clientY)
function touchStart(event: TouchEvent) {
  if (!props.editing || event.touches.length !== 2) return
  if (props.canvas.pinchStart()) { pinchBase = distance(event.touches); event.preventDefault() }
}
function touchMove(event: TouchEvent) {
  if (!pinchBase || event.touches.length !== 2) return
  event.preventDefault()
  props.canvas.pinchMove(distance(event.touches) / pinchBase)
}
function touchEnd(event: TouchEvent) {
  if (pinchBase && event.touches.length < 2) { pinchBase = 0; props.canvas.pinchEnd() }
}

defineExpose({ surface, getArtwork: () => host.value?.querySelector<HTMLElement>('[data-wallpaper-artwork]') ?? null })
</script>

<template>
  <div ref="container" class="relative flex size-full min-h-0 items-center justify-center">
    <div
      class="relative shrink-0 bg-[#0b0c0e] shadow-[0_40px_90px_-30px_rgba(0,0,0,0.9),inset_0_0_0_1px_rgba(255,255,255,0.08)] ring-1 ring-white/12 transition-[width,height] duration-300 ease-out motion-reduce:transition-none"
      :class="screenWidth ? 'opacity-100' : 'opacity-0'"
      :style="{ width: `${screenWidth + bezel * 2}px`, height: `${Math.round(screenWidth * spec.height / WALLPAPER_WIDTH) + bezel * 2}px`, padding: `${bezel}px`, borderRadius: `${radius + bezel}px` }"
    >
      <div class="@container relative size-full overflow-hidden" :style="{ borderRadius: `${radius}px`, backgroundColor: model.colours.field }">
        <div class="absolute left-0" :style="boardStyle">
          <div ref="host" class="origin-top-left" :style="artworkStyle"><WallpaperArtwork :model="model" /></div>
        </div>

        <!-- Clock and dock zones appear while an item moves, so it can clear them. -->
        <div v-if="editing && dragging" class="pointer-events-none absolute left-0 z-[5]" :style="boardStyle" aria-hidden="true">
          <div v-for="zone in zones" :key="zone.id" class="absolute border border-dashed border-white/50 bg-white/10 mix-blend-difference" :style="pct(zone)">
            <span class="absolute left-2 top-1 text-[10px] font-semibold uppercase tracking-wider text-white">{{ zone.label }}</span>
          </div>
        </div>

        <WallpaperDeviceOverlay class="z-10 transition-opacity duration-200 motion-reduce:transition-none" :style="{ opacity: overlayOpacity }" :device="device" :screen="screen" :colour="model.colours.clock" :now="now" :widgets="widgets" :show-widgets="showWidgets" :player-name="model.player.name" />

        <div v-if="depthActive" class="pointer-events-none absolute left-0 z-20 transition-opacity duration-200" :class="editing && selected ? 'opacity-60' : 'opacity-100'" :style="boardStyle" aria-hidden="true">
          <div class="origin-top-left" :style="artworkStyle"><WallpaperArtwork :model="model" portrait-only /></div>
        </div>

        <span v-if="device === 'iphone'" aria-hidden="true" class="pointer-events-none absolute left-1/2 z-30 -translate-x-1/2 rounded-full bg-black" :style="{ top: '1.35%', width: '31%', height: '3.6cqw' }" />
        <span v-else aria-hidden="true" class="pointer-events-none absolute left-1/2 z-30 -translate-x-1/2 rounded-full bg-black" :style="{ top: '1.1%', width: '3.4cqw', height: '3.4cqw' }" />

        <div
          ref="surface"
          class="absolute left-0 z-40 outline-none"
          :style="boardStyle"
          :tabindex="editing ? 0 : -1"
          :aria-label="editing ? 'Wallpaper canvas. Select an item, then drag it or use the arrow keys. Shift moves ten pixels.' : undefined"
          @keydown="canvas.keyboard"
          @pointermove="canvas.move"
          @pointerup="canvas.pointerEnd"
          @pointercancel="canvas.pointerEnd"
          @touchstart="touchStart"
          @touchmove="touchMove"
          @touchend="touchEnd"
          @touchcancel="touchEnd"
        >
          <template v-if="editing">
            <button type="button" tabindex="-1" aria-label="Clear selection" class="absolute inset-0 size-full touch-none" @pointerdown="canvas.select('')" />
            <button
              v-for="item in hitTargets"
              :key="item.id"
              type="button"
              :aria-label="`Select ${item.label}`"
              :aria-pressed="selectedId === item.id"
              class="absolute touch-none cursor-grab rounded-[2px] outline-none transition-[box-shadow] duration-150 hover:shadow-[inset_0_0_0_1.5px_rgba(200,255,61,0.75)] focus-visible:shadow-[inset_0_0_0_2px_#c8ff3d]"
              :style="{ ...pct(item), zIndex: item.z + 60 }"
              @focus="canvas.selectedId.value = item.id"
              @pointerdown="canvas.start($event, item.id)"
              @dblclick="canvas.openGroup(item.id)"
            />
            <div v-for="guide in guides" :key="`${guide.axis}:${guide.value}`" class="pointer-events-none absolute z-[170] bg-[#ff3dbb]" :class="guide.axis === 'x' ? 'inset-y-0 w-px' : 'inset-x-0 h-px'" :style="guide.axis === 'x' ? { left: `${guide.value / WALLPAPER_WIDTH * 100}%` } : { top: `${guide.value / WALLPAPER_HEIGHT * 100}%` }" />
            <div v-if="selected" class="pointer-events-none absolute z-[180] shadow-[0_0_0_2px_#c8ff3d,0_0_0_4px_rgba(0,0,0,0.35)]" :style="pct(selected)">
              <button type="button" tabindex="-1" :aria-label="`Move ${selected.label}`" class="pointer-events-auto absolute inset-0 size-full touch-none" :class="dragging ? 'cursor-grabbing' : 'cursor-grab'" @pointerdown.stop="canvas.start($event, selected.id)" @dblclick.stop="canvas.openGroup(selected.id)" />
              <span class="pointer-events-none absolute -top-6 left-0 max-w-44 truncate bg-[#c8ff3d] px-1.5 py-0.5 text-[10px] font-semibold text-black transition-opacity" :class="dragging ? 'opacity-0' : 'opacity-100'">{{ selected.label }}</span>
              <button
                v-for="corner in corners"
                :key="corner.id"
                type="button"
                :aria-label="`Resize ${selected.label} from ${corner.label}`"
                class="pointer-events-auto absolute flex size-7 touch-none items-center justify-center sm:size-5"
                :class="corner.class"
                @pointerdown.stop="canvas.start($event, selected.id, corner.id)"
              ><span class="block size-3.5 rounded-full border-2 border-[#c8ff3d] bg-black sm:size-3" /></button>
            </div>
            <span v-if="scopeId" class="pointer-events-none absolute inset-0 z-[50] bg-black/25" aria-hidden="true" />
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
