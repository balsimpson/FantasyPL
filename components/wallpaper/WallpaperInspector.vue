<script setup lang="ts">
import type { useSchedulerCanvas } from '~/composables/useSchedulerCanvas'
import type { useSchedulerLayouts } from '~/composables/useSchedulerLayouts'
import { schedulerTextContrasts, type SchedulerTextContrast } from '~/utils/scheduler-layout'

const props = defineProps<{ canvas: ReturnType<typeof useSchedulerCanvas>; editor: ReturnType<typeof useSchedulerLayouts>; compact?: boolean }>()
const { selected, selectedId, transform, breadcrumbs, scopeId } = props.canvas
const textItem = computed(() => ['player-name', 'hero', 'stats', 'footer-stats', 'caption', 'season'].includes(selectedId.value) || /^(hero|stat)-/.test(selectedId.value))
const contrastItem = computed(() => selectedId.value === 'player-name')
const percent = computed(() => Math.round(transform.value.scale * 100))
const alignment = computed(() => transform.value.align ?? (selected.value?.textAlign === 'end' || selected.value?.textAlign === 'right' ? 'right' : selected.value?.textAlign === 'center' ? 'center' : 'left'))

function setNumber(axis: 'x' | 'y', value: string | number) {
  const number = Number(value)
  if (!Number.isFinite(number)) return
  if (axis === 'x') props.canvas.moveTo(number, undefined)
  else props.canvas.moveTo(undefined, number)
}
function setContrast(contrast: SchedulerTextContrast) {
  props.editor.change({ ...props.editor.layout.value, [selectedId.value]: { ...transform.value, contrast } })
}
function hide() {
  const id = selectedId.value
  props.editor.change({ ...props.editor.layout.value, [id]: { ...transform.value, hidden: true } })
  props.canvas.select('')
}
</script>

<template>
  <div v-if="selected" class="space-y-4" role="group" :aria-label="`${selected.label} settings`">
    <div class="flex items-center gap-2">
      <nav v-if="scopeId" class="flex min-w-0 flex-1 items-center gap-0.5 text-xs" aria-label="Group">
        <button type="button" class="shrink-0 text-stone-400 hover:text-white" @click="canvas.navigateGroup('')">Wallpaper</button>
        <template v-for="item in breadcrumbs" :key="item.id">
          <UIcon name="i-lucide-chevron-right" class="size-3 shrink-0 text-stone-500" aria-hidden="true" />
          <button type="button" class="truncate text-stone-400 hover:text-white" @click="canvas.navigateGroup(item.id)">{{ item.label }}</button>
        </template>
        <UIcon name="i-lucide-chevron-right" class="size-3 shrink-0 text-stone-500" aria-hidden="true" />
        <span class="truncate font-semibold text-white">{{ selected.label }}</span>
      </nav>
      <p v-else class="min-w-0 flex-1 truncate text-sm font-semibold text-white">{{ selected.label }}</p>
      <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="xs" aria-label="Done with this item" @click="canvas.select('')" />
    </div>

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
      <span class="mx-1 h-5 w-px bg-white/10" aria-hidden="true" />
      <template v-if="textItem">
        <UTooltip v-for="item in (['left', 'center', 'right'] as const)" :key="item" :text="`Align text ${item === 'center' ? 'centre' : item}`">
          <UButton :icon="`i-lucide-align-${item}`" :color="alignment === item ? 'primary' : 'neutral'" :variant="alignment === item ? 'solid' : 'soft'" size="sm" :aria-label="`Align text ${item}`" :aria-pressed="alignment === item" @click="canvas.alignText(item)" />
        </UTooltip>
        <span class="mx-1 h-5 w-px bg-white/10" aria-hidden="true" />
      </template>
      <UTooltip text="Bring to front"><UButton icon="i-lucide-bring-to-front" color="neutral" variant="soft" size="sm" aria-label="Bring to front" @click="canvas.layer(1)" /></UTooltip>
      <UTooltip text="Send to back"><UButton icon="i-lucide-send-to-back" color="neutral" variant="soft" size="sm" aria-label="Send to back" @click="canvas.layer(-1)" /></UTooltip>
    </div>

    <div v-if="contrastItem">
      <p class="mb-1.5 text-xs text-stone-400">Text edge</p>
      <div class="grid grid-cols-4 gap-1" role="radiogroup" aria-label="Text edge">
        <button v-for="option in schedulerTextContrasts" :key="option.value" type="button" role="radio" :aria-checked="(transform.contrast ?? 'none') === option.value" class="h-8 text-xs font-medium transition-colors" :class="(transform.contrast ?? 'none') === option.value ? 'bg-white text-black' : 'bg-white/5 text-stone-300 hover:bg-white/10'" @click="setContrast(option.value)">{{ option.label }}</button>
      </div>
    </div>

    <div class="flex flex-wrap gap-1 border-t border-white/8 pt-3">
      <UButton v-if="selected.group" icon="i-lucide-ungroup" label="Edit parts" color="neutral" variant="ghost" size="sm" @click="canvas.openGroup()" />
      <UButton icon="i-lucide-eye-off" label="Hide" color="neutral" variant="ghost" size="sm" @click="hide" />
      <UButton icon="i-lucide-rotate-ccw" label="Reset" color="neutral" variant="ghost" size="sm" :disabled="!editor.layout.value[selectedId]" @click="canvas.resetSelected()" />
    </div>
    <p v-if="!compact" class="text-[11px] leading-relaxed text-stone-500">Drag to move, drag a corner to resize, or pinch on a touch screen. Arrow keys nudge 1 px (Shift: 10 px). Hold Alt to skip snapping.</p>
  </div>
</template>
