<template>
  <dl class="grid grid-cols-2 gap-x-4 gap-y-3 border-y border-white/10 py-3 sm:grid-cols-4" aria-label="XI performance compared with published squad">
    <div v-for="metric in metrics" :key="metric.key" class="min-w-0" :title="metric.title">
      <dt class="min-h-8 text-xs font-medium leading-4 text-stone-400">{{ metric.label }}</dt>
      <dd class="mt-1 text-xl font-bold leading-6 tabular-nums text-white">{{ metric.value }}</dd>
      <dd class="mt-1 flex h-4 items-center gap-1 text-[0.65rem] leading-4 tabular-nums" :class="[metric.tone, suggested ? '' : 'invisible']" title="Compared with published XI"><UIcon v-if="metric.icon" :name="metric.icon" class="size-3 shrink-0" aria-hidden="true" />{{ metric.delta }}<span class="text-stone-400">vs published</span></dd>
    </div>
  </dl>
</template>

<script setup>
import { useManagerSquadPerformance } from '~/composables/useManagerSquadPerformance';
const props = defineProps({
  squad: { type: Object, required: true }, publishedSquad: { type: Object, required: true },
  rows: { type: Array, default: () => [] }, gameweek: { type: Number, default: null }, suggested: { type: Boolean, default: false },
});
const metrics = useManagerSquadPerformance(() => props.squad, () => props.publishedSquad, () => props.rows, () => props.gameweek);
</script>
