<template>
  <section v-show="expanded" id="manager-upcoming-fixtures" class="w-full min-w-0 overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]" :aria-label="`GW ${gameweek} fixtures`">
    <div>
      <div role="region" :aria-label="`GW ${gameweek} player fixtures`" tabindex="0" class="max-h-96 overflow-y-auto px-3 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-lime-300">
        <ul class="divide-y divide-white/10">
          <li v-for="row in fixtures" :key="row.pick.element.id" class="grid min-w-0 grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] items-center gap-3 py-2">
            <div class="min-w-0">
              <NuxtLink :to="getPlayerRoute(row.pick.element)" class="text-xs font-semibold leading-5 text-white hover:text-lime-300 focus-visible:outline-2 focus-visible:outline-lime-300 [overflow-wrap:anywhere]">{{ plannerPlayerName(row.pick.element) }}</NuxtLink>
              <p class="text-[0.6rem] leading-4 text-stone-400">{{ row.starter ? 'Published XI' : 'Bench' }}<span v-if="row.tough" class="ml-1 font-semibold text-rose-300">· Tough</span></p>
            </div>
            <ul v-if="row.matches.length" class="min-w-0 space-y-1">
              <li v-for="match in row.matches" :key="match.id" class="@container min-w-0 space-y-1.5" :title="`${match.opponent} · ${match.venue}`">
                <div class="flex min-w-0 flex-wrap items-center gap-1.5">
                  <img v-if="match.opponentCode" :src="`https://resources.premierleague.com/premierleague/badges/t${match.opponentCode}.png`" alt="" width="20" height="20" loading="lazy" decoding="async" class="size-5 shrink-0 object-contain" />
                  <span class="min-w-0 text-xs font-semibold leading-4 text-white [overflow-wrap:anywhere]" :aria-label="match.opponent"><span class="@[12rem]:hidden">{{ match.shortName }}</span><span class="hidden @[12rem]:inline">{{ match.opponent }}</span></span>
                  <span class="text-[0.6rem] leading-4 text-stone-400">{{ match.venue }}</span>
                </div>
                <div class="flex gap-0.5" role="img" :aria-label="match.difficulty === null ? 'Fixture difficulty unavailable' : `Fixture difficulty ${match.difficulty} out of 5`"><span v-for="level in 5" :key="level" class="h-1.5 flex-1 rounded-full" :class="difficultySegmentClass(match.difficulty, level)" aria-hidden="true" /></div>
              </li>
            </ul>
            <p v-else class="text-xs leading-5 text-stone-400">No scheduled match</p>
          </li>
        </ul>
      </div>
      <div v-if="$slots.default" class="border-t border-white/10 px-2 py-2"><slot /></div>
    </div>
  </section>
</template>

<script setup>
import { getPlayerRoute } from '~/composables/usePlayerRoute';
import { plannerPlayerName } from '~/utils/manager-planner';
const props = defineProps({
  gameweek: { type: Number, required: true }, rows: { type: Array, default: () => [] }, expanded: { type: Boolean, default: false },
});
const fixtures = computed(() => props.rows.map((row) => {
  const matches = row.run.find((week) => week.gameweek === props.gameweek)?.matches ?? [];
  const starter = Number(row.pick.position) <= 11;
  const tough = starter && matches.length > 0 && matches.every((match) => match.difficulty !== null && match.difficulty >= 4);
  return { pick: row.pick, matches, starter, tough };
}).sort((a, b) => Number(b.tough) - Number(a.tough) || Number(b.starter) - Number(a.starter) || Number(a.pick.position) - Number(b.pick.position)));
const difficultySegmentClass = (difficulty, level) => difficulty === null || level > difficulty ? 'bg-white/10' : difficulty <= 2 ? 'bg-lime-300' : difficulty >= 4 ? 'bg-rose-300' : 'bg-amber-200';
</script>
