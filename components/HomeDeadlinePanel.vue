<template>
  <section aria-label="Next gameweek deadline" class="@container min-w-0 rounded-xl border border-white/10 bg-[#101216] p-3 text-white">
    <div class="flex min-w-0 flex-col gap-2 @[20rem]:flex-row @[20rem]:items-center @[20rem]:justify-between @[20rem]:gap-4">
      <div class="min-w-0">
        <h2 class="flex flex-wrap items-center gap-2 text-xs font-medium text-stone-400">
          Next deadline
          <span v-if="gameweek" class="inline-flex rounded-md border border-lime-300/25 bg-lime-300/5 px-1.5 py-0.5 text-[10px] leading-none text-lime-200">GW {{ gameweek }}</span>
        </h2>
        <time v-if="deadlineDate" :datetime="deadlineDate.toISOString()" class="mt-1 block text-sm font-semibold leading-5 text-white">
          {{ deadlineLabel }}
        </time>
        <p v-if="!deadlineDate" class="mt-1 text-sm text-stone-300">{{ statusText }}</p>
      </div>
      <div v-if="deadlineDate" class="shrink-0">
        <div role="timer" aria-label="Time remaining" aria-live="off">
          <p v-if="deadlinePassed" class="text-sm font-medium text-stone-300">Deadline passed</p>
          <dl v-else class="grid w-fit grid-cols-4 divide-x divide-white/10">
            <div v-for="segment in segments" :key="segment.label" class="flex min-w-0 flex-col items-center gap-0.5 px-2 first:pl-0 last:pr-0">
              <dt class="order-last text-[9px] font-medium leading-3 text-stone-400">{{ segment.label }}</dt>
              <dd class="min-h-6 min-w-[2ch] text-center text-lg font-bold leading-6 tabular-nums" :class="segment.label === 'Sec' ? 'text-lime-200' : 'text-white'">{{ segment.value }}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>

    <div class="mt-2.5 border-t border-white/10 pt-2.5">
      <div class="flex min-w-0 flex-wrap items-center justify-between gap-2">
        <div class="flex min-w-0 items-center gap-2">
          <UIcon name="i-lucide-calendar-days" class="size-4 shrink-0 text-lime-200" aria-hidden="true" />
          <h3 class="text-xs font-medium text-stone-300">FPL deadlines</h3>
        </div>

        <CalendarSubscribeActions />
      </div>

    </div>
  </section>
</template>

<script setup>

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
const emit = defineEmits(["expired"]);

const mounted = ref(false);
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
watch([mounted, deadlinePassed], ([ready, passed]) => {
  if (ready && passed) emit("expired");
});

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
