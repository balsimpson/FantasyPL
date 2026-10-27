<template>
  <dl class="grid grid-cols-6 gap-x-3 gap-y-1 sm:grid-cols-12 lg:grid-cols-7" aria-label="XI price, actual manager points and lineup performance">
    <div v-for="stat in summary" :key="stat.label" class="col-span-2 row-span-2 grid min-w-0 grid-rows-subgrid sm:col-span-4 lg:col-span-1 lg:row-span-3" :title="stat.title">
      <dt class="text-xs font-medium leading-4 text-stone-400">{{ stat.label }}</dt>
      <dd class="font-sans text-lg font-bold leading-6 tabular-nums" :class="stat.tone">{{ stat.value }}</dd>
    </div>
    <div v-for="metric in metrics" :key="metric.key" class="col-span-3 row-span-3 mt-3 grid min-w-0 grid-rows-subgrid lg:col-span-1 lg:mt-0" :title="metric.title">
      <dt class="text-xs font-medium leading-4 text-stone-400">{{ metric.label }}</dt>
      <dd class="font-sans text-lg font-bold leading-6 tabular-nums text-white">{{ metric.value }}</dd>
      <dd class="flex h-4 items-center gap-1 whitespace-nowrap text-[0.6rem] leading-4 tabular-nums" :class="[metric.tone, suggested ? '' : 'invisible']" title="Compared with published XI"><UIcon v-if="metric.icon" :name="metric.icon" class="size-3 shrink-0" aria-hidden="true" />{{ metric.delta }}<span class="text-stone-400">vs published</span></dd>
    </div>
  </dl>
</template>

<script setup>
import { useManagerSquadPerformance } from '~/composables/useManagerSquadPerformance';
const props = defineProps({
  squad: { type: Object, required: true }, publishedSquad: { type: Object, required: true },
  rows: { type: Array, default: () => [] }, gameweek: { type: Number, default: null }, suggested: { type: Boolean, default: false },
  publishedGameweek: { type: Number, default: null }, gameweekPoints: { type: Number, default: null }, seasonPoints: { type: Number, default: null },
});
const formatPoints = (value) => value == null || !Number.isFinite(value) ? '—' : value.toLocaleString('en-GB');
const summary = computed(() => [
  { label: 'XI price', value: `£${(props.squad.teamCost / 10).toFixed(1)}m`, tone: 'text-white', title: 'Current cost of the displayed starting XI.' },
  { label: props.publishedGameweek ? `GW ${props.publishedGameweek} points` : 'Gameweek points', value: formatPoints(props.gameweekPoints), tone: 'text-lime-300', title: "Manager's actual points for the published gameweek, independent of the suggested XI." },
  { label: 'Season points', value: formatPoints(props.seasonPoints), tone: 'text-white', title: "Manager's total season points." },
]);
const metrics = useManagerSquadPerformance(() => props.squad, () => props.publishedSquad, () => props.rows, () => props.gameweek);
</script>
