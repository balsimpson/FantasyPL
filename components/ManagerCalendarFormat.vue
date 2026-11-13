<template>
  <UFormField label="Calendar entry" description="Drag tags to reorder, or select one for move options." class="w-full">
    <UInputTags
      ref="tagInput"
      :model-value="title"
      :ui="{
        root: 'w-full select-none', base: 'w-full', input: 'hidden',
        item: 'p-0 has-[button[data-dragging]]:opacity-25 has-[button[data-drop-target]]:ring-primary',
        itemText: 'flex items-center', itemDelete: 'hidden',
      }"
      @update:model-value="updateTitle"
    >
      <template #item-text="{ item }">
        <UDropdownMenu :items="moveOptions(item)" :content="{ align: 'start' }">
          <UButton
            type="button"
            color="neutral"
            variant="link"
            size="xs"
            :label="matchTitleLabels[item]"
            :aria-label="`Reorder ${matchTitleLabels[item]} tag`"
            :data-title-part="item"
            :data-dragging="drag?.part === item && floating ? '' : undefined"
            :data-drop-target="dropTarget === item ? '' : undefined"
            draggable="false"
            class="min-h-8 cursor-grab touch-none select-none px-2 text-default active:cursor-grabbing"
            @pointerdown="startDrag(item, $event)"
            @pointermove="trackDrag"
            @pointerup="finishDrag"
            @pointercancel="cancelDrag"
            @lostpointercapture="cancelDrag"
            @dragstart.prevent
            @click.capture="preventDragClick"
            @keydown.stop
          />
        </UDropdownMenu>
        <UButton
          v-if="title.length > 1"
          type="button"
          color="neutral"
          variant="link"
          size="xs"
          icon="i-lucide-x"
          :aria-label="`Remove ${matchTitleLabels[item]} tag`"
          class="mr-0.5 min-h-7 px-1 text-muted"
          @click="updateTitle(title.filter((part) => part !== item))"
          @keydown.stop
        />
      </template>
      <UDropdownMenu v-if="addOptions.length" :items="addOptions" :content="{ align: 'start' }">
        <UButton type="button" color="neutral" variant="ghost" size="xs" icon="i-lucide-plus" label="Add tag" class="min-h-7" @keydown.stop />
      </UDropdownMenu>
    </UInputTags>
    <Teleport to="body">
      <div
        v-if="drag && floating"
        aria-hidden="true"
        class="pointer-events-none fixed top-0 left-0 z-[100] flex items-center justify-between gap-2 rounded-sm bg-[#242932] px-2 text-xs font-medium text-white shadow-lg ring ring-lime-300/75"
        :style="{ transform: `translate3d(${floating.x}px, ${floating.y}px, 0)`, width: `${drag.rect.width}px`, height: `${drag.rect.height}px` }"
      >
        {{ matchTitleLabels[drag.part] }}
        <UIcon v-if="title.length > 1" name="i-lucide-x" class="size-4 shrink-0 text-stone-400" />
      </div>
    </Teleport>
  </UFormField>
</template>

<script setup lang="ts">
import { matchTitleLabels, matchTitleParts, type MatchTitlePart } from "~/shared/manager-calendar-format";

const title = defineModel<MatchTitlePart[]>({ required: true });
const tagInput = useTemplateRef("tagInput");
const addOptions = computed(() => matchTitleParts.filter((part) => !title.value.includes(part)).map((part) => ({
  label: matchTitleLabels[part],
  onSelect: () => { title.value = [...title.value, part]; },
})));

function updateTitle(parts: MatchTitlePart[]) {
  if (parts.length) title.value = parts;
}

function moveOptions(part: MatchTitlePart) {
  const index = title.value.indexOf(part);
  return [
    { label: "Move left", icon: "i-lucide-arrow-left", disabled: index <= 0, onSelect: () => move(part, -1) },
    { label: "Move right", icon: "i-lucide-arrow-right", disabled: index >= title.value.length - 1, onSelect: () => move(part, 1) },
    { label: "Move to front", icon: "i-lucide-arrow-left-to-line", disabled: index <= 1, onSelect: () => move(part, -index) },
  ];
}

async function move(part: MatchTitlePart, offset: number) {
  const parts = [...title.value];
  const index = parts.indexOf(part);
  const target = index + offset;
  if (index < 0 || target < 0 || target >= parts.length) return;
  const animate = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const before = animate ? tagRects() : undefined;
  if (before && floating.value && drag.value?.part === part) {
    before.set(part, { left: floating.value.x, top: floating.value.y });
  }
  parts.splice(index, 1);
  parts.splice(target, 0, part);
  title.value = parts;
  if (!before) return;
  await nextTick();
  for (const item of tagPills()) {
    const previous = before.get(item.part);
    if (!previous) continue;
    const current = item.element.getBoundingClientRect();
    const x = previous.left - current.left;
    const y = previous.top - current.top;
    if (x || y) item.element.animate(
      [{ transform: `translate(${x}px, ${y}px)` }, { transform: "translate(0, 0)" }],
      { duration: 190, easing: "cubic-bezier(0.2, 0.75, 0.25, 1)" },
    );
  }
}

function tagPills() {
  const root = tagInput.value?.$el as HTMLElement | undefined;
  return Array.from(root?.querySelectorAll<HTMLElement>("[data-title-part]") ?? [], (button) => ({
    part: button.dataset.titlePart as MatchTitlePart,
    element: button.closest<HTMLElement>('[data-slot="item"]') ?? button,
  }));
}

function tagRects() {
  return new Map<MatchTitlePart, { left: number; top: number }>(
    tagPills().map(({ part, element }) => [part, element.getBoundingClientRect()]),
  );
}

const drag = shallowRef<{ part: MatchTitlePart; x: number; y: number; rect: DOMRect }>();
const floating = shallowRef<{ x: number; y: number }>();
const dropTarget = ref<MatchTitlePart>();
let ignoreClick = false;

function startDrag(part: MatchTitlePart, event: PointerEvent) {
  if (!event.isPrimary || event.button !== 0) return;
  const button = event.currentTarget as HTMLElement;
  const rect = (button.closest('[data-slot="item"]') ?? button).getBoundingClientRect();
  button.setPointerCapture(event.pointerId);
  ignoreClick = false;
  drag.value = { part, x: event.clientX, y: event.clientY, rect };
}

function trackDrag(event: PointerEvent) {
  if (!drag.value || !event.isPrimary) return;
  const { part, x, y, rect } = drag.value;
  if (!ignoreClick && Math.hypot(event.clientX - x, event.clientY - y) < 6) return;
  ignoreClick = true;
  floating.value = { x: rect.left + event.clientX - x, y: rect.top + event.clientY - y };
  const item = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-slot="item"]');
  const target = item?.querySelector<HTMLElement>("[data-title-part]")?.dataset.titlePart as MatchTitlePart | undefined;
  dropTarget.value = target && target !== part && title.value.includes(target) ? target : undefined;
}

function finishDrag() {
  if (drag.value && dropTarget.value) {
    const part = drag.value.part;
    move(part, title.value.indexOf(dropTarget.value) - title.value.indexOf(part));
  }
  cancelDrag();
}

function cancelDrag() {
  drag.value = undefined;
  floating.value = undefined;
  dropTarget.value = undefined;
}

function preventDragClick(event: MouseEvent) {
  if (event.detail && ignoreClick) {
    event.preventDefault();
    event.stopImmediatePropagation();
  }
}
</script>
