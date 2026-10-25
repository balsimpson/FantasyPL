<template>
  <section aria-labelledby="player-discovery-title" class="grid min-w-0 gap-5">
    <div class="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
      <h2 id="player-discovery-title" class="text-2xl font-bold tracking-tight text-white sm:text-3xl">Find a player</h2>
      <p v-if="!loading && !error" class="text-sm text-stone-400" role="status" aria-live="polite">
        <span class="font-semibold text-stone-200">{{ rankedPlayers.length.toLocaleString('en-GB') }}</span>
        {{ rankedPlayers.length === 1 ? 'player match' : 'player matches' }}
        <span class="text-stone-600">·</span>
        Showing {{ visiblePlayers.length.toLocaleString('en-GB') }}
      </p>
    </div>
    <div class="sticky top-14 z-20 -mx-4 grid min-w-0 gap-3 border-b border-white/10 bg-[#050608] px-4 py-3 sm:-mx-6 sm:px-6 sm:py-4 lg:-mx-8 lg:px-8">
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
    </div>
    <div v-if="loading" class="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-live="polite">
      <USkeleton v-for="index in 6" :key="index" class="h-[34rem] rounded-2xl" />
    </div>
    <div v-else-if="error" class="flex flex-wrap items-center justify-between gap-3 py-4">
      <p class="text-sm text-stone-300">Player data could not be loaded.</p>
      <UButton color="neutral" variant="outline" @click="$emit('retry')">Try again</UButton>
    </div>
    <template v-else>
      <p v-if="!visiblePlayers.length" class="border-t border-white/10 py-8 text-center text-sm text-stone-300">No players match. Try another search, position, or price cap.</p>
      <ul v-else class="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Player search results">
        <li v-for="player in visiblePlayers" :key="player.id" class="min-w-0">
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
      <div v-if="visiblePlayers.length && canLoadMore" ref="loadMoreTarget" class="flex justify-center border-t border-white/10 pt-4">
        <UButton color="neutral" variant="ghost" icon="i-lucide-plus" class="min-h-10 justify-center rounded-lg border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-stone-300 ring-0 transition-colors hover:border-lime-300/30 hover:bg-lime-300/10 hover:text-lime-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300 motion-reduce:transition-none" @click="loadMorePlayers">Load more players</UButton>
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
const canLoadMore = computed(() => visibleCount.value < rankedPlayers.value.length);
const loadMorePlayers = () => {
  visibleCount.value = Math.min(visibleCount.value + 12, rankedPlayers.value.length);
};
const loadMoreTarget = ref<HTMLElement | null>(null);
usePlayerSearchAutoLoad(loadMoreTarget, canLoadMore, loadMorePlayers);
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
