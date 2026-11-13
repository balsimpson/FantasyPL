<template>
  <div class="space-y-4">
    <UFormField label="Calendar" class="w-full">
      <USelect v-model="calendarType" :items="calendarTypes" class="w-full" />
    </UFormField>

    <form v-if="calendarType === 'team'" class="space-y-4" novalidate @submit.prevent="loadPreview">
      <UFormField v-if="teams.length > 1" label="Team" class="w-full">
        <USelect v-model="selectedTeam" :items="teams" class="w-full" />
      </UFormField>

      <UFormField
        v-if="selectedTeam === 'manual'"
        label="FPL Manager ID"
        hint="FPL → Points → ID in the page URL"
        :error="idError || undefined"
        class="w-full"
        :ui="{ hint: 'text-stone-400' }"
      >
        <UInput v-model="enteredId" type="text" inputmode="numeric" autocomplete="off" class="w-full" :ui="{ root: 'w-full', base: 'w-full' }" />
      </UFormField>

      <UCheckbox v-model="includeStartingXI" label="Include my starting XI" :ui="{ label: 'text-stone-200' }" />

      <UButton v-if="!preview" type="submit" label="Preview calendar" color="primary" :loading="loading" />
      <p v-if="previewError" class="text-sm text-error" role="alert">{{ previewError }}</p>
    </form>

    <section v-if="calendarType === 'team' && preview" aria-label="Calendar preview" aria-live="polite" class="border-t border-white/10 pt-4">
      <h3 class="break-words text-sm font-semibold">{{ preview.name }}</h3>
      <ul v-if="preview.events.length" class="mt-2 divide-y divide-white/10">
        <li v-for="entry in preview.events" :key="entry.uid" class="py-2 text-sm">
          <p>{{ entry.title }}</p>
          <time :datetime="entry.start" class="text-xs text-stone-400">{{ formatTime(entry.start) }}</time>
        </li>
      </ul>
      <p v-else class="mt-2 text-sm text-stone-400">No upcoming events.</p>
    </section>

    <div v-if="subscriptionUrl" class="flex flex-wrap gap-2">
      <a
        :href="subscriptionUrl.replace(/^https?:/, 'webcal:')"
        class="inline-flex min-h-9 items-center gap-2 rounded-md bg-lime-300 px-3 text-sm font-medium text-zinc-950 hover:bg-lime-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300"
      >
        <UIcon name="i-lucide-calendar-plus" class="size-4" aria-hidden="true" />
        Subscribe
      </a>
      <UButton
        type="button"
        color="neutral"
        variant="outline"
        :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
        :label="copied ? 'Link copied' : 'Copy link'"
        @click="copyLink(subscriptionUrl)"
      />
    </div>
    <UFormField v-if="copyError" label="Subscription link" hint="Copy this link into your calendar app." class="w-full">
      <UInput :model-value="subscriptionUrl ?? ''" readonly class="w-full" :ui="{ root: 'w-full', base: 'w-full' }" @focus="selectLink" />
    </UFormField>
    <p v-if="copied" class="sr-only" role="status">Calendar link copied.</p>
  </div>
</template>

<script setup lang="ts">
import { useManagerCalendarSubscription, type CalendarTeam } from "~/composables/useManagerCalendarSubscription";

const props = defineProps<{ deadlineUrl: string; initialTeam?: CalendarTeam }>();
const {
  calendarTypes, calendarType, selectedTeam, teams, enteredId, includeStartingXI,
  preview, loading, idError, previewError, subscriptionUrl, loadPreview,
} = useManagerCalendarSubscription(() => props.deadlineUrl, props.initialTeam);

const copied = ref(false);
const copyError = ref(false);
const dateFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" });
const formatTime = (start: string) => dateFormat.format(new Date(start));

watch(subscriptionUrl, () => {
  copied.value = false;
  copyError.value = false;
});

async function copyLink(url: string) {
  copyError.value = false;
  try {
    await navigator.clipboard.writeText(url);
    if (subscriptionUrl.value === url) copied.value = true;
  } catch {
    if (subscriptionUrl.value === url) copyError.value = true;
  }
}

function selectLink(event: FocusEvent) {
  if (event.target instanceof HTMLInputElement) event.target.select();
}
</script>
