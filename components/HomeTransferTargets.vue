<template>
  <section aria-labelledby="recommended-buys-title" class="grid min-w-0 gap-3">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <header>
        <h2 id="recommended-buys-title" class="text-xl font-bold tracking-tight text-white">Recommended buys</h2>
        <p v-if="updatedAtLabel" class="mt-1 text-xs text-stone-500">{{ source === 'reviewed' ? 'Reviewed' : 'Stats updated' }} {{ updatedAtLabel }}</p>
      </header>
      <div class="flex min-w-0 flex-wrap items-center gap-2">
        <label for="buy-position" class="sr-only">Position</label>
        <USelect id="buy-position" v-model="position" :items="SHORTLIST_POSITIONS" variant="none" size="sm" class="w-36 shrink-0" :ui="selectUi" />
        <label for="buy-price" class="sr-only">Maximum price</label>
        <USelect id="buy-price" v-model="maxPrice" :items="SHORTLIST_PRICE_LIMITS" variant="none" size="sm" class="w-32 shrink-0" :ui="selectUi" />
        <div v-if="targets.length" class="flex shrink-0 items-center gap-1">
          <CarouselArrowButton direction="previous" aria-label="Previous recommended buys" :disabled="!canScrollPrevious" @click="scrollTargets(-1)" />
          <CarouselArrowButton direction="next" aria-label="Next recommended buys" :disabled="!canScrollNext" @click="scrollTargets(1)" />
        </div>
      </div>
    </div>

    <div v-if="loading" :class="CAROUSEL_CARD_COLUMNS" class="grid min-w-0 grid-flow-col gap-4 overflow-hidden" role="status" aria-label="Loading transfer targets">
      <USkeleton v-for="index in 3" :key="index" class="h-96 rounded-2xl" />
    </div>

    <div v-else-if="error" class="flex flex-wrap items-center justify-between gap-3 py-4" role="alert">
      <p class="text-sm text-stone-300">Transfer targets could not be loaded.</p>
      <UButton color="neutral" variant="outline" @click="$emit('retry')">Try again</UButton>
    </div>

    <p v-else-if="!allTargets.length" class="py-4 text-sm text-stone-400">
      No strong buy picks match these filters right now.
    </p>

    <div v-else-if="!targets.length" class="flex flex-col items-center justify-center gap-3 py-4 text-center" :style="reservedRailHeight ? { minHeight: `${reservedRailHeight}px` } : undefined">
      <p class="text-sm text-stone-400">No more picks are available for this gameweek.</p>
      <UButton color="neutral" variant="ghost" size="sm" @click="restoreDismissedPlayers">Show picks again</UButton>
    </div>

    <ul v-else ref="rail" :class="CAROUSEL_CARD_COLUMNS" :style="reservedRailHeight ? { minHeight: `${reservedRailHeight}px` } : undefined" class="grid min-w-0 grid-flow-col gap-4 overflow-x-auto overscroll-x-contain pb-3 snap-x snap-mandatory focus-visible:outline-2 focus-visible:outline-primary" aria-label="Recommended buys" tabindex="0" @scroll.passive="updateScrollControls" @keydown.left.self.prevent="scrollTargets(-1)" @keydown.right.self.prevent="scrollTargets(1)">
      <li v-for="player in targets" :key="player.id" class="min-w-0 snap-start">
        <HomeShortlistPlayerCard
          :player="player"
          :teams="teams"
          :fixtures="fixtures"
          :gameweeks="gameweeks"
          :fixtures-available="fixturesAvailable"
          :fixtures-loading="fixturesLoading"
          sort-key="ep_next"
          :buy-evidence="player.buyEvidence"
          dismissible
          @dismiss="dismissTarget"
        />
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import CarouselArrowButton from "~/components/CarouselArrowButton.vue";
import { CAROUSEL_CARD_COLUMNS } from "~/utils/carousel-layout";
import { SHORTLIST_POSITIONS, SHORTLIST_PRICE_LIMITS, type ShortlistPlayer, type ShortlistFixture } from "~/utils/homepage-shortlist";
import { availableBuy, type HomepageBuyIdea } from "~/shared/homepage-buys";

const props = withDefaults(defineProps<{
  players: ShortlistPlayer[];
  teams: Record<string, any>[];
  fixtures: ShortlistFixture[];
  gameweeks: number[];
  fixturesAvailable: boolean;
  fixturesLoading?: boolean;
  loading?: boolean;
  error?: boolean;
  snapshot?: { gameweeks: number[]; ideas: HomepageBuyIdea[] } | null;
  generatedAt?: number | null;
  source?: string;
}>(), { loading: false, error: false, fixturesLoading: false });

