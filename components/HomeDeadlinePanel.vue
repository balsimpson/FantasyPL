<template>
  <section aria-label="Next gameweek deadline" class="@container min-w-0 rounded-xl border border-white/15 bg-[#181d1c] p-4 text-white sm:p-5">
    <div class="flex min-w-0 flex-col gap-5 @[42rem]:flex-row @[42rem]:items-center @[42rem]:justify-between @[42rem]:gap-8">
      <div class="min-w-0">
        <h2 class="flex flex-wrap items-center gap-x-3 gap-y-2 text-[10px] font-medium uppercase tracking-[0.16em] text-stone-300">
          Next deadline
          <span v-if="gameweek" class="border-l border-white/20 pl-3">
            <span class="inline-flex rounded-full border border-lime-300/40 px-2.5 py-1 text-[11px] leading-none tracking-[0.08em] text-lime-300">GW {{ gameweek }}</span>
          </span>
        </h2>
        <time v-if="deadlineDate" :datetime="deadlineDate.toISOString()" class="mt-2 block text-xl font-medium leading-snug tracking-tight text-white @[42rem]:text-2xl">
          {{ deadlineLabel }}
        </time>
        <p v-if="!deadlineDate" class="mt-1 text-sm text-stone-300">{{ statusText }}</p>
      </div>
      <div v-if="deadlineDate" class="shrink-0 @[42rem]:border-l @[42rem]:border-white/20 @[42rem]:pl-8" role="timer" aria-label="Time remaining" aria-live="off" :aria-busy="!mounted">
        <p v-if="mounted && deadlinePassed" class="text-sm font-medium text-stone-300">Deadline passed</p>
        <dl v-else class="grid grid-cols-4 divide-x divide-white/20">
          <div v-for="segment in segments" :key="segment.label" class="flex min-w-0 flex-col items-center gap-2 px-3 first:pl-0 last:pr-0 @[42rem]:px-5">
            <dt class="order-last text-[9px] font-medium uppercase tracking-[0.16em] text-stone-300">{{ segment.label }}</dt>
            <dd class="min-h-9 min-w-[2ch] text-center text-3xl font-semibold leading-9 tracking-tight tabular-nums @[42rem]:text-4xl" :class="segment.label === 'Sec' ? 'text-lime-300' : 'text-white'">{{ mounted ? segment.value : '' }}</dd>
          </div>
        </dl>
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

const mounted = ref(false);
const now = ref(Date.now());
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
