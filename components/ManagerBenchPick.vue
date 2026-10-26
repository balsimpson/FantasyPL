<template>
  <div class="group relative row-span-6 grid min-w-0 grid-rows-subgrid overflow-hidden rounded-xl bg-[#0b2119] text-white ring-1" :class="comparedPick ? 'ring-lime-300/40' : 'ring-white/10'">
    <component :is="comparedPick ? 'button' : NuxtLink" :type="comparedPick ? 'button' : undefined" :to="comparedPick ? undefined : getPlayerRoute(frontPick.element)" class="row-span-6 grid min-w-0 grid-rows-subgrid text-center focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-lime-300" :aria-label="comparedPick ? `Compare ${name(frontPick.element)} with ${name(backPick.element)}` : `Open ${name(frontPick.element)} profile`" @click="comparedPick && $emit('compare', pick)">
      <span class="relative block aspect-[4/4.6] w-full bg-[#101216]">
        <span v-if="comparedPick" class="absolute bottom-0 left-0 h-[88%] w-[70%] opacity-75"><PlayerPortrait :player="backPick.element" :alt="name(backPick.element)" /></span>
        <span class="absolute bottom-0 h-full" :class="comparedPick ? 'right-0 w-[75%]' : 'inset-x-0 w-full'"><PlayerPortrait :player="frontPick.element" :alt="name(frontPick.element)" /></span>
        <PlayerDisciplineBadges :yellow-cards="frontPick.element.yellow_cards" :red-cards="frontPick.element.red_cards" compact class="absolute bottom-1 left-1 z-10" />
        <span v-if="frontPick.is_captain || frontPick.is_vice_captain" class="absolute right-1 top-1 grid size-6 place-items-center rounded-full text-xs font-black" :class="frontPick.is_captain ? 'bg-lime-300 text-lime-950' : 'bg-amber-200 text-stone-950'" :aria-label="frontPick.is_captain ? 'Captain' : 'Vice-captain'">{{ frontPick.is_captain ? 'C' : 'V' }}</span>
        <span v-if="comparedPick" class="absolute left-1 top-1 rounded bg-[#0b2119]/95 px-1.5 py-1 text-[0.6rem] font-semibold text-lime-300">Suggested XI</span>
      </span>
      <span class="px-2 text-[0.65rem] leading-4 text-stone-400 [overflow-wrap:anywhere]" :class="comparedPick ? 'bg-black/30 py-1' : ''">{{ comparedPick ? name(backPick.element) : '' }}</span>
      <span class="flex flex-col items-center justify-center gap-1 px-2 py-2">
        <span class="text-sm font-bold leading-5 [overflow-wrap:anywhere]">{{ name(frontPick.element) }}</span>
        <PlayerAge :player="frontPick.element" compact class="text-stone-300" />
        <span v-if="frontPick.element.news" class="text-xs leading-4 text-amber-200">{{ frontPick.element.news }}</span>
      </span>
      <dl class="row-span-2 grid grid-cols-3 grid-rows-subgrid gap-x-1 px-2 pb-2 tabular-nums">
        <div v-for="stat in stats" :key="stat.label" class="contents">
          <dt class="row-start-1 flex items-end justify-center pb-1 text-[0.6rem] leading-4 text-stone-400">{{ stat.label }}</dt>
          <dd class="row-start-2 whitespace-nowrap font-sans text-sm font-bold leading-5" :class="stat.highlight ? 'text-lime-300' : 'text-white'">{{ stat.value }}</dd>
        </div>
      </dl>
      <div class="border-t border-white/10"><ManagerPlayerFixture :matches="frontMatches" :available="fixturesAvailable" compact integrated /></div>
    </component>
    <PlayerWatchlistButton v-if="!comparedPick" :player="frontPick.element" class="absolute right-1 top-1 z-20" />
  </div>
</template>

<script setup>
import { NuxtLink } from '#components';
import { getPlayerRoute } from '~/composables/usePlayerRoute';
import { plannerPlayerName as name } from '~/utils/manager-planner';

const props = defineProps({
  pick: { type: Object, required: true }, comparedPick: { type: Object, default: null },
  matches: { type: Array, default: () => [] }, comparedMatches: { type: Array, default: () => [] },
  fixturesAvailable: { type: Boolean, default: false },
});
defineEmits(['compare']);
const frontPick = computed(() => props.comparedPick && Number(props.pick.position) > 11 ? props.comparedPick : props.pick);
const backPick = computed(() => frontPick.value.element.id === props.pick.element.id ? props.comparedPick : props.pick);
const frontMatches = computed(() => frontPick.value.element.id === props.pick.element.id ? props.matches : props.comparedMatches);
const stats = computed(() => {
  const { element, expectedPoints, expectedPointsGameweek } = frontPick.value;
  const hasEstimate = expectedPointsGameweek && expectedPoints != null && expectedPoints !== '' && Number.isFinite(Number(expectedPoints));
  return [
    { label: 'Current price', value: element.now_cost == null ? '—' : `£${(Number(element.now_cost) / 10).toFixed(1)}m` },
    { label: 'Season pts', value: element.total_points ?? '—', highlight: true },
    { label: expectedPointsGameweek ? `Expected · GW ${expectedPointsGameweek}` : 'Expected points', value: hasEstimate ? Number(expectedPoints).toFixed(1) : '—' },
  ];
});
</script>
