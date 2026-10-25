<template>
  <section aria-labelledby="player-discovery-title" class="grid min-w-0 gap-3">
    <div class="grid min-w-0 gap-3">
      <h2 id="player-discovery-title" class="text-lg font-bold tracking-tight text-white">{{ sectionTitle }}</h2>
      <HomePlayerSearch v-model="query" />
      <div class="grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-3">
        <UFormField label="Position" :ui="fieldUi">
          <USelect v-model="position" :items="SHORTLIST_POSITIONS" variant="none" class="w-full" :ui="selectUi" />
        </UFormField>
        <UFormField label="Max price" :ui="fieldUi">
          <USelect v-model="maxPrice" :items="SHORTLIST_PRICE_LIMITS" variant="none" class="w-full" :ui="selectUi" />
        </UFormField>
        <UFormField label="Rank by" class="col-span-2 min-w-0 sm:col-span-1" :ui="fieldUi">
          <USelect v-model="sortKey" :items="SHORTLIST_SORTS" variant="none" class="w-full" :ui="selectUi" />
        </UFormField>
      </div>
      <p v-if="!loading && !error" class="text-sm text-stone-400" role="status">
        <span class="font-semibold text-stone-200">{{ rankedPlayers.length }}</span> {{ rankedPlayers.length === 1 ? 'player matches' : 'players match' }} {{ query.trim() ? 'your search and filters' : 'your filters' }}
      </p>
    </div>
    <div v-if="loading" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-live="polite">
      <USkeleton v-for="index in 3" :key="index" class="h-96 rounded-2xl" />
    </div>
    <div v-else-if="error" class="flex flex-wrap items-center justify-between gap-3 py-4">
      <p class="text-sm text-stone-300">Player data could not be loaded.</p>
      <UButton color="neutral" variant="outline" @click="$emit('retry')">Try again</UButton>
    </div>
    <template v-else>
      <p v-if="!visiblePlayers.length" class="py-5 text-sm text-stone-300">No players match. Try another search, position, or price cap.</p>
      <ul v-else ref="playerRail" class="grid min-w-0 grid-flow-col auto-cols-[92%] gap-4 overflow-x-auto overscroll-x-contain pb-3 snap-x snap-mandatory focus-visible:outline-2 focus-visible:outline-primary sm:auto-cols-[calc((100%_-_1rem)/2)] lg:auto-cols-[calc((100%_-_2rem)/3)] 2xl:auto-cols-[calc((100%_-_3rem)/4)]" aria-label="Player cards" tabindex="0" @scroll.passive="onScroll" @keydown.left.self.prevent="scrollPlayers(-1)" @keydown.right.self.prevent="scrollPlayers(1)">
        <li v-for="player in visiblePlayers" :key="player.id" class="min-w-0 snap-start">
          <HomeShortlistPlayerCard
            :player="player"
            :teams="teams"
            :fixtures="fixtures"
            :gameweeks="gameweeks"
            :fixtures-available="fixturesAvailable"
            :fixtures-loading="fixturesLoading"
            :sort-key="sortKey"
          />
        </li>
      </ul>
      <div v-if="visiblePlayers.length" class="flex justify-end">
        <div class="flex items-center gap-2">
          <UButton icon="i-lucide-chevron-left" aria-label="Previous players" :disabled="!canScrollBack" color="neutral" variant="outline" @click="scrollPlayers(-1)" />
          <UButton icon="i-lucide-chevron-right" aria-label="Next players" :disabled="!canScrollForward" color="neutral" variant="outline" @click="scrollPlayers(1)" />
        </div>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { SHORTLIST_POSITIONS, SHORTLIST_PRICE_LIMITS, SHORTLIST_SORTS, type ShortlistPlayer, type ShortlistFixture } from "~/utils/homepage-shortlist";
const props = withDefaults(defineProps<{
  players: ShortlistPlayer[];
  teams: Record<string, any>[];
  fixtures: ShortlistFixture[];
  gameweeks: number[];
  fixturesAvailable: boolean;
  fixturesLoading?: boolean;
  loading?: boolean;
  error?: boolean;
}>(), { loading: false, error: false, fixturesLoading: false });
defineEmits(["retry"]);
const { query, position, maxPrice, sortKey, visibleCount, rankedPlayers, visiblePlayers } = useHomepageShortlist(() => props.players, () => props.teams);
const sectionTitle = computed(() => ({
  total_points: "Season points",
  selected_by_percent: "Most selected",
  transfers_in_event: "Most bought this gameweek",
  transfers_out_event: "Most sold this gameweek",
} as Record<string, string>)[sortKey.value] || "Players");
const playerRail = ref<HTMLElement | null>(null);
const { canScrollBack, canScrollForward, onScroll, scrollPlayers } = useHomepagePlayerRail(
  playerRail, visibleCount, () => rankedPlayers.value.length, [query, position, maxPrice, sortKey],
);
const fieldUi = { root: "min-w-0 w-full", label: "text-xs font-semibold text-stone-300" };
const selectUi = {
  base: "h-10 w-full rounded-lg border border-[#303640] bg-[#0c0f13] text-sm font-semibold text-stone-100 ring-0 hover:border-[#48515f] hover:bg-[#1b2028] hover:text-stone-100 data-[state=open]:bg-[#1b2028] focus-visible:border-lime-300/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-300/50 [color-scheme:dark]",
  content: "bg-[#101216] text-stone-100 ring-[#303640]",
  item: "text-stone-200 data-highlighted:not-data-disabled:text-white data-highlighted:not-data-disabled:before:bg-[#242b35]",
  trailingIcon: "text-stone-400",
  itemTrailingIcon: "text-lime-300",
  viewport: "divide-y-0",
};
</script>
