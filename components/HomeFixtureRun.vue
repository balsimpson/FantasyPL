<template>
  <div>
    <div class="grid min-w-0 grid-cols-3 gap-2" role="group" aria-label="Upcoming fixtures by gameweek">
      <article v-for="week in run" :key="week.gameweek" class="@container flex min-w-0 flex-col">
        <header class="mb-2 flex flex-wrap items-center justify-between gap-1">
          <h4 class="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-stone-300">GW {{ week.gameweek }}</h4>
          <span v-if="week.matches.length > 1" class="text-[0.58rem] text-stone-500">{{ week.matches.length }} fixtures</span>
        </header>

        <div v-if="week.matches.length" class="grid flex-1 gap-2">
          <div v-for="match in week.matches" :key="match.id" class="flex min-w-0 flex-col gap-1.5">
            <div class="flex min-w-0 items-center gap-1.5">
              <img v-if="match.opponentCode" :src="`https://resources.premierleague.com/premierleague/badges/t${match.opponentCode}.png`"
                alt="" width="20" height="20" loading="lazy" decoding="async" class="size-5 shrink-0 object-contain" />
              <div class="min-w-0">
                <p class="text-[0.52rem] font-semibold uppercase tracking-[0.12em] text-stone-500">{{ match.venue === 'H' ? 'Home' : 'Away' }}</p>
                <p class="text-xs font-semibold leading-4 text-white [overflow-wrap:anywhere]" :title="match.opponent" :aria-label="match.opponent">
                  <span class="@[7.5rem]:hidden">{{ match.opponentShortName || match.opponent }}</span>
                  <span class="hidden @[7.5rem]:inline">{{ match.opponent }}</span>
                </p>
              </div>
            </div>
            <div class="mt-auto grid min-w-0 gap-1">
              <ClientOnly>
                <div class="grid min-w-0">
                  <time v-if="match.kickoff" :datetime="match.kickoff" class="min-h-8 text-[0.6rem] leading-4 tabular-nums text-stone-400">{{ formatKickoff(match.kickoff) }}</time>
                  <span v-else class="min-h-8 text-[0.6rem] leading-4 text-stone-500">Kickoff TBC</span>
                </div>
                <template #fallback>
                  <div class="grid min-w-0">
                    <span class="min-h-8 text-[0.6rem] leading-4 text-stone-500">{{ match.kickoff ? 'Kickoff set' : 'Kickoff TBC' }}</span>
                  </div>
                </template>
              </ClientOnly>
              <div class="flex min-w-0 items-center gap-1.5" :aria-label="match.difficulty === null ? 'Fixture difficulty unavailable' : `Fixture difficulty ${match.difficulty} out of 5, ${difficultyLabel(match.difficulty)}`">
                <div class="flex min-w-0 w-full items-center gap-1">
                  <div class="flex min-w-0 flex-1 gap-0.5" aria-hidden="true">
                    <span v-for="level in 5" :key="level" class="h-1.5 flex-1 rounded-full" :class="difficultySegmentClass(match.difficulty, level)" />
                  </div>
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
const difficultySegmentClass = (value: number | null, level: number) => value === null || level > value
  ? 'bg-white/10'
  : value <= 2 ? 'bg-lime-300' : value >= 4 ? 'bg-rose-300' : 'bg-amber-200';
</script>
