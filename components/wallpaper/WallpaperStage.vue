<script setup lang="ts">
import type { useSchedulerCanvas } from '~/composables/useSchedulerCanvas'
import { WALLPAPER_HEIGHT, WALLPAPER_WIDTH, type WallpaperArtworkModel } from '~/utils/wallpaper'
import { deviceScreen, type DeviceZone, type WallpaperDevice } from '~/utils/wallpaper-devices'
import type { SchedulerLayout } from '~/utils/scheduler-layout'
import WallpaperArtwork from '~/components/wallpaper/WallpaperArtwork.vue'
import WallpaperDeviceOverlay from '~/components/wallpaper/WallpaperDeviceOverlay.vue'

const props = defineProps<{
  model: WallpaperArtworkModel
  canvas: ReturnType<typeof useSchedulerCanvas>
  layout: SchedulerLayout
  device: WallpaperDevice
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
const toolbarTop = computed(() => {
  const item = selected.value
  if (!item) return 0
  const screenTop = (size.value.height - spec.value.height * scale.value) / 2
  const top = screenTop + (item.y - spec.value.offset) * scale.value
  const bottom = top + item.height * scale.value
  const toolbarHeight = 40
  const position = top > toolbarHeight + 8 ? top - toolbarHeight - 8 : bottom + 8
  return Math.max(0, Math.min(size.value.height - toolbarHeight, position))
})
const clockOpacity = computed(() => dragging.value ? 0.25 : selected.value ? 0.45 : 0.8)
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
  if (event.touches.length !== 2) return
  if (props.canvas.pinchStart()) { pinchBase = distance(event.touches); event.preventDefault() }
}
function touchMove(event: TouchEvent) {
  if (!pinchBase || event.touches.length !== 2) return
  event.preventDefault()
  props.canvas.pinchMove(distance(event.touches) / pinchBase)
}
function touchEnd(event: TouchEvent) {
  if (pinchBase && event.touches.length < 2) {
    pinchBase = 0
    props.canvas.pinchEnd(event.type === 'touchcancel')
  }
}

function finishGesture() {
  pinchBase = 0
  props.canvas.finish()
}

onMounted(() => window.addEventListener('blur', finishGesture))
onBeforeUnmount(() => window.removeEventListener('blur', finishGesture))

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

        <!-- Date and time guides appear while an item moves, so it can clear them. -->
        <div v-if="dragging" class="pointer-events-none absolute left-0 z-[5]" :style="boardStyle" aria-hidden="true">
          <div v-for="zone in zones" :key="zone.id" class="absolute border border-dashed border-white/50 bg-white/10 mix-blend-difference" :style="pct(zone)">
            <span class="absolute left-2 top-1 text-[10px] font-semibold uppercase tracking-wider text-white">{{ zone.label }}</span>
          </div>
        </div>

        <WallpaperDeviceOverlay :clock-opacity="clockOpacity" :device="device" :colour="model.colours.clock" :now="now" />

        <div
          ref="surface"
          class="absolute left-0 z-40 outline-none"
          :style="boardStyle"
          tabindex="0"
          aria-label="Wallpaper canvas. Select an item, then drag it or use the arrow keys. Shift moves ten pixels."
          @keydown="canvas.keyboard"
          @pointermove="canvas.move"
          @pointerup="canvas.pointerEnd"
          @pointercancel="canvas.pointerEnd"
          @lostpointercapture="canvas.pointerEnd"
          @touchstart="touchStart"
          @touchmove="touchMove"
          @touchend="touchEnd"
          @touchcancel="touchEnd"
        >
          <button type="button" tabindex="-1" aria-label="Clear selection" class="absolute inset-0 size-full touch-none" @pointerdown="canvas.select('')" />
          <button
            v-for="item in hitTargets"
            :key="item.id"
            type="button"
            :aria-label="`Select ${item.label}`"
            :aria-pressed="selectedId === item.id"
            class="absolute touch-none rounded-[2px] outline-none transition-[box-shadow] duration-150 hover:shadow-[inset_0_0_0_1.5px_rgba(200,255,61,0.75)] focus-visible:shadow-[inset_0_0_0_2px_#c8ff3d]"
            :class="dragging && selectedId === item.id ? 'cursor-grabbing' : 'cursor-grab'"
            :style="{ ...pct(item), zIndex: item.z + 60 }"
            @focus="canvas.selectedId.value = item.id"
            @pointerdown="canvas.start($event, item.id)"
            @dblclick="canvas.openGroup(item.id)"
          />
          <div v-for="guide in guides" :key="`${guide.axis}:${guide.value}`" class="pointer-events-none absolute z-[170] bg-[#ff3dbb]" :class="guide.axis === 'x' ? 'inset-y-0 w-px' : 'inset-x-0 h-px'" :style="guide.axis === 'x' ? { left: `${guide.value / WALLPAPER_WIDTH * 100}%` } : { top: `${guide.value / WALLPAPER_HEIGHT * 100}%` }" />
          <div v-if="selected" class="pointer-events-none absolute z-[180] shadow-[0_0_0_2px_#c8ff3d,0_0_0_4px_rgba(0,0,0,0.35)]" :style="pct(selected)">
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
        </div>
      </div>
    </div>
    <div v-if="(selected || scopeId) && !dragging" class="pointer-events-none absolute inset-x-0 z-50 flex justify-center" :style="{ top: `${toolbarTop}px` }">
      <slot />
    </div>
  </div>
</template>
