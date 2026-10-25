<template>
  <section aria-label="Next gameweek deadline" class="@container min-w-0 rounded-xl border border-white/15 bg-[#181d1c] p-3 text-white sm:p-4">
    <div class="flex min-w-0 flex-col gap-3 @[42rem]:flex-row @[42rem]:items-center @[42rem]:justify-between @[42rem]:gap-6">
      <div class="min-w-0">
        <h2 class="flex flex-wrap items-center gap-x-3 gap-y-2 text-[10px] font-medium uppercase tracking-[0.16em] text-stone-300">
          Next deadline
          <span v-if="gameweek" class="border-l border-white/20 pl-3">
            <span class="inline-flex rounded-full border border-lime-300/40 px-2.5 py-1 text-[11px] leading-none tracking-[0.08em] text-lime-300">GW {{ gameweek }}</span>
          </span>
        </h2>
        <time v-if="deadlineDate" :datetime="deadlineDate.toISOString()" class="mt-1.5 block text-lg font-medium leading-snug tracking-tight text-white @[42rem]:text-xl">
          {{ deadlineLabel }}
        </time>
        <p v-if="!deadlineDate" class="mt-1 text-sm text-stone-300">{{ statusText }}</p>
      </div>
      <div v-if="deadlineDate" class="shrink-0 @[42rem]:border-l @[42rem]:border-white/20 @[42rem]:pl-5">
        <div role="timer" aria-label="Time remaining" aria-live="off">
          <p v-if="deadlinePassed" class="text-sm font-medium text-stone-300">Deadline passed</p>
          <dl v-else class="grid grid-cols-4 divide-x divide-white/20">
            <div v-for="segment in segments" :key="segment.label" class="flex min-w-0 flex-col items-center gap-1 px-2 first:pl-0 last:pr-0 @[42rem]:px-3">
              <dt class="order-last text-[9px] font-medium uppercase tracking-[0.16em] text-stone-300">{{ segment.label }}</dt>
              <dd class="min-h-7 min-w-[2ch] text-center text-2xl font-semibold leading-7 tracking-tight tabular-nums @[42rem]:text-3xl @[42rem]:leading-8" :class="segment.label === 'Sec' ? 'text-lime-300' : 'text-white'">{{ segment.value }}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>

    <div class="mt-4 border-t border-white/10 pt-4">
      <div class="flex min-w-0 flex-col gap-4 @[42rem]:flex-row @[42rem]:items-center @[42rem]:justify-between">
        <div class="flex min-w-0 items-start gap-3">
          <span class="grid size-10 shrink-0 place-items-center rounded-lg border border-lime-300/20 bg-lime-300/10 text-lime-300">
            <UIcon name="i-lucide-calendar-days" class="size-5" aria-hidden="true" />
          </span>
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="text-sm font-semibold text-white">Sync all FPL deadlines</h3>
              <span class="inline-flex items-center gap-1 rounded-full border border-lime-300/20 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-lime-200">
                <span class="size-1.5 rounded-full bg-lime-300" aria-hidden="true" />
                Live schedule
              </span>
            </div>
            <div class="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-300">
              <span class="inline-flex items-center gap-1.5">
                <UIcon name="i-lucide-refresh-cw" class="size-3.5 text-stone-400" aria-hidden="true" />
                Upcoming gameweeks update automatically
              </span>
              <span class="inline-flex items-center gap-1.5">
                <UIcon name="i-lucide-bell-ring" class="size-3.5 text-stone-400" aria-hidden="true" />
                Up to 3 reminders per deadline
              </span>
            </div>
          </div>
        </div>

        <div class="flex shrink-0 flex-wrap items-center gap-2 @[42rem]:justify-end">
          <a
            :href="webcalUrl"
            class="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-lime-300 px-4 text-sm font-semibold text-zinc-950 transition-colors hover:bg-lime-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300"
          >
            <UIcon name="i-lucide-calendar-plus" class="size-4" aria-hidden="true" />
            Connect calendar
          </a>
          <button
            type="button"
            class="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-white/15 px-3 text-sm font-medium text-stone-200 transition-colors hover:border-white/25 hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300"
            @click="copyCalendarLink"
          >
            <UIcon :name="calendarLinkCopied ? 'i-lucide-check' : 'i-lucide-copy'" class="size-4" aria-hidden="true" />
            {{ calendarLinkCopied ? "Link copied" : "Copy link" }}
          </button>
        </div>
      </div>

      <p v-if="calendarCopyError" class="mt-3 pl-[3.25rem] text-xs leading-5 text-amber-200">
        Copy was blocked; the subscription link is {{ calendarUrl }}.
      </p>
      <p v-if="calendarLinkCopied" class="sr-only" role="status">Calendar subscription link copied.</p>
    </div>
  </section>
</template>

<script setup>
import { DEFAULT_SITE_URL } from "~/utils/site-url";

const props = defineProps({
  gameweek: {
    type: Number,
    default: null,
  },
  deadline: {
    type: [String, Date],
    default: null,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: Boolean,
    default: false,
  },
});

const mounted = ref(false);
const calendarLinkCopied = ref(false);
const calendarCopyError = ref(false);
const calendarUrl = `${DEFAULT_SITE_URL}/calendar/deadlines.ics`;
const webcalUrl = calendarUrl.replace(/^https?:/, "webcal:");
const renderTime = useState("deadline-render-time", () => Date.now());
const now = ref(import.meta.server || useNuxtApp().isHydrating ? renderTime.value : Date.now());
let interval;

const deadlineDate = computed(() => {
  if (!props.deadline) return null;
  const date = new Date(props.deadline);
  return Number.isNaN(date.getTime()) ? null : date;
});

const deadlineLabel = computed(() => {
  if (!deadlineDate.value) return "";

  return new Intl.DateTimeFormat(mounted.value ? undefined : "en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    ...(!mounted.value ? { timeZone: "UTC", timeZoneName: "short" } : {}),
  }).format(deadlineDate.value);
});

const deadlinePassed = computed(() => deadlineDate.value && deadlineDate.value.getTime() <= now.value);

const segments = computed(() => {
  const totalSeconds = Math.max(0, Math.ceil(((deadlineDate.value?.getTime() || now.value) - now.value) / 1000));
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (value) => String(value).padStart(2, "0");

  return [
    { label: "Days", value: pad(days) },
    { label: "Hours", value: pad(hours) },
    { label: "Min", value: pad(minutes) },
    { label: "Sec", value: pad(seconds) },
  ];
});

const statusText = computed(() => {
  if (props.loading) return "Loading the next published gameweek deadline.";
  if (props.error) return "The current FPL data is unavailable, so the deadline cannot be confirmed.";
  if (!props.deadline) return "No future gameweek deadline is published in the current FPL data.";
  if (!deadlineDate.value) return "The current FPL data did not include a usable deadline.";
  return "Make changes before the gameweek locks.";
});

async function copyCalendarLink() {
  calendarCopyError.value = false;
  try {
    await navigator.clipboard.writeText(calendarUrl.value);
    calendarLinkCopied.value = true;
    window.setTimeout(() => { calendarLinkCopied.value = false; }, 2500);
  } catch {
    calendarCopyError.value = true;
  }
}

onMounted(() => {
  mounted.value = true;
  now.value = Date.now();
  interval = window.setInterval(() => {
    now.value = Date.now();
  }, 1000);
});

onBeforeUnmount(() => {
  if (interval) window.clearInterval(interval);
});
</script>
