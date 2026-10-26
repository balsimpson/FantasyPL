<template>
  <div v-if="!comparedPick" class="flex h-full min-w-0 flex-col">
    <PlayerCardPick :pick="pick" :compact="compact" :detailed="detailed" :events="events" :teams="teams" class="flex-1" />
    <ManagerPlayerFixture :matches="matches" :compact="compact" :available="fixturesAvailable" />
  </div>
  <button v-else type="button" class="group relative flex h-full w-full min-w-0 flex-col text-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300"
    :class="compact ? '' : 'overflow-hidden rounded-xl border border-lime-300/30 bg-[#101216]'"
    :aria-label="`Compare ${name(frontPick.element)} with ${name(backPick.element)}`" @click="$emit('compare', pick)">
    <span class="relative block w-full shrink-0" :class="compact ? 'h-18 sm:h-24' : 'aspect-[4/4.6] p-2'">
      <span class="absolute bottom-0 left-0 z-0 h-[88%] w-[70%] opacity-75"><PlayerPortrait :player="backPick.element" :alt="name(backPick.element)" /></span>
      <span class="absolute bottom-0 right-0 z-10 h-full w-[75%]"><PlayerPortrait :player="frontPick.element" :alt="name(frontPick.element)" /></span>
      <span v-if="frontPick.is_captain || frontPick.is_vice_captain" class="absolute right-0 top-1 grid size-5 place-items-center rounded-full text-[0.6rem] font-black sm:size-6" :class="frontPick.is_captain ? 'bg-lime-300 text-lime-950' : 'bg-amber-200 text-stone-950'" :aria-label="frontPick.is_captain ? 'Captain' : 'Vice-captain'">{{ frontPick.is_captain ? 'C' : 'V' }}</span>
    </span>
    <span class="relative z-0 block rounded-t-md bg-stone-800 pb-3 pt-1 text-stone-300" :class="compact ? 'w-full px-1 text-[0.5rem] leading-3 sm:text-[0.65rem] sm:leading-4' : 'mx-2 w-[calc(100%-1rem)] px-2 text-left text-[0.65rem] leading-4'">
      <span class="block font-medium [overflow-wrap:anywhere]">{{ name(backPick.element) }}</span>
      <span v-if="fixturesAvailable" class="block opacity-80">{{ backMatches.length ? backMatches.map((match) => `${match.shortName} ${match.venue === 'Home' ? 'H' : 'A'} · ${match.difficulty ?? '—'}/5`).join(' / ') : 'No scheduled match' }}</span>
    </span>
    <span class="relative z-10 -mt-2 block rounded-md bg-[#123425] ring-1 ring-lime-300/50" :class="compact ? 'w-full px-0.5 py-1 text-[0.6rem] leading-tight sm:px-1 sm:text-xs' : 'mx-2 w-[calc(100%-1rem)] px-2 py-2 text-left leading-6'">
      <span v-if="!compact" class="mb-0.5 block text-[0.6rem] font-semibold leading-3 text-lime-300">Suggested XI</span>
      <span class="block font-bold text-white group-hover:text-lime-200 [overflow-wrap:anywhere]" :class="compact ? '' : 'text-base'">{{ name(frontPick.element) }}</span>
      <span class="mt-1 text-emerald-100" :class="compact ? 'inline-flex flex-wrap items-center justify-center gap-x-1' : 'grid w-full grid-cols-[1fr_auto_auto] items-center gap-2 text-xs leading-4 tabular-nums'"><span>{{ frontPick.element.now_cost == null ? '—' : `£${(Number(frontPick.element.now_cost) / 10).toFixed(1)}m` }}</span><span v-if="compact" aria-hidden="true">·</span><span>{{ frontPick.element.total_points ?? '—' }} pts</span><UIcon name="i-lucide-arrow-left-right" class="size-3 text-lime-300" aria-hidden="true" /></span>
    </span>
    <ManagerPlayerFixture class="mt-auto w-full" :class="compact ? '' : 'pb-3 pt-3'" :matches="frontMatches" :compact="compact" :available="fixturesAvailable" />
  </button>
</template>

<script setup>
import { plannerPlayerName as name } from '~/utils/manager-planner';
const props = defineProps({
  pick: { type: Object, required: true }, comparedPick: { type: Object, default: null },
  matches: { type: Array, default: () => [] }, comparedMatches: { type: Array, default: () => [] },
  fixturesAvailable: { type: Boolean, default: false }, compact: { type: Boolean, default: false },
  detailed: { type: Boolean, default: false }, events: { type: Array, default: () => [] }, teams: { type: Array, default: () => [] },
});
defineEmits(['compare']);
const frontPick = computed(() => props.comparedPick && Number(props.pick.position) > 11 ? props.comparedPick : props.pick);
const backPick = computed(() => frontPick.value.element.id === props.pick.element.id ? props.comparedPick : props.pick);
const frontMatches = computed(() => frontPick.value.element.id === props.pick.element.id ? props.matches : props.comparedMatches);
const backMatches = computed(() => frontPick.value.element.id === props.pick.element.id ? props.comparedMatches : props.matches);
</script>
