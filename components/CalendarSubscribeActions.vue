<template>
  <div class="min-w-0">
    <div class="flex shrink-0 items-center gap-1">
      <a :href="webcalUrl" class="inline-flex min-h-8 items-center justify-center gap-1.5 rounded-lg border border-lime-300/25 bg-lime-300/10 px-2.5 text-xs font-medium text-lime-200 transition-colors hover:bg-lime-300/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300 motion-reduce:transition-none">
        <UIcon name="i-lucide-calendar-plus" class="size-4" aria-hidden="true" />
        Connect calendar
      </a>
      <UButton
        type="button"
        color="neutral"
        variant="ghost"
        :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
        :aria-label="copied ? 'Calendar link copied' : 'Copy calendar link'"
        :title="copied ? 'Link copied' : 'Copy calendar link'"
        class="size-8 justify-center rounded-lg border border-white/10 bg-white/[0.04] p-0 text-stone-300 ring-0 transition-colors hover:border-lime-300/30 hover:bg-lime-300/10 hover:text-lime-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300 motion-reduce:transition-none"
        @click="copyLink"
      />
    </div>
    <p v-if="copyError" class="mt-2 break-words text-xs leading-5 text-amber-200" role="status">Copy was blocked; the subscription link is {{ calendarUrl }}.</p>
    <p v-if="copied" class="sr-only" role="status">Calendar subscription link copied.</p>
  </div>
</template>

<script setup lang="ts">
const calendarUrl = useCanonicalUrl("/calendar/deadlines.ics");
const webcalUrl = computed(() => calendarUrl.value.replace(/^https?:/, "webcal:"));
const copied = ref(false);
const copyError = ref(false);
let resetTimer: ReturnType<typeof setTimeout> | undefined;

const copyLink = async () => {
  copied.value = false;
  copyError.value = false;
  if (resetTimer) clearTimeout(resetTimer);
  try {
    await navigator.clipboard.writeText(calendarUrl.value);
    copied.value = true;
    resetTimer = setTimeout(() => { copied.value = false; }, 2500);
  } catch {
    copyError.value = true;
  }
};
onBeforeUnmount(() => { if (resetTimer) clearTimeout(resetTimer); });
</script>
