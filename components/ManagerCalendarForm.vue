<template>
  <div class="space-y-4">
    <UFormField label="Calendar" class="w-full">
      <USelect v-model="calendarType" :items="calendarTypes" class="w-full" />
    </UFormField>

    <div v-if="calendarType === 'team'" class="space-y-4">
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

    </div>

    <div v-if="subscriptionUrl || showPreview" class="flex min-h-9 flex-wrap items-start gap-2">
      <a
        v-if="subscriptionUrl"
        :href="subscriptionUrl.replace(/^https?:/, 'webcal:')"
        class="inline-flex min-h-9 items-center gap-2 rounded-md bg-lime-300 px-3 text-sm font-medium text-zinc-950 hover:bg-lime-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300"
      >
        <UIcon name="i-lucide-calendar-plus" class="size-4" aria-hidden="true" />
        Subscribe
      </a>
      <UButton
        v-if="subscriptionUrl"
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

    <div v-if="showPreview" class="space-y-2 border-t border-white/10 pt-3">
      <ManagerCalendarFormat v-model="matchTitle" />
      <ManagerCalendarAgenda v-if="preview" :entry="preview.events[0]" :match-title="matchTitle" />
      <div v-else-if="previewError" class="flex flex-wrap items-center gap-2">
        <p class="text-sm text-error" role="alert">{{ previewError }}</p>
        <UButton type="button" label="Retry" color="neutral" variant="outline" size="xs" @click="loadPreview" />
      </div>
      <div v-else role="status">
        <p class="sr-only">Loading calendar preview…</p>
        <USkeleton class="h-20 w-full rounded-md" aria-hidden="true" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useManagerCalendarSubscription, type CalendarTeam } from "~/composables/useManagerCalendarSubscription";

const props = defineProps<{ deadlineUrl: string; initialTeam?: CalendarTeam }>();
const {
  calendarTypes, calendarType, selectedTeam, teams, enteredId,
  preview, showPreview, idError, previewError, subscriptionUrl, loadPreview, matchTitle,
} = useManagerCalendarSubscription(() => props.deadlineUrl, props.initialTeam);

const copied = ref(false);
const copyError = ref(false);

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
