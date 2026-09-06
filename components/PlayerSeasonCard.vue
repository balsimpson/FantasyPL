<template>
  <div class="grid grid-cols-2 items-start gap-4 py-4 sm:grid-cols-[1fr_0.7fr_0.8fr_0.6fr_1.8fr]">
    <h3 class="text-base font-semibold text-white">{{ season.season_name }}</h3>
    <dl class="contents tabular-nums">
      <div class="text-right sm:text-left"><dt class="text-xs text-stone-400">Points</dt><dd class="mt-1 text-lg font-semibold text-white">{{ season.total_points }}</dd></div>
      <div><dt class="text-xs text-stone-400">Minutes</dt><dd class="mt-1 text-sm font-semibold text-white">{{ Number(season.minutes || 0).toLocaleString('en-GB') }}</dd></div>
      <div><dt class="text-xs text-stone-400">Goals</dt><dd class="mt-1 text-sm font-semibold text-white">{{ season.goals_scored }}</dd></div>
      <div class="col-span-2 sm:col-span-1"><dt class="text-xs text-stone-400">Price, start to end</dt><dd class="mt-1 text-sm font-medium" :class="valueDeltaClass">{{ valueRangeLabel }}</dd></div>
    </dl>
  </div>
</template>

<script setup>
const props = defineProps({
	season: {
		type: Object,
		required: true,
	},
});

const valueStart = computed(() => Number(props.season.start_cost || 0) / 10);
const valueEnd = computed(() => Number(props.season.end_cost || 0) / 10);
const valueDelta = computed(() => valueEnd.value - valueStart.value);

const valueDeltaClass = computed(() => {
	if (valueDelta.value > 0) return 'text-lime-200';
	if (valueDelta.value < 0) return 'text-rose-200';
	return 'text-stone-200';
});

const formatValue = (value) => `£${Number(value).toFixed(Number.isInteger(value) ? 0 : 1)}m`;

const valueRangeLabel = computed(() => {
	const delta = valueDelta.value;
	const sign = delta > 0 ? '+' : '';
	return `${formatValue(valueStart.value)} → ${formatValue(valueEnd.value)} (${sign}${delta.toFixed(delta % 1 === 0 ? 0 : 1)}m)`;
});
</script>
