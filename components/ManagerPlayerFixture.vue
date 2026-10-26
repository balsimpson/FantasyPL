<template>
  <div v-if="available" class="space-y-0.5 text-center" :class="compact ? 'px-1 py-1.5 text-[0.55rem] leading-3 sm:text-[0.65rem] sm:leading-4' : 'px-2 py-2 text-xs leading-5'">
    <p v-if="!matches.length" class="text-stone-300">No scheduled match</p>
    <p v-for="match in matches" :key="match.id" class="grid items-center justify-center gap-x-1 rounded px-0.5 py-0.5 text-left" :class="[tone(match.difficulty), match.opponentCode ? 'grid-cols-[auto_minmax(0,max-content)]' : 'grid-cols-[minmax(0,max-content)]']" :title="`${match.opponent}, ${match.venue}. Difficulty ${match.difficulty ?? 'unavailable'} out of 5.`">
      <img v-if="match.opponentCode" :src="`https://resources.premierleague.com/premierleague/badges/t${match.opponentCode}.png`" alt="" width="24" height="32" loading="lazy" decoding="async" class="row-span-2 shrink-0 object-contain" :class="compact ? 'h-6 w-4 sm:h-8 sm:w-6' : 'h-10 w-8'" />
      <span class="flex min-w-0 flex-wrap items-center gap-x-1"><span class="font-semibold">{{ match.shortName }}</span><span>{{ match.venue }}</span></span>
      <span class="min-w-0 font-semibold [overflow-wrap:anywhere]">{{ getManagerDifficultyLabel(match.difficulty) }}</span>
    </p>
  </div>
</template>

<script setup>
import { getManagerDifficultyLabel } from '~/utils/manager-planner';
const props = defineProps({ matches: { type: Array, default: () => [] }, compact: { type: Boolean, default: false }, available: { type: Boolean, default: false }, integrated: { type: Boolean, default: false } });
const tone = (difficulty) => difficulty === null ? `${props.integrated ? '' : 'bg-white/5'} text-stone-300` : difficulty <= 2 ? `${props.integrated ? '' : 'bg-lime-300/15'} text-lime-200` : difficulty === 3 ? `${props.integrated ? '' : 'bg-amber-200/15'} text-amber-100` : `${props.integrated ? '' : 'bg-rose-300/15'} text-rose-200`;
</script>
