<template>
  <section aria-label="Calendar preview" class="border-t border-white/10 pt-4">
    <h3 class="break-words text-sm font-semibold text-white">{{ name }}</h3>
    <div v-if="days.length" class="mt-2 space-y-2">
      <section v-for="day in days" :key="day.label">
        <h4 class="border-b border-white/10 py-1 text-xs font-semibold text-stone-300">
          {{ day.label }}
        </h4>
        <ul class="space-y-1.5 pt-1.5">
          <li
            v-for="entry in day.events"
            :key="entry.uid"
            class="rounded-md bg-lime-300/5 px-2.5 py-1.5"
          >
            <template v-if="entry.players?.length">
              <p class="text-sm font-semibold leading-5 text-white">{{ entry.players.join(" · ") }}</p>
              <p class="text-xs leading-4 text-stone-300">{{ entry.title }}</p>
            </template>
            <p v-else class="text-sm font-medium leading-5 text-white">{{ entry.title }}</p>
            <div class="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs leading-4 text-stone-300">
              <p v-if="entry.location" class="flex items-start gap-1">
                <UIcon name="i-lucide-map-pin" class="size-3.5 shrink-0" aria-hidden="true" />
                {{ entry.location }}
              </p>
              <p class="flex items-center gap-1">
                <UIcon name="i-lucide-clock" class="size-3.5 shrink-0" aria-hidden="true" />
                <time :datetime="entry.start">{{ timeFormat.format(new Date(entry.start)) }}</time>
              </p>
            </div>
          </li>
        </ul>
      </section>
    </div>
    <p v-else class="mt-2 text-sm text-stone-400">No upcoming events.</p>
  </section>
</template>

<script setup lang="ts">
import type { CalendarPreviewEntry } from "~/composables/useManagerCalendarSubscription";

const props = defineProps<{ name: string; events: CalendarPreviewEntry[] }>();
const dateFormat = new Intl.DateTimeFormat("en-GB", {
  weekday: "short", day: "numeric", month: "short", year: "numeric",
});
const timeFormat = new Intl.DateTimeFormat("en-GB", { hour: "numeric", minute: "2-digit", hour12: true });

const days = computed(() => {
  const grouped = new Map<string, CalendarPreviewEntry[]>();
  for (const entry of props.events) {
    const label = dateFormat.format(new Date(entry.start));
    const day = grouped.get(label);
    if (day) day.push(entry);
    else grouped.set(label, [entry]);
  }
  return Array.from(grouped, ([label, events]) => ({ label, events }));
});
</script>
