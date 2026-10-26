<template>
  <div class="relative z-20 min-w-0 overflow-hidden rounded-lg text-white ring-1" :class="[suggested ? 'bg-[#102b20] ring-lime-300/45' : 'bg-[#0b2119]/95 ring-white/10', aligned ? 'row-span-3 grid grid-rows-subgrid' : '@container']">
    <div :class="aligned ? 'contents' : compact ? 'px-1.5 py-1.5' : 'px-3 py-2.5 text-left'">
      <div v-if="suggested && !compact" class="mb-1 flex items-center justify-between gap-2 text-[0.6rem] font-semibold leading-3 text-lime-300"><span>Suggested XI</span><UIcon name="i-lucide-arrow-left-right" class="size-3" aria-hidden="true" /></div>
      <p data-player-detail="name" class="font-bold text-white group-hover:text-lime-200 [overflow-wrap:anywhere]" :class="[compact ? 'text-[0.65rem] leading-tight sm:text-xs' : 'text-base leading-5', aligned ? 'flex items-center justify-center px-1.5 pt-1.5 pb-1' : '']">{{ playerName }}</p>
      <div data-player-detail="stats" class="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 tabular-nums" :class="[compact ? 'justify-center text-[0.6rem] leading-4 @[7rem]:justify-between sm:text-xs' : 'justify-between text-xs leading-4', aligned ? 'px-1.5 pb-1.5 sm:justify-between' : 'mt-1.5']">
        <span class="whitespace-nowrap font-medium text-stone-300"><span class="sr-only">Current price </span>{{ price }}</span>
        <span class="whitespace-nowrap font-semibold text-lime-300">{{ player.total_points ?? '—' }}<span class="ml-1 font-normal text-emerald-100/75">pts<span class="sr-only"> this season</span></span></span>
      </div>
    </div>
    <div v-if="$slots.fixtures" data-player-detail="fixtures" class="border-t border-white/10"><slot name="fixtures" /></div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { plannerPlayerName } from '~/utils/manager-planner';
const props = defineProps({ player: { type: Object, required: true }, compact: { type: Boolean, default: false }, suggested: { type: Boolean, default: false }, aligned: { type: Boolean, default: false } });
const playerName = computed(() => plannerPlayerName(props.player));
const price = computed(() => props.player.now_cost == null || !Number.isFinite(Number(props.player.now_cost)) ? '—' : `£${(Number(props.player.now_cost) / 10).toFixed(1)}m`);
</script>
