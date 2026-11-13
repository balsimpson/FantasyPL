<script setup lang="ts">
import type { useSchedulerCanvas } from '~/composables/useSchedulerCanvas'
import type { useSchedulerLayouts } from '~/composables/useSchedulerLayouts'
import { schedulerTextContrasts, type SchedulerElementTransform, type SchedulerTextContrast } from '~/utils/scheduler-layout'
import { isWallpaperColour } from '~/utils/wallpaper'

const props = defineProps<{ canvas: ReturnType<typeof useSchedulerCanvas>; editor: ReturnType<typeof useSchedulerLayouts>; artwork: () => HTMLElement | null | undefined; ink: string }>()
const { selected, selectedId, transform, breadcrumbs, scopeId } = props.canvas
const textItem = computed(() => ['player-name', 'hero', 'stats', 'footer-stats', 'caption', 'season', 'numerals'].includes(selectedId.value) || /^(hero|stat)-/.test(selectedId.value))
const contrastItem = computed(() => selectedId.value === 'player-name')
const percent = computed(() => Math.round(transform.value.scale * 100))
const alignment = computed(() => transform.value.align ?? (selected.value?.textAlign === 'end' || selected.value?.textAlign === 'right' ? 'right' : selected.value?.textAlign === 'center' ? 'center' : 'left'))
const opacity = computed(() => Math.round((transform.value.opacity ?? 1) * 100))
const colourInputValue = ref(props.ink)

function updateLayer(change: Partial<SchedulerElementTransform>) {
  const id = selectedId.value
  if (!id) return
  props.editor.change({ ...props.editor.layout.value, [id]: { ...transform.value, ...change } })
}

