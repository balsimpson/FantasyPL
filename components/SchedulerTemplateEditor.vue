<script setup lang="ts">
import type { InstagramDraft } from '~/utils/instagram-templates'
import type { useSchedulerLayouts } from '~/composables/useSchedulerLayouts'
import SchedulerPostPreview from '~/components/SchedulerPostPreview.vue'
import { getSchedulerTextContrast, schedulerTextContrasts, type SchedulerTextContrast } from '~/utils/scheduler-layout'
const props = defineProps<{ draft: InstagramDraft; editor: ReturnType<typeof useSchedulerLayouts>; disabled?: boolean; toolbarTarget?: string }>()
const editing = defineModel<boolean>('editing', { default: false })
const preview = useTemplateRef('preview')
const surface = useTemplateRef('surface')
const toolbarContent = useTemplateRef('toolbarContent')
const toolbarWidth = ref<number>()
let toolbarObserver: ResizeObserver | undefined
onMounted(() => {
  if (!toolbarContent.value) return
  toolbarWidth.value = toolbarContent.value.getBoundingClientRect().width
  toolbarObserver = new ResizeObserver(() => {
    if (toolbarContent.value) toolbarWidth.value = toolbarContent.value.getBoundingClientRect().width
  })
  toolbarObserver.observe(toolbarContent.value)
})
onBeforeUnmount(() => toolbarObserver?.disconnect())
const enabled = computed(() => editing.value && !props.disabled)
const revision = computed(() => JSON.stringify(props.draft))
const { elements, visibleElements, scopeId, breadcrumbs, selectedId, selected, transform, snapping, guides, previewWidth, dragging, select, openGroup, navigateGroup, start, move, pointerEnd, finish, resetSelected, align, alignText, resize, layer, keyboard } = useSchedulerCanvas(() => preview.value?.getElement(), surface, enabled, revision, props.editor)
const textSelected = computed(() => ['player-name', 'club-details', 'stats', 'leading-stat'].includes(selectedId.value) || selectedId.value.startsWith('stat-') || selectedId.value.startsWith('stats-') || selectedId.value.startsWith('leading-stat-'))
const textAlignments = [
  { value: 'left', label: 'left', icon: 'i-lucide-align-left' },
  { value: 'center', label: 'centre', icon: 'i-lucide-align-center' },
  { value: 'right', label: 'right', icon: 'i-lucide-align-right' },
] as const
const currentTextAlignment = computed(() => transform.value.align ?? (selected.value?.textAlign === 'start' ? 'left' : selected.value?.textAlign === 'end' ? 'right' : selected.value?.textAlign))
const currentTextContrast = computed(() => getSchedulerTextContrast(props.draft.design, transform.value.contrast))
function setTextContrast(contrast: SchedulerTextContrast) {
  props.editor.change({ ...props.editor.layout.value, [selectedId.value]: { ...transform.value, contrast } })
}
const corners = [
  { id: 'nw', label: 'top left', class: '-top-2 -left-2 cursor-nwse-resize' },
  { id: 'ne', label: 'top right', class: '-top-2 -right-2 cursor-nesw-resize' },
  { id: 'sw', label: 'bottom left', class: '-bottom-2 -left-2 cursor-nesw-resize' },
  { id: 'se', label: 'bottom right', class: '-bottom-2 -right-2 cursor-nwse-resize' },
] as const
const boxStyle = (box: { x: number; y: number; width: number; height: number }) => ({ left: `${box.x / 10.8}%`, top: `${box.y / 10.8}%`, width: `${box.width / 10.8}%`, height: `${box.height / 10.8}%` })
const itemMenu = computed(() => [
  visibleElements.value.map(item => ({ label: item.label, icon: item.id === selectedId.value ? 'i-lucide-check' : undefined, onSelect: () => select(item.id) })),
  [{ label: 'Reset entire layout', icon: 'i-lucide-rotate-ccw', disabled: !Object.keys(props.editor.layout.value).length, onSelect: () => props.editor.change({}) }],
])
const selectionMenu = computed(() => [
  ...(selectedId.value === 'player-name' ? [[{ label: 'Text contrast', icon: 'i-lucide-contrast', children: schedulerTextContrasts.map(option => ({ label: option.label, type: 'checkbox' as const, checked: currentTextContrast.value === option.value, onSelect: () => setTextContrast(option.value) })) }]] : []),
  ...(selected.value?.group && textSelected.value ? [textAlignments.map(item => ({ label: `Align text ${item.label}`, icon: item.icon, onSelect: () => alignText(item.value) }))] : []),
  [{ label: 'Centre horizontally', icon: 'i-lucide-align-center-horizontal', onSelect: () => align('x') },
   { label: 'Centre vertically', icon: 'i-lucide-align-center-vertical', onSelect: () => align('y') }],
  [{ label: 'Bring to front', icon: 'i-lucide-bring-to-front', onSelect: () => layer(1) },
   { label: 'Send to back', icon: 'i-lucide-send-to-back', onSelect: () => layer(-1) }],
  [{ label: `Reset ${selected.value?.label.toLowerCase() ?? 'item'}`, icon: 'i-lucide-rotate-ccw', disabled: !props.editor.layout.value[selectedId.value], onSelect: resetSelected }],
])
const contextStyle = computed(() => {
  if (!selected.value) return {}
  const ratio = previewWidth.value / 1080
  const width = Math.min(244, previewWidth.value - 16)
  const left = Math.max(8, Math.min(selected.value.x * ratio + selected.value.width * ratio / 2 - width / 2, previewWidth.value - width - 8))
  const above = selected.value.y * ratio - 56
  const below = (selected.value.y + selected.value.height) * ratio + 12
  const top = above >= 8 ? above : Math.min(below, previewWidth.value - 48)
  return { width: `${width}px`, left: `${left}px`, top: `${top}px` }
})
const statusText = computed(() => props.editor.storageError.value || props.editor.notice.value || (props.editor.dirty.value ? 'Unsaved layout changes' : editing.value ? (scopeId.value ? 'Select a part to move, resize or align it.' : 'Drag to move. Double-click a group to edit its parts.') : 'Edit a layout, then save it for other players.'))
defineExpose({ getElement: () => preview.value?.getElement() })
</script>

