<template>
  <section aria-label="Calendar preview" class="rounded-md bg-lime-300/5 px-2.5 py-2">
    <template v-if="entry">
      <p class="text-xs font-medium text-stone-300">{{ dateFormat.format(new Date(entry.start)) }}</p>
      <p class="mt-0.5 text-sm font-medium leading-5 text-white">{{ title }}</p>
      <div class="mt-0.5 flex items-start gap-3 text-xs leading-4 text-stone-300">
        <p class="flex w-22 shrink-0 items-center gap-1 whitespace-nowrap tabular-nums">
          <UIcon name="i-lucide-clock" class="size-3.5 shrink-0" aria-hidden="true" />
          <time :datetime="entry.start">{{ timeFormat.format(new Date(entry.start)) }}</time>
        </p>
        <p v-if="entry.location" class="flex min-w-0 items-start gap-1">
          <UIcon name="i-lucide-map-pin" class="size-3.5 shrink-0" aria-hidden="true" />
          {{ entry.location }}
        </p>
      </div>
    </template>
    <p v-else class="text-sm text-stone-400">No upcoming player fixture to preview.</p>
  </section>
</template>

<script setup lang="ts">
import type { CalendarPreviewEntry } from "~/composables/useManagerCalendarSubscription";
import { formatMatchTitle, type MatchTitlePart } from "~/shared/manager-calendar-format";

const props = defineProps<{ entry?: CalendarPreviewEntry; matchTitle: MatchTitlePart[] }>();
const dateFormat = new Intl.DateTimeFormat("en-GB", {
  weekday: "short", day: "numeric", month: "short", year: "numeric",
});
const timeFormat = new Intl.DateTimeFormat("en-GB", { hour: "numeric", minute: "2-digit", hour12: true });

const title = computed(() => props.entry?.titleValues
  ? formatMatchTitle(props.entry.titleValues, props.matchTitle)
  : props.entry?.title);
</script>
