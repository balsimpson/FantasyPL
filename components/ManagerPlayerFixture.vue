<template>
  <div v-if="available" class="space-y-0.5 text-center" :class="compact ? 'px-0.5 py-1 text-[0.55rem] leading-3 sm:text-[0.65rem] sm:leading-4' : 'px-2 py-2 text-xs leading-5'">
    <p v-if="!matches.length" class="text-stone-300">No scheduled match</p>
    <p v-for="match in matches" :key="match.id" class="flex flex-wrap items-center justify-center gap-x-1 rounded px-0.5 py-0.5" :class="tone(match.difficulty)" :title="`${match.opponent}, ${match.venue}. Difficulty ${match.difficulty ?? 'unavailable'} out of 5.`">
      <span class="font-semibold">{{ match.shortName }}</span><span>{{ match.venue }}</span><span class="font-bold tabular-nums">{{ match.difficulty === null ? 'Unrated' : `${match.difficulty}/5` }}</span>
    </p>
  </div>
</template>

<script setup>
defineProps({ matches: { type: Array, default: () => [] }, compact: { type: Boolean, default: false }, available: { type: Boolean, default: false } });
const tone = (difficulty) => difficulty === null ? 'bg-white/5 text-stone-300' : difficulty <= 2 ? 'bg-lime-300/15 text-lime-200' : difficulty === 3 ? 'bg-amber-200/15 text-amber-100' : 'bg-rose-300/15 text-rose-200';
</script>
