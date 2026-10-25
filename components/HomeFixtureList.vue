<template>
  <section aria-labelledby="fixtures-title" class="grid w-full min-w-0 gap-4">
    <header class="flex items-end border-b border-white/10 pb-4">
      <div>
        <h2 id="fixtures-title" class="text-2xl font-black tracking-tight text-white sm:text-3xl">Upcoming fixtures</h2>
      </div>
    </header>
    <USkeleton v-if="loading" class="h-64 w-full rounded-xl" />
    <div v-else-if="error" class="flex flex-wrap items-center justify-between gap-3 py-4">
      <p class="text-sm text-stone-300">Fixture data is unavailable right now.</p>
      <UButton color="neutral" variant="outline" @click="$emit('retry')">Try again</UButton>
    </div>
    <p v-else-if="!gameweeks.length" class="text-sm text-stone-300">No upcoming gameweeks are currently published.</p>
    <p v-else-if="!upcomingFixtures.length" class="text-sm text-stone-300">No fixtures are currently scheduled in the upcoming gameweeks.</p>
    <div v-else :class="CAROUSEL_CARD_COLUMNS" class="grid min-w-0 grid-flow-col gap-4 overflow-x-auto overscroll-x-contain pb-2 snap-x snap-mandatory [scrollbar-width:thin] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300"
      role="region" aria-label="Upcoming fixture matches" tabindex="0">
      <article v-for="match in upcomingFixtures" :key="match.id" class="min-w-0 snap-start overflow-hidden rounded-2xl border border-white/10 bg-[#101216]">
        <header class="flex items-center justify-between gap-3 border-b border-white/10 bg-white/[0.035] px-4 py-3">
          <h3 class="shrink-0 text-sm font-bold text-white">Gameweek {{ match.gameweek }}</h3>
          <ClientOnly>
            <time v-if="match.kickoff" :datetime="match.kickoff" class="min-w-0 text-right text-[0.62rem] font-medium tabular-nums text-stone-300">{{ formatKickoff(match.kickoff) }}</time>
            <span v-else class="text-right text-[0.62rem] text-stone-400">Kickoff TBC</span>
            <template #fallback>
              <span class="text-right text-[0.62rem] text-stone-400">{{ match.kickoff ? 'Kickoff set' : 'Kickoff TBC' }}</span>
            </template>
          </ClientOnly>
        </header>
        <div class="px-3 py-3">
          <div class="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1.5">
            <div class="flex min-w-0 items-center gap-1.5">
              <img v-if="match.homeCode" :src="crestUrl(match.homeCode)" alt="" width="28" height="28" loading="lazy" decoding="async" class="size-7 shrink-0 object-contain" />
              <span class="min-w-0 text-xs font-semibold leading-4 text-white [overflow-wrap:anywhere]" :title="match.homeTeam">{{ match.homeTeam }}</span>
            </div>
            <span class="text-[0.6rem] font-bold uppercase tracking-wider text-stone-500">v</span>
            <div class="flex min-w-0 items-center justify-end gap-1.5">
              <span class="min-w-0 text-right text-xs font-semibold leading-4 text-white [overflow-wrap:anywhere]" :title="match.awayTeam">{{ match.awayTeam }}</span>
              <img v-if="match.awayCode" :src="crestUrl(match.awayCode)" alt="" width="28" height="28" loading="lazy" decoding="async" class="size-7 shrink-0 object-contain" />
            </div>
          </div>
          <div class="mt-2 grid grid-cols-2 gap-2">
            <div v-for="side in [{ label: 'Home', value: match.homeDifficulty }, { label: 'Away', value: match.awayDifficulty }]" :key="side.label"
              class="min-w-0" :class="side.label === 'Away' ? 'text-right' : ''"
              :aria-label="side.value === null ? `${side.label} fixture difficulty unavailable` : `${side.label} fixture difficulty ${side.value} out of 5, ${difficultyLabel(side.value)}`">
              <div class="flex items-center gap-1.5" :class="side.label === 'Away' ? 'justify-end' : ''">
                <span class="text-[0.56rem] font-semibold uppercase tracking-wide text-stone-500">{{ side.label }}</span>
                <span class="text-[0.6rem] font-bold" :class="difficultyClass(side.value)">{{ side.value === null ? 'TBC' : `${side.value}/5` }}</span>
              </div>
              <div class="mt-1 flex max-w-24 gap-0.5" :class="side.label === 'Away' ? 'ml-auto' : ''" aria-hidden="true">
                <span v-for="level in 5" :key="level" class="h-1.5 flex-1 rounded-full"
                  :class="difficultySegmentClass(side.value, level)" />
              </div>
              <p class="mt-1 text-[0.56rem] leading-3" :class="difficultyClass(side.value)">{{ difficultyLabel(side.value) }}</p>
            </div>
          </div>
        </div>
      </article>
    </div>
    <p v-if="!loading && !error && gameweeks.length" class="text-xs leading-5 text-stone-400">Fixture difficulty runs from 1 (easiest) to 5 (hardest). Kickoff times use your local time.</p>
  </section>
</template>

<script setup lang="ts">
import { CAROUSEL_CARD_COLUMNS } from "~/utils/carousel-layout";
import { getUpcomingFixtureMatches, type ShortlistFixture } from "~/utils/homepage-shortlist";
const props = withDefaults(defineProps<{
  fixtures: ShortlistFixture[];
  teams: Record<string, any>[];
  gameweeks: number[];
  loading?: boolean;
  error?: boolean;
}>(), { loading: false, error: false });
defineEmits(["retry"]);
const upcomingFixtures = computed(() => getUpcomingFixtureMatches(props.gameweeks, props.fixtures, props.teams));
const crestUrl = (code: number) => `https://resources.premierleague.com/premierleague/badges/t${code}.png`;
const formatKickoff = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Kickoff TBC' : new Intl.DateTimeFormat(undefined, {
    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(date);
};
const difficultyClass = (value: number | null) => value === null
  ? 'text-stone-500'
  : value <= 2 ? 'text-lime-200' : value >= 4 ? 'text-rose-200' : 'text-amber-100';
const difficultyLabel = (value: number | null) => value === null ? 'Difficulty TBC'
  : value <= 2 ? 'Easier' : value >= 4 ? 'Harder' : 'Medium';
const difficultySegmentClass = (value: number | null, level: number) => value === null || level > value
  ? 'bg-white/10'
  : value <= 2 ? 'bg-lime-300' : value >= 4 ? 'bg-rose-300' : 'bg-amber-200';
</script>
