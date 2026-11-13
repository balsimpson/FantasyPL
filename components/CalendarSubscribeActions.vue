<template>
  <UModal
    v-model:open="open"
    title="Connect calendar"
    :ui="{
      content: 'dark max-w-md bg-[#101216] text-white divide-white/10 ring-white/10',
      title: 'text-white',
      overlay: 'bg-black/70',
      close: 'text-stone-300 hover:bg-lime-300/10 hover:text-lime-200',
    }"
  >
    <UButton
      type="button"
      color="primary"
      variant="soft"
      size="xs"
      icon="i-lucide-calendar-plus"
      label="Connect calendar"
      class="min-h-8 rounded-lg border border-lime-300/25 bg-lime-300/10 px-2.5 text-lime-200 hover:bg-lime-300/15"
    />
    <template #body>
      <ManagerCalendarForm v-if="open" :deadline-url="deadlineUrl" :initial-team="initialTeam" />
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { CalendarTeam } from "~/composables/useManagerCalendarSubscription";
import { useCanonicalUrl } from "~/composables/useCanonicalUrl";

defineProps<{ initialTeam?: CalendarTeam }>();
const open = ref(false);
const deadlineUrl = useCanonicalUrl("/calendar/deadlines.ics");
</script>
