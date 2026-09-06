<template>
  <section aria-labelledby="deadline-title" class="flex flex-wrap items-center justify-between gap-x-5 gap-y-2">
    <div class="flex items-center gap-3">
      <UIcon name="i-lucide-timer" class="size-6 shrink-0 text-lime-300" aria-hidden="true" />
      <div>
        <h2 id="deadline-title" class="text-sm font-semibold text-stone-300">Next deadline</h2>
        <time v-if="deadlineDate" :datetime="deadlineDate.toISOString()" class="mt-1 block text-base font-bold text-white">
          {{ mounted ? deadlineLabel : "Local time" }}
        </time>
        <p v-else class="mt-1 text-sm text-stone-300">{{ statusText }}</p>
      </div>
    </div>
    <div v-if="deadlineDate && mounted" class="text-right">
      <span class="block font-serif text-2xl font-bold text-lime-300">{{ remainingLabel }}</span>
      <span class="text-xs text-stone-400">Local time</span>
    </div>
  </section>
</template>

<script setup>
const props = defineProps({
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

  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(deadlineDate.value);
});

const remainingLabel = computed(() => {
  if (!deadlineDate.value) return "";

  const difference = deadlineDate.value.getTime() - now.value;
  if (difference <= 0) return "Deadline passed";

  const totalMinutes = Math.floor(difference / (1000 * 60));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);

  if (days > 0) return `In ${days}d ${hours}h`;
  if (hours > 0) return `In ${hours}h ${totalMinutes % 60}m`;
  return `In ${Math.max(1, totalMinutes)}m`;
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
  }, 60_000);
});

onBeforeUnmount(() => {
  if (interval) window.clearInterval(interval);
});
</script>
