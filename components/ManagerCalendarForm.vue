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

    <div v-if="subscriptionUrl" class="space-y-3 border-t border-white/10 pt-4">
      <p class="text-xs leading-5 text-stone-400">
        Android app support varies. Google Calendar subscriptions require a computer browser.
      </p>
      <UFormField v-if="copyError" label="Subscription link" hint="Copy this link into your calendar app." class="w-full">
        <UInput :model-value="subscriptionUrl" readonly class="w-full" :ui="{ root: 'w-full', base: 'w-full' }" @focus="selectLink" />
      </UFormField>
      <div class="grid gap-2 sm:grid-cols-2">
        <UDropdownMenu
          :items="calendarProviderItems"
          :content="{ align: 'start', side: 'top' }"
          :ui="{ content: 'w-56' }"
        >
          <UButton
            type="button"
            color="primary"
            icon="i-lucide-calendar-plus"
            trailing-icon="i-lucide-chevron-down"
            label="Add calendar"
            class="min-h-10 w-full justify-center"
          />
        </UDropdownMenu>
        <UButton
          type="button"
          color="neutral"
          variant="outline"
          :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
          :label="copied ? 'Link copied' : 'Copy link'"
          class="min-h-10 w-full justify-center"
          @click="copyLink(subscriptionUrl)"
        />
      </div>
    </div>
    <p v-if="copied" class="sr-only" role="status">Calendar link copied.</p>
  </div>
</template>

<script setup lang="ts">
import type { DropdownMenuItem } from "@nuxt/ui";
import { useManagerCalendarSubscription, type CalendarTeam } from "~/composables/useManagerCalendarSubscription";

const props = defineProps<{ deadlineUrl: string; initialTeam?: CalendarTeam }>();
const {
  calendarTypes, calendarType, selectedTeam, teams, enteredId,
  preview, showPreview, idError, previewError, subscriptionUrl, loadPreview, matchTitle,
} = useManagerCalendarSubscription(() => props.deadlineUrl, props.initialTeam);

const calendarProviderItems = computed<DropdownMenuItem[]>(() => {
  const feedUrl = subscriptionUrl.value;
  if (!feedUrl) return [];

  const webcalUrl = feedUrl.replace(/^https?:/, "webcal:");
  const googleUrl = new URL("https://calendar.google.com/calendar/r");
  googleUrl.searchParams.set("cid", webcalUrl);
  const outlookUrl = new URL("https://outlook.live.com/calendar/0/addfromweb");
  outlookUrl.searchParams.set("url", feedUrl);
  const microsoft365Url = new URL("https://outlook.office.com/calendar/0/addfromweb");
  microsoft365Url.searchParams.set("url", feedUrl);

  return [
    { label: "Google Calendar", icon: "i-lucide-calendar-days", to: googleUrl.toString(), target: "_blank", rel: "noopener noreferrer" },
    { label: "Apple Calendar", icon: "i-lucide-calendar-days", to: webcalUrl },
    { label: "Outlook.com", icon: "i-lucide-calendar-days", to: outlookUrl.toString(), target: "_blank", rel: "noopener noreferrer" },
    { label: "Microsoft 365", icon: "i-lucide-calendar-days", to: microsoft365Url.toString(), target: "_blank", rel: "noopener noreferrer" },
  ];
});

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
