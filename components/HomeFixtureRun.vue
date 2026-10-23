<template>
  <div>
    <div class="grid min-w-0 grid-flow-col auto-cols-full gap-0 overflow-x-auto overscroll-x-contain pb-1 snap-x snap-mandatory [scrollbar-width:thin] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300"
      role="region" aria-label="Upcoming fixtures by gameweek" tabindex="0">
      <article v-for="week in run" :key="week.gameweek" class="min-w-0 snap-start px-1 first:pl-0 last:pr-0">
        <header class="mb-2 flex items-center justify-between gap-2">
          <h4 class="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-stone-300">GW {{ week.gameweek }}</h4>
          <span v-if="week.matches.length > 1" class="text-[0.58rem] text-stone-500">{{ week.matches.length }} fixtures</span>
        </header>

        <div v-if="week.matches.length" class="grid gap-2">
          <div v-for="match in week.matches" :key="match.id" class="grid min-w-0 gap-1.5">
            <div class="flex min-w-0 items-center gap-2">
              <img v-if="match.opponentCode" :src="`https://resources.premierleague.com/premierleague/badges/t${match.opponentCode}.png`"
                alt="" width="24" height="24" loading="lazy" decoding="async" class="size-6 shrink-0 object-contain" />
              <div class="min-w-0">
                <p class="text-[0.52rem] font-semibold uppercase tracking-[0.12em] text-stone-500">{{ match.venue === 'H' ? 'Home' : 'Away' }}</p>
                <p class="whitespace-nowrap text-xs font-semibold leading-4 text-white" :title="match.opponent">{{ match.opponent }}</p>
              </div>
            </div>
            <div class="grid min-w-0 gap-1">
              <ClientOnly>
                <div class="grid min-w-0">
                  <time v-if="match.kickoff" :datetime="match.kickoff" class="text-[0.6rem] tabular-nums text-stone-400">{{ formatKickoff(match.kickoff) }}</time>
                  <span v-else class="text-[0.6rem] text-stone-500">Kickoff TBC</span>
                </div>
                <template #fallback>
                  <div class="grid min-w-0">
                    <span class="text-[0.6rem] text-stone-500">{{ match.kickoff ? 'Kickoff set' : 'Kickoff TBC' }}</span>
                  </div>
                </template>
              </ClientOnly>
              <div class="flex min-w-0 items-center gap-1.5" :aria-label="match.difficulty === null ? 'Fixture difficulty unavailable' : `Fixture difficulty ${match.difficulty} out of 5, ${difficultyLabel(match.difficulty)}`">
                <div class="flex min-w-0 items-center gap-1.5">
                  <div class="flex w-12 gap-0.5" aria-hidden="true">
                    <span v-for="level in 5" :key="level" class="h-1.5 flex-1 rounded-full" :class="difficultySegmentClass(match.difficulty, level)" />
                  </div>
                  <span class="text-[0.58rem] font-semibold tabular-nums" :class="difficultyClass(match.difficulty)">{{ match.difficulty === null ? '—' : `${match.difficulty}/5` }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <p v-else class="text-[0.62rem] text-stone-500">No scheduled fixture</p>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { getTeamFixtureRun } from "~/utils/homepage-shortlist";
defineProps<{ run: ReturnType<typeof getTeamFixtureRun> }>();
const formatKickoff = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Kickoff TBC' : new Intl.DateTimeFormat(undefined, {
    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(date);
};
const difficultyLabel = (value: number) => value <= 2 ? 'Easier' : value >= 4 ? 'Harder' : 'Medium';
const difficultyClass = (value: number | null) => value === null
  ? 'text-stone-500'
  : value <= 2 ? 'text-lime-200'
    : value >= 4 ? 'text-rose-200'
      : 'text-amber-100';
const difficultySegmentClass = (value: number | null, level: number) => value === null || level > value
  ? 'bg-white/10'
  : value <= 2 ? 'bg-lime-300' : value >= 4 ? 'bg-rose-300' : 'bg-amber-200';
</script>