defineEmits(["retry"]);

const selectUi = {
  base: "h-8 rounded-lg border border-[#303640] bg-[#0c0f13] font-semibold text-stone-100 ring-0 hover:border-[#48515f] hover:bg-[#1b2028] hover:text-stone-100 data-[state=open]:bg-[#1b2028] focus-visible:border-lime-300/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-300/50 [color-scheme:dark]",
  content: "bg-[#101216] text-stone-100 ring-[#303640]",
  item: "text-stone-200 data-highlighted:not-data-disabled:text-white data-highlighted:not-data-disabled:before:bg-[#242b35]",
  trailingIcon: "text-stone-400",
  itemTrailingIcon: "text-lime-300",
  viewport: "divide-y-0",
};

const position = ref(0);
const maxPrice = ref(0);
const updatedAtLabel = computed(() => props.generatedAt && Number.isFinite(props.generatedAt)
  ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(props.generatedAt) : null);
const currentGameweek = computed(() => Number(props.gameweeks[0]) || 0);
const dismissalStorageKey = computed(() => currentGameweek.value
  ? `fpl-insights:recommended-buys:v1:gw-${currentGameweek.value}`
  : null);
const dismissedPlayerIds = ref<number[]>([]);
const reservedRailHeight = ref<number | null>(null);
const canScrollPrevious = ref(false);
const canScrollNext = ref(false);
const allTargets = computed(() => {
  if (props.snapshot?.gameweeks[0] !== currentGameweek.value) return [];
  const players = new Map(props.players.map((player) => [Number(player.id), player]));
  return props.snapshot.ideas.flatMap((idea) => {
    const player = players.get(idea.id);
    return player && Number(player.code) === idea.code && availableBuy(player) &&
      (!position.value || Number(player.element_type) === position.value) && (!maxPrice.value || Number(player.now_cost) <= maxPrice.value)
      ? [{ ...player, buyEvidence: idea }] : [];
  });
});
const targets = computed(() => allTargets.value
  .filter((player) => !dismissedPlayerIds.value.includes(Number(player.id)))
  .slice(0, 8));
const rail = ref<HTMLElement | null>(null);

const updateScrollControls = () => {
  const track = rail.value;
  if (!track) {
    canScrollPrevious.value = false;
    canScrollNext.value = false;
    return;
  }
  canScrollPrevious.value = track.scrollLeft > 1;
  canScrollNext.value = track.scrollLeft + track.clientWidth < track.scrollWidth - 1;
};

const loadDismissedPlayers = () => {
  const key = dismissalStorageKey.value;
  if (!key) {
    dismissedPlayerIds.value = [];
    return;
  }

  try {
    const stored = JSON.parse(localStorage.getItem(key) || "[]");
    dismissedPlayerIds.value = Array.isArray(stored)
      ? stored.filter((id): id is number => Number.isSafeInteger(id) && id > 0)
      : [];
  } catch {
    dismissedPlayerIds.value = [];
  }
};

onMounted(() => {
  if (rail.value) reservedRailHeight.value = rail.value.getBoundingClientRect().height;
  loadDismissedPlayers();
  nextTick(updateScrollControls);
});
watch(currentGameweek, () => {
  reservedRailHeight.value = null;
  loadDismissedPlayers();
  nextTick(updateScrollControls);
});
watch(targets, () => nextTick(updateScrollControls));

const dismissTarget = (playerId: number) => {
  if (reservedRailHeight.value === null && rail.value) {
    reservedRailHeight.value = rail.value.getBoundingClientRect().height;
  }
  const nextIds = [...new Set([...dismissedPlayerIds.value, playerId])];
  dismissedPlayerIds.value = nextIds;
  const key = dismissalStorageKey.value;
  if (!key) return;

  try {
    localStorage.setItem(key, JSON.stringify(nextIds));
  } catch {
    // Keep the dismissal active for this page view if local storage is unavailable.
  }
};

const restoreDismissedPlayers = () => {
  dismissedPlayerIds.value = [];
  const key = dismissalStorageKey.value;
  if (!key) return;

  try {
    localStorage.setItem(key, "[]");
  } catch {
    // Keep the reset active for this page view if local storage is unavailable.
  }
};

const scrollTargets = (direction: number) => {
  if (!rail.value) return;
  rail.value.scrollBy({
    left: direction * rail.value.clientWidth * 0.9,
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
  });
};
</script>
