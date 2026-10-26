<template>
  <div v-if="!comparedPick" class="flex h-full min-w-0 flex-col">
    <PlayerCardPick :pick="pick" :compact="compact" :detailed="detailed" :events="events" :teams="teams" class="flex-1">
      <template v-if="compact" #nameplate>
        <ManagerPlayerNameplate :player="pick.element" compact>
          <template v-if="fixturesAvailable" #fixtures><ManagerPlayerFixture :matches="matches" compact available integrated /></template>
        </ManagerPlayerNameplate>
      </template>
    </PlayerCardPick>
    <ManagerPlayerFixture v-if="!compact" :matches="matches" :available="fixturesAvailable" />
  </div>
  <button v-else type="button" class="group relative flex h-full w-full min-w-0 flex-col text-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300"
    :class="compact ? '' : 'overflow-hidden rounded-xl border border-lime-300/30 bg-[#101216]'"
    :aria-label="`Compare ${name(frontPick.element)} with ${name(backPick.element)}`" @click="$emit('compare', pick)">
    <span class="relative block w-full shrink-0" :class="compact ? 'h-18 sm:h-24' : 'aspect-[4/4.6] p-2'">
      <span class="absolute bottom-0 left-0 z-0 h-[88%] w-[70%] opacity-75"><PlayerPortrait :player="backPick.element" :alt="name(backPick.element)" /></span>
      <span class="absolute bottom-0 right-0 z-10 h-full w-[75%]"><PlayerPortrait :player="frontPick.element" :alt="name(frontPick.element)" /></span>
      <span v-if="frontPick.is_captain || frontPick.is_vice_captain" class="absolute right-0 top-1 grid size-5 place-items-center rounded-full text-[0.6rem] font-black sm:size-6" :class="frontPick.is_captain ? 'bg-lime-300 text-lime-950' : 'bg-amber-200 text-stone-950'" :aria-label="frontPick.is_captain ? 'Captain' : 'Vice-captain'">{{ frontPick.is_captain ? 'C' : 'V' }}</span>
    </span>
    <div class="relative z-0 rounded-t-md bg-black/45 px-1 pb-3 pt-1 text-stone-400" :class="compact ? 'w-full text-[0.5rem] leading-3 sm:text-[0.65rem] sm:leading-4' : 'mx-3 w-[calc(100%-1.5rem)] text-left text-[0.65rem] leading-4'">
      <p class="font-medium [overflow-wrap:anywhere]">{{ name(backPick.element) }}</p>
    </div>
    <ManagerPlayerNameplate class="-mt-2" :class="compact ? 'w-full' : 'mx-2 mb-2 w-[calc(100%-1rem)]'" :player="frontPick.element" :compact="compact" suggested>
      <template v-if="fixturesAvailable" #fixtures><ManagerPlayerFixture :matches="frontMatches" :compact="compact" available integrated /></template>
    </ManagerPlayerNameplate>
  </button>
</template>

<script setup>
import { plannerPlayerName as name } from '~/utils/manager-planner';
import ManagerPlayerNameplate from '~/components/ManagerPlayerNameplate.vue';
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
</script>
