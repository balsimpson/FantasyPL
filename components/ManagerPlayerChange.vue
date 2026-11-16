<template>
  <dl class="grid w-full grid-cols-2 gap-x-1 text-center tabular-nums">
    <div v-for="metric in metrics" :key="metric.label" class="min-w-0" :title="metric.title">
      <dt class="text-[0.6rem] leading-3 text-stone-300 sm:text-xs">{{ metric.label }}</dt>
      <dd class="text-xs font-bold leading-4" :class="metric.tone">{{ metric.delta }}</dd>
    </div>
  </dl>
</template>

<script setup lang="ts">
import { getManagerLineupDeltas } from '~/utils/manager-lineup-metrics';

const props = defineProps<{ pick: Record<string, any>; comparedPick: Record<string, any>; gameweek: number | null }>();
const metrics = computed(() => getManagerLineupDeltas([props.pick], [props.comparedPick], props.gameweek));
</script>