function syncColour(open: boolean) {
  if (!open) return
  const element = props.artwork()?.querySelector(`[data-layout-id="${selectedId.value}"]`)
  const sample = selectedId.value === 'numerals' ? element?.querySelector('text:last-of-type') : element
  const style = sample ? getComputedStyle(sample) : undefined
  const colour = selectedId.value === 'numerals' ? style?.fill : style?.color
  const channels = colour?.match(/^rgba?\((\d+), (\d+), (\d+)/)
  colourInputValue.value = transform.value.textColour ?? (channels ? `#${channels.slice(1).map(value => Number(value).toString(16).padStart(2, '0')).join('')}` : props.ink)
}

function changeColour(colour?: string) {
  if (!isWallpaperColour(colour)) return
  colourInputValue.value = colour
  updateLayer({ textColour: colour })
}

function clearColour() {
  updateLayer({ textColour: undefined })
  void nextTick(() => syncColour(true))
}

function setOpacity(event: Event) {
  updateLayer({ opacity: (event.target as HTMLInputElement).valueAsNumber / 100 })
}

function setNumber(axis: 'x' | 'y', value: string | number) {
  const number = Number(value)
  if (!Number.isFinite(number)) return
  if (axis === 'x') props.canvas.moveTo(number, undefined)
  else props.canvas.moveTo(undefined, number)
}
function setContrast(contrast: SchedulerTextContrast) {
  updateLayer({ contrast })
}
function hide() {
  updateLayer({ hidden: true })
  props.canvas.select('')
}
</script>

<template>
  <div v-if="selected" class="pointer-events-auto flex h-10 max-w-full items-center gap-0.5 rounded-full bg-[#16181c] px-1.5 shadow-lg ring-1 ring-white/15" role="toolbar" :aria-label="`${selected.label} tools`">
    <UButton v-if="selected.group" icon="i-lucide-ungroup" color="neutral" variant="ghost" size="sm" aria-label="Edit parts" title="Edit parts" @click="canvas.openGroup()" />
    <UButton v-else-if="scopeId" icon="i-lucide-chevron-up" color="neutral" variant="ghost" size="sm" aria-label="Back to group" title="Back to group" @click="canvas.navigateGroup(breadcrumbs.at(-2)?.id ?? '')" />
    <UPopover :content="{ side: 'bottom', collisionPadding: 12 }" :ui="{ content: 'w-[min(18rem,calc(100vw-1.5rem))] bg-[#16181c] p-3' }">
      <UButton icon="i-lucide-sliders-horizontal" color="neutral" variant="ghost" size="sm" aria-label="Position and size" title="Position and size" />
      <template #content>
        <div class="space-y-3" role="group" :aria-label="`${selected.label} settings`">
          <nav v-if="scopeId" class="flex min-w-0 flex-1 items-center gap-0.5 text-xs" aria-label="Group">
              <button type="button" class="shrink-0 text-stone-400 hover:text-white" @click="canvas.navigateGroup('')">Wallpaper</button>
              <template v-for="item in breadcrumbs" :key="item.id">
                <UIcon name="i-lucide-chevron-right" class="size-3 shrink-0 text-stone-500" aria-hidden="true" />
                <button type="button" class="truncate text-stone-400 hover:text-white" @click="canvas.navigateGroup(item.id)">{{ item.label }}</button>
              </template>
              <UIcon name="i-lucide-chevron-right" class="size-3 shrink-0 text-stone-500" aria-hidden="true" />
          </nav>

          <div class="grid grid-cols-2 gap-2">
            <label v-for="axis in (['x', 'y'] as const)" :key="axis" class="flex h-9 items-center gap-2 bg-white/5 px-2.5 text-xs text-stone-400 focus-within:ring-1 focus-within:ring-[#c8ff3d]">
              <span class="w-3 font-semibold uppercase">{{ axis }}</span>
              <input :value="Math.round(selected[axis])" type="number" inputmode="numeric" step="1" class="w-full min-w-0 bg-transparent text-right text-sm tabular-nums text-white outline-none [appearance:textfield]" :aria-label="`${axis.toUpperCase()} position in pixels`" @change="setNumber(axis, ($event.target as HTMLInputElement).value)">
              <span>px</span>
            </label>
          </div>

          <div>
            <div class="mb-1.5 flex items-center justify-between text-xs text-stone-400">
              <span>Size</span>
              <span class="tabular-nums text-stone-300">{{ percent }}% · {{ Math.round(selected.width) }} × {{ Math.round(selected.height) }} px</span>
            </div>
            <div class="flex items-center gap-2">
              <UButton icon="i-lucide-minus" color="neutral" variant="ghost" size="xs" aria-label="Smaller" :disabled="percent <= 10" @click="canvas.resize(percent - 5)" />
              <USlider :model-value="percent" :min="10" :max="300" :step="1" class="flex-1" aria-label="Size in percent" @update:model-value="value => canvas.resize(Number(value))" />
              <UButton icon="i-lucide-plus" color="neutral" variant="ghost" size="xs" aria-label="Larger" :disabled="percent >= 300" @click="canvas.resize(percent + 5)" />
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-1">
            <UTooltip text="Centre horizontally"><UButton icon="i-lucide-align-center-horizontal" color="neutral" variant="soft" size="sm" aria-label="Centre horizontally" @click="canvas.align('x')" /></UTooltip>
            <UTooltip text="Centre vertically"><UButton icon="i-lucide-align-center-vertical" color="neutral" variant="soft" size="sm" aria-label="Centre vertically" @click="canvas.align('y')" /></UTooltip>
            <template v-if="textItem">
              <span class="mx-1 h-5 w-px bg-white/10" aria-hidden="true" />
              <UTooltip v-for="item in (['left', 'center', 'right'] as const)" :key="item" :text="`Align text ${item === 'center' ? 'centre' : item}`">
                <UButton :icon="`i-lucide-align-${item}`" :color="alignment === item ? 'primary' : 'neutral'" :variant="alignment === item ? 'solid' : 'soft'" size="sm" :aria-label="`Align text ${item}`" :aria-pressed="alignment === item" @click="canvas.alignText(item)" />
              </UTooltip>
            </template>
          </div>

          <div v-if="contrastItem">
            <p class="mb-1.5 text-xs text-stone-400">Text edge</p>
            <div class="grid grid-cols-4 gap-1" role="radiogroup" aria-label="Text edge">
              <button v-for="option in schedulerTextContrasts" :key="option.value" type="button" role="radio" :aria-checked="(transform.contrast ?? 'none') === option.value" class="h-8 text-xs font-medium transition-colors" :class="(transform.contrast ?? 'none') === option.value ? 'bg-white text-black' : 'bg-white/5 text-stone-300 hover:bg-white/10'" @click="setContrast(option.value)">{{ option.label }}</button>
            </div>
          </div>

        </div>
      </template>
    </UPopover>
    <UPopover v-if="textItem" :ui="{ content: 'space-y-2 bg-[#16181c] p-3' }" @update:open="syncColour">
      <UButton icon="i-lucide-palette" color="neutral" variant="ghost" size="sm" aria-label="Text colour" title="Text colour" />
      <template #content>
        <UColorPicker :model-value="colourInputValue" aria-label="Text colour picker" @update:model-value="changeColour" />
        <UButton label="Use template colour" color="neutral" variant="ghost" size="xs" :disabled="!transform.textColour" @click="clearColour" />
      </template>
    </UPopover>
    <UPopover :ui="{ content: 'w-48 bg-[#16181c] p-3' }">
      <UButton icon="i-lucide-droplet" color="neutral" variant="ghost" size="sm" aria-label="Opacity" title="Opacity" />
      <template #content>
        <label class="grid gap-2 text-xs font-medium text-stone-300">
          <span class="flex justify-between">Opacity <span class="tabular-nums">{{ opacity }}%</span></span>
          <input type="range" min="0" max="100" aria-label="Opacity" :value="opacity" class="w-full accent-primary" @change="setOpacity">
        </label>
      </template>
    </UPopover>
    <UButton icon="i-lucide-bring-to-front" color="neutral" variant="ghost" size="sm" aria-label="Bring to front" title="Bring to front" @click="canvas.layer(1)" />
    <UButton icon="i-lucide-send-to-back" color="neutral" variant="ghost" size="sm" aria-label="Send to back" title="Send to back" @click="canvas.layer(-1)" />
    <UButton icon="i-lucide-rotate-ccw" color="neutral" variant="ghost" size="sm" aria-label="Reset element" title="Reset element" :disabled="!editor.layout.value[selectedId]" @click="canvas.resetSelected()" />
    <UButton icon="i-lucide-eye-off" color="neutral" variant="ghost" size="sm" :aria-label="`Hide ${selected.label}`" title="Hide" @click="hide" />
    <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="sm" aria-label="Done with this item" title="Done" @click="canvas.select('')" />
  </div>
  <UButton v-else-if="scopeId" icon="i-lucide-chevron-up" label="Back to layers" color="neutral" variant="solid" size="sm" class="pointer-events-auto rounded-full" @click="canvas.navigateGroup(breadcrumbs.at(-2)?.id ?? '')" />
</template>