<template>
  <div @keydown="keyboard">
    <Teleport :to="toolbarTarget ?? 'body'" :disabled="!toolbarTarget">
    <div role="toolbar" aria-label="Edit and create post" class="pointer-events-auto h-14 shrink-0 overflow-hidden rounded-full bg-zinc-900 text-white shadow-xl ring-1 ring-white/10 transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none" :style="{ width: toolbarWidth ? `${toolbarWidth}px` : undefined }" @keydown="keyboard">
    <div ref="toolbarContent" class="flex h-14 w-max items-center gap-0.5 whitespace-nowrap px-1.5">
      <UTooltip :text="editing ? 'Finish editing' : 'Edit layout'">
        <UButton :icon="editing ? 'i-lucide-check' : 'i-lucide-pencil'" :label="editing ? 'Done' : 'Edit'" :aria-label="editing ? 'Finish editing' : 'Edit layout'" color="neutral" variant="ghost" class="h-9 justify-center rounded-full px-3 hover:bg-white/10 hover:text-white" :class="editing ? 'bg-white/10 text-primary' : 'text-zinc-300'" :disabled="disabled" :aria-pressed="editing" @click="editing = !editing" />
      </UTooltip>
      <span v-if="editing" class="mx-0.5 h-4 w-px shrink-0 bg-white/15" aria-hidden="true" />
      <UTooltip v-if="editing && editor.canUndo.value" text="Undo (⌘/Ctrl Z)">
        <UButton icon="i-lucide-undo-2" aria-label="Undo layout change" color="neutral" variant="ghost" class="size-9 justify-center rounded-full text-zinc-300 hover:bg-white/10 hover:text-white" :disabled="disabled || !editor.canUndo.value" @click="editor.undo()" />
      </UTooltip>
      <UTooltip v-if="editing && editor.canRedo.value" text="Redo (⌘/Ctrl Shift Z)">
        <UButton icon="i-lucide-redo-2" aria-label="Redo layout change" color="neutral" variant="ghost" class="size-9 justify-center rounded-full text-zinc-300 hover:bg-white/10 hover:text-white" :disabled="disabled || !editor.canRedo.value" @click="editor.redo()" />
      </UTooltip>
      <UTooltip v-if="editing" text="Snap to guides. Hold Alt to bypass.">
        <UButton icon="i-lucide-magnet" aria-label="Snap to guides" :aria-pressed="snapping" color="neutral" variant="ghost" class="size-9 justify-center rounded-full hover:bg-white/10 hover:text-white" :class="snapping && editing ? 'bg-white/10 text-primary' : 'text-zinc-300'" :disabled="!enabled" @click="snapping = !snapping" />
      </UTooltip>
      <UDropdownMenu v-if="editing" :items="itemMenu" :content="{ align: 'start' }" :disabled="!enabled">
        <UTooltip text="Select an item or reset the layout">
          <UButton icon="i-lucide-layers" aria-label="Artwork items" color="neutral" variant="ghost" class="size-9 justify-center rounded-full text-zinc-300 hover:bg-white/10 hover:text-white" :disabled="!enabled" />
        </UTooltip>
      </UDropdownMenu>
      <UTooltip v-if="editor.dirty.value" text="Save this layout in this browser (⌘/Ctrl S)">
        <UButton icon="i-lucide-save" aria-label="Save layout" color="neutral" variant="ghost" class="size-9 justify-center rounded-full text-zinc-300 hover:bg-white/10 hover:text-white" :disabled="disabled || !editor.dirty.value" @click="editor.save()" />
      </UTooltip>
      <slot v-if="!editing" name="actions" />
    </div>
    </div>
    </Teleport>

    <div ref="surface" class="relative w-full focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary" :tabindex="editing ? 0 : undefined" :aria-label="editing ? 'Template canvas. Select an item, then use arrow keys to move it. Shift moves by ten pixels.' : undefined" @pointermove="move" @pointerup="pointerEnd" @pointercancel="pointerEnd" @lostpointercapture="finish(true)">
      <SchedulerPostPreview ref="preview" :draft="draft" />
      <div v-if="enabled" class="absolute inset-0 overflow-hidden" data-layout-controls>
        <button type="button" tabindex="-1" aria-label="Clear selection" class="absolute inset-0 size-full touch-none" @pointerdown="select('')" />
        <button v-for="item in visibleElements" :key="item.id" type="button" :aria-label="`Move ${item.label}`" :aria-pressed="selectedId === item.id" class="absolute touch-none cursor-move border border-transparent bg-transparent hover:border-primary/60 focus-visible:border-primary focus-visible:outline-none" :style="{ ...boxStyle(item), zIndex: item.z + 60 }" @focus="selectedId = item.id" @pointerdown.stop="start($event, item.id)" @dblclick.stop="openGroup(item.id)" />
        <div v-for="guide in guides" :key="`${guide.axis}:${guide.value}`" class="pointer-events-none absolute z-[170] bg-primary" :class="guide.axis === 'x' ? 'inset-y-0 w-px' : 'inset-x-0 h-px'" :style="guide.axis === 'x' ? { left: `${guide.value / 10.8}%` } : { top: `${guide.value / 10.8}%` }" />
      </div>
      <div v-if="enabled && scopeId" class="absolute top-2 left-2 z-[185] flex max-w-[calc(100%-1rem)] items-center overflow-hidden rounded-lg bg-default/95 px-1 py-0.5 shadow-md backdrop-blur-xl" aria-label="Editing group" data-layout-breadcrumb>
        <UButton icon="i-lucide-corner-left-up" label="Template" color="neutral" variant="ghost" size="xs" @click="navigateGroup('')" />
        <template v-for="item in breadcrumbs" :key="item.id">
          <UIcon name="i-lucide-chevron-right" class="size-3 shrink-0 text-muted" aria-hidden="true" />
          <UButton :label="item.label" color="neutral" variant="ghost" size="xs" :disabled="item.id === scopeId" @click="navigateGroup(item.id)" />
        </template>
      </div>
      <div v-if="enabled && selected" class="pointer-events-none absolute z-[180] border-2 border-primary" :style="boxStyle(selected)" data-layout-selection>
        <button type="button" :aria-label="`Move selected ${selected.label}`" tabindex="-1" class="pointer-events-auto absolute inset-0 size-full touch-none cursor-move" @pointerdown.stop="start($event, selected.id)" @dblclick.stop="openGroup(selected.id)" />
        <span class="pointer-events-none absolute -top-5 left-0 max-w-44 truncate rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-inverted">{{ selected.label }}</span>
        <button v-for="corner in corners" :key="corner.id" type="button" :aria-label="`Resize ${selected.label} from ${corner.label}`" class="pointer-events-auto absolute size-6 touch-none rounded-sm border-2 border-primary bg-default focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:size-4" :class="corner.class" @pointerdown.stop="start($event, selected.id, corner.id)" />
      </div>
      <div v-if="enabled && selected" role="toolbar" :aria-label="`${selected.label} controls`" class="absolute z-[190] flex h-10 items-center justify-between gap-0.5 rounded-xl bg-default/95 px-1.5 text-highlighted shadow-lg backdrop-blur-xl transition-opacity duration-150 motion-reduce:transition-none [@media(prefers-reduced-transparency:reduce)]:bg-default [@media(prefers-reduced-transparency:reduce)]:backdrop-blur-none [@media(prefers-contrast:more)]:bg-default" :class="dragging ? 'pointer-events-none opacity-0' : 'opacity-100'" :style="contextStyle" data-layout-context>
        <template v-if="textSelected && !selected.group">
          <UTooltip v-for="alignment in textAlignments" :key="alignment.value" :text="`Align text ${alignment.label}`">
            <UButton :icon="alignment.icon" :aria-label="`Align text ${alignment.label}`" :aria-pressed="currentTextAlignment === alignment.value" :color="currentTextAlignment === alignment.value ? 'primary' : 'neutral'" :variant="currentTextAlignment === alignment.value ? 'soft' : 'ghost'" size="xs" @click="alignText(alignment.value)" />
          </UTooltip>
          <span class="mx-0.5 h-4 w-px shrink-0 bg-accented" aria-hidden="true" />
        </template>
        <UTooltip v-else-if="selected.group" text="Edit the items inside this group. You can also double-click it or press Enter.">
          <UButton icon="i-lucide-ungroup" :label="`Edit ${selected.label.toLowerCase()}`" :aria-label="`Edit ${selected.label} parts`" color="neutral" variant="ghost" size="xs" class="min-w-0 flex-1" :ui="{ label: 'truncate' }" @click="openGroup()" />
        </UTooltip>
        <span v-else class="min-w-0 flex-1 truncate px-1 text-xs font-medium">{{ selected.label }}</span>
        <UTooltip text="Make smaller">
          <UButton icon="i-lucide-minus" aria-label="Make selected item smaller" color="neutral" variant="ghost" size="xs" :disabled="transform.scale <= 0.1" @click="resize(Math.round(transform.scale * 100) - 5)" />
        </UTooltip>
        <span class="w-10 shrink-0 text-center text-xs tabular-nums" aria-label="Item size">{{ Math.round(transform.scale * 100) }}%</span>
        <UTooltip text="Make larger">
          <UButton icon="i-lucide-plus" aria-label="Make selected item larger" color="neutral" variant="ghost" size="xs" :disabled="transform.scale >= 3" @click="resize(Math.round(transform.scale * 100) + 5)" />
        </UTooltip>
        <UDropdownMenu :items="selectionMenu" :content="{ align: 'end' }">
          <UTooltip :text="selectedId === 'player-name' ? 'Text contrast, alignment and arrangement' : 'Align, arrange or reset this item'">
            <UButton icon="i-lucide-ellipsis" :aria-label="`${selected.label} options`" color="neutral" variant="ghost" size="xs" />
          </UTooltip>
        </UDropdownMenu>
      </div>
    </div>
    <p class="h-7 truncate px-2 py-1.5 text-[11px]" :class="editor.storageError.value ? 'text-error' : 'text-muted'" :title="statusText" role="status" aria-live="polite">{{ statusText }}</p>
  </div>
</template>
