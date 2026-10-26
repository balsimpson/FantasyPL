<template>
  <UModal v-model:open="open" title="Head to head" :description="`GW ${gameweek} lineup`" :ui="{ content: 'max-w-xl bg-[#101216] text-white divide-white/10 ring-white/10', header: 'min-h-0 px-4 py-3', body: 'p-0 sm:p-0', title: 'text-sm text-white', description: 'text-xs text-stone-400', overlay: 'bg-black/70', close: 'bg-transparent text-stone-300 hover:bg-lime-300/10 hover:text-lime-200 focus-visible:bg-lime-300/10 focus-visible:outline-2 focus-visible:outline-lime-300' }">
    <template #body>
      <div v-if="pair">
        <div class="relative grid h-44 grid-cols-2 border-b border-white/10 sm:h-52">
          <ManagerPlannerPlayer :pick="pair.outgoing" label="Published XI" />
          <ManagerPlannerPlayer :pick="pair.incoming" label="Suggested XI" align="right" />
          <span class="pointer-events-none absolute left-1/2 top-1/2 z-40 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-[#101216] px-2 py-1 text-[0.6rem] font-bold text-stone-200" aria-hidden="true">vs</span>
        </div>
        <div class="px-3 pb-3 pt-1 sm:px-4">
        <table class="w-full table-fixed text-xs tabular-nums">
          <caption class="sr-only">Published and suggested player statistics, gains and losses</caption>
          <colgroup><col class="w-[32%]" /><col class="w-[36%]" /><col class="w-[32%]" /></colgroup>
          <thead><tr class="text-[0.65rem] text-stone-400 sm:text-xs"><th scope="col" class="py-2 text-left font-medium">Published</th><th scope="col" class="py-2 text-center font-medium">Measure</th><th scope="col" class="py-2 text-right font-medium">Suggested</th></tr></thead>
          <tbody class="divide-y divide-white/10">
            <tr><td class="py-1.5 text-left leading-5 text-stone-300">{{ fixtureText(pair.outgoing) }}</td><th scope="row" class="px-2 py-1.5 text-center text-xs font-medium text-stone-400">GW {{ gameweek }} fixtures</th><td class="py-1.5 text-right leading-5 text-stone-300">{{ fixtureText(pair.incoming) }}</td></tr>
            <tr v-for="row in metrics" :key="row.label">
              <td class="py-1.5 text-left font-semibold text-white">{{ row.current }}</td>
              <th scope="row" class="px-2 py-1.5 text-center text-xs font-medium text-stone-400">{{ row.label }}</th>
              <td class="py-1.5 text-right"><span class="flex flex-wrap items-center justify-end gap-x-1.5 gap-y-0.5">
                <span class="font-semibold [overflow-wrap:anywhere]" :class="row.icon ? row.tone : 'text-white'">{{ row.suggested }}</span>
                <span class="inline-flex items-center justify-end gap-0.5 text-[0.65rem]" :class="row.tone" :aria-label="`${row.changeLabel}: ${row.deltaLabel}`"><UIcon v-if="row.icon" :name="row.icon" class="size-3 shrink-0" aria-hidden="true" />{{ row.deltaLabel }}</span>
              </span></td>
            </tr>
          </tbody>
        </table>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup>
import { getManagerDifficultyLabel } from '~/utils/manager-planner';
const open = defineModel('open', { type: Boolean, default: false });
const props = defineProps({ pair: { type: Object, default: null }, gameweek: { type: Number, default: null }, rows: { type: Array, default: () => [] } });
const fixturesFor = (pick) => props.rows.find((row) => row.pick.element.id === pick.element.id)?.run.find((week) => week.gameweek === props.gameweek)?.matches ?? [];
const fixtureText = (pick) => fixturesFor(pick).map((match) => `${match.shortName} ${match.venue === 'Home' ? 'H' : 'A'} · ${getManagerDifficultyLabel(match.difficulty)}`).join(' / ') || 'No match';
const metrics = useManagerComparisonMetrics(() => props.pair);
</script>
