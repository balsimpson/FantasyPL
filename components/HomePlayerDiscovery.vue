<template>
  <section aria-labelledby="player-discovery-title" class="grid min-w-0 gap-4">
    <header class="border-b border-white/10 pb-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h2 id="player-discovery-title" class="text-3xl font-black tracking-tight text-white sm:text-4xl">Find your next transfer</h2>
      </div>
      <p class="mt-2 text-sm leading-6 text-stone-300">Find players for the next three gameweeks.</p>
      <div class="mt-4 flex flex-wrap items-start justify-between gap-3">
        <details class="min-w-0 flex-1">
          <summary class="w-fit cursor-pointer rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-stone-200 hover:border-lime-300/40 focus-visible:outline-2 focus-visible:outline-lime-300">Filter players</summary>
          <div class="mt-4 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <UFormField label="Position" :ui="fieldUi">
              <USelect v-model="position" :items="SHORTLIST_POSITIONS" class="w-full" :ui="selectUi" />
            </UFormField>
            <UFormField label="Max price (£m)" :error="priceError || undefined" help="Leave blank for any price." :ui="fieldUi">
              <UInput v-model="price" type="number" min="3" max="20" step="0.1" inputmode="decimal" class="w-full" :ui="{ root: 'w-full', base: 'w-full h-10' }" />
            </UFormField>
            <UFormField label="Rank by" :ui="fieldUi">
              <USelect v-model="sortKey" :items="SHORTLIST_SORTS" class="w-full" :ui="selectUi" />
            </UFormField>
          </div>
        </details>
      </div>
      <p v-if="!loading && !error && fetchedAt" class="mt-3 text-xs leading-5 text-stone-400">
        Source: FPL · Data fetched <time :datetime="fetchedAt">{{ fetchedLabel }}</time> UTC
      </p>
    </header>
    <div v-if="loading" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-live="polite">
      <USkeleton v-for="index in 3" :key="index" class="h-96 rounded-2xl" />
    </div>
    <div v-else-if="error" class="flex flex-wrap items-center justify-between gap-3 py-4">
      <p class="text-sm text-stone-300">Player data could not be loaded.</p>
      <UButton color="neutral" variant="outline" @click="$emit('retry')">Try again</UButton>
    </div>
    <template v-else>
      <p class="text-sm text-stone-300" aria-live="polite" aria-atomic="true">{{ filteredPlayers.length }} players · {{ activeSortLabel }}{{ filterLabel }}</p>
      <p v-if="!visiblePlayers.length" class="py-5 text-sm text-stone-300">{{ priceError || 'No players match these filters. Raise your budget or change position.' }}</p>
      <ul v-else ref="playerRail" class="grid min-w-0 grid-flow-col auto-cols-[100%] gap-4 overflow-x-auto pb-3 snap-x snap-mandatory sm:auto-cols-[calc((100%_-_1rem)/2)] lg:auto-cols-[calc((100%_-_2rem)/3)] 2xl:auto-cols-[calc((100%_-_3rem)/4)]" aria-label="Transfer shortlist" tabindex="0">
        <li v-for="player in visiblePlayers" :key="player.id" class="min-w-0 snap-start">
          <HomeShortlistPlayerCard :player="player" :teams="teams" :fixtures="fixtures" :gameweeks="gameweeks" :fixtures-available="fixturesAvailable" :sort-key="sortKey" />
        </li>
      </ul>
      <div v-if="visiblePlayers.length" class="flex flex-wrap items-center justify-between gap-3">
        <p class="text-xs text-stone-400">{{ visiblePlayers.length }} of {{ rankedPlayers.length }} shown</p>
        <div class="flex items-center gap-2">
          <UButton icon="i-lucide-chevron-left" aria-label="Previous players" color="neutral" variant="outline" @click="scrollPlayers(-1)" />
          <UButton icon="i-lucide-chevron-right" aria-label="Next players" color="neutral" variant="outline" @click="scrollPlayers(1)" />
          <UButton v-if="visibleCount < rankedPlayers.length" color="neutral" variant="ghost" @click="visibleCount += 6">Show more</UButton>
        </div>
      </div>
      <p v-if="fixturesAvailable && gameweeks.length" class="text-xs leading-5 text-stone-400">H = home · A = away · FDR: 1 easiest, 5 hardest. No scheduled match means none is assigned to that gameweek.</p>
    </template>
  </section>
</template>

<script setup lang="ts">
import { SHORTLIST_POSITIONS, SHORTLIST_SORTS, type ShortlistPlayer, type ShortlistFixture } from "~/utils/homepage-shortlist";
const props = withDefaults(defineProps<{
  players: ShortlistPlayer[];
  teams: Record<string, any>[];
  fixtures: ShortlistFixture[];
  gameweeks: number[];
  fixturesAvailable: boolean;
  fetchedAt?: string | null;
  loading?: boolean;
  error?: boolean;
}>(), { fetchedAt: null, loading: false, error: false });
defineEmits(["retry"]);
const { position, price, priceError, sortKey, visibleCount, filteredPlayers, rankedPlayers, visiblePlayers } = useHomepageShortlist(() => props.players);
const playerRail = ref<HTMLElement | null>(null);
const fieldUi = { root: "w-full", label: "text-sm font-semibold text-stone-200", help: "text-xs text-stone-400" };
const selectUi = { base: "w-full h-10" };
const activeSortLabel = computed(() => SHORTLIST_SORTS.find((item) => item.value === sortKey.value)?.label);
const filterLabel = computed(() => [position.value ? SHORTLIST_POSITIONS.find((item) => item.value === position.value)?.label : null,
  price.value && !priceError.value ? `Up to £${Number(price.value).toFixed(1)}m` : null].filter(Boolean).map((label) => ` · ${label}`).join(""));
const fetchedLabel = computed(() => props.fetchedAt ? new Intl.DateTimeFormat("en-GB", {
  day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "UTC",
}).format(new Date(props.fetchedAt)) : "");
const scrollPlayers = (direction: number) => playerRail.value?.scrollBy({ left: direction * playerRail.value.clientWidth,
  behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
watch([position, price, sortKey], () => playerRail.value?.scrollTo({ left: 0 }));
</script>
