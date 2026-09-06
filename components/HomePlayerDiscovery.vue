<template>
  <section aria-labelledby="player-discovery-title" class="grid min-w-0 w-full gap-4">
    <header class="grid min-w-0 gap-4 border-b border-white/10 pb-4 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,0.7fr)] lg:items-end">
      <div>
        <h2 id="player-discovery-title" class="text-3xl font-black tracking-[-0.03em] text-white sm:text-4xl">
          {{ category === "popular" ? "Most-owned players" : activeCategory.label }}
        </h2>
        <p class="mt-2 max-w-2xl text-sm leading-6 text-stone-300">
          {{ activeCategory.description }}
        </p>
      </div>

      <div class="grid min-w-0 grid-cols-2 gap-3">
        <UFormField label="Category" :ui="fieldUi">
          <USelect
            v-model="category"
            :items="categoryItems"
            class="w-full"
            :ui="selectUi"
          />
        </UFormField>
        <UFormField label="Rank by" :ui="fieldUi">
          <USelect
            v-model="sortKey"
            :items="sortOptions"
            class="w-full"
            :ui="selectUi"
          />
        </UFormField>
      </div>
    </header>

    <div v-if="loading" class="divide-y divide-white/10 rounded-xl border border-white/10 bg-white/[0.02]" aria-live="polite">
      <div v-for="index in 4" :key="index" class="grid grid-cols-[auto_minmax(0,1fr)_4rem_5rem] gap-3 px-4 py-4">
        <USkeleton class="size-4" />
        <USkeleton class="h-5 w-40 max-w-full" />
        <USkeleton class="h-5 w-12" />
        <USkeleton class="h-5 w-16" />
      </div>
    </div>

    <div v-else-if="error" class="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-error/25 bg-error/10 px-4 py-4">
      <p class="max-w-xl text-sm leading-6 text-stone-200">
        Player discovery is unavailable because the current FPL data could not be loaded.
      </p>
      <UButton color="neutral" variant="outline" @click="$emit('retry')">
        Try again
      </UButton>
    </div>

    <div v-else-if="!players.length" class="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-5">
      <p class="text-sm text-stone-300">No player shortlist is available right now.</p>
    </div>

    <div v-else class="min-w-0">
      <ul ref="playerRail" class="grid min-w-0 grid-flow-col auto-cols-[minmax(17rem,85%)] gap-4 overflow-x-auto pb-3 snap-x snap-mandatory sm:auto-cols-[calc((100%_-_1rem)/2)] lg:auto-cols-[calc((100%_-_2rem)/3)]" aria-label="Player shortlist" tabindex="0">
        <li v-for="player in visiblePlayers" :key="player.id" class="min-w-0 snap-start">
          <PlayerCardNew :player="player" :data="teams" compact />
        </li>
      </ul>
      <div class="mt-2 flex flex-wrap items-center justify-between gap-3">
        <p class="text-xs text-stone-400">{{ activeMetricLabel }} · {{ visiblePlayers.length }} of {{ candidatePlayers.length }} players</p>
        <div class="flex items-center gap-2">
          <UButton icon="i-lucide-chevron-left" aria-label="Previous players" color="neutral" variant="outline" class="text-stone-200" @click="scrollPlayers(-1)" />
          <UButton icon="i-lucide-chevron-right" aria-label="Next players" color="neutral" variant="outline" class="text-stone-200" @click="scrollPlayers(1)" />
        <UButton v-if="visibleCount < candidatePlayers.length" color="neutral" variant="ghost" size="sm" class="text-stone-200" @click="visibleCount = candidatePlayers.length">Show all {{ candidatePlayers.length }}</UButton>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import {
  getMostSelectedPlayers,
  getMostTransferredInPlayers,
  getMostTransferredOutPlayers,
  getTopPlayers,
} from "~/composables/usePremiereLeague";

const props = defineProps({
  players: {
    type: Array,
    default: () => [],
  },
  teams: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: Boolean,
    default: false,
  },
});

defineEmits(["retry"]);

const playerRail = ref(null);
const scrollPlayers = (direction) => playerRail.value?.scrollBy({ left: direction * playerRail.value.clientWidth, behavior: 'smooth' });
const visibleCount = ref(6);
const category = ref("popular");
const sortKey = ref("selected_by_percent");

const fieldUi = {
  root: "w-full",
  label: "text-xs font-semibold uppercase tracking-[0.16em] text-stone-400",
};

const selectUi = {
  base: "w-full rounded-xl border border-accented bg-default text-sm text-highlighted hover:bg-elevated",
};

const categoryConfig = {
  popular: {
    label: "Popular players",
    description: "The 20 most-owned players, ranked by your selected stat.",
    defaultSort: "selected_by_percent",
    options: [
      { label: "Selected by %", value: "selected_by_percent" },
      { label: "Total points", value: "total_points" },
      { label: "Form", value: "form" },
      { label: "Price", value: "now_cost" },
    ],
    candidates: (players) => getMostSelectedPlayers(players, 20),
  },
  transfersIn: {
    label: "Transfers in",
    description: "The 20 most-bought players this gameweek.",
    defaultSort: "transfers_in_event",
    options: [
      { label: "Transfers in", value: "transfers_in_event" },
      { label: "Form", value: "form" },
      { label: "Total points", value: "total_points" },
      { label: "Price", value: "now_cost" },
    ],
    candidates: (players) => getMostTransferredInPlayers(players, 20),
  },
  transfersOut: {
    label: "Transfers out",
    description: "The 20 most-sold players this gameweek.",
    defaultSort: "transfers_out_event",
    options: [
      { label: "Transfers out", value: "transfers_out_event" },
      { label: "Form", value: "form" },
      { label: "Total points", value: "total_points" },
      { label: "Price", value: "now_cost" },
    ],
    candidates: (players) => getMostTransferredOutPlayers(players, 20),
  },
  forwards: {
    label: "Forwards",
    description: "20 forwards shortlisted across multiple stats.",
    defaultSort: "total_points",
    options: [
      { label: "Total points", value: "total_points" },
      { label: "Form", value: "form" },
      { label: "Goals scored", value: "goals_scored" },
      { label: "Price", value: "now_cost" },
    ],
    candidates: (players) => getTopPlayers(players, 4, 20),
  },
  midfielders: {
    label: "Midfielders",
    description: "20 midfielders shortlisted across multiple stats.",
    defaultSort: "total_points",
    options: [
      { label: "Total points", value: "total_points" },
      { label: "Form", value: "form" },
      { label: "Assists", value: "assists" },
      { label: "Goals scored", value: "goals_scored" },
      { label: "Price", value: "now_cost" },
    ],
    candidates: (players) => getTopPlayers(players, 3, 20),
  },
  defenders: {
    label: "Defenders",
    description: "20 defenders shortlisted across multiple stats.",
    defaultSort: "total_points",
    options: [
      { label: "Total points", value: "total_points" },
      { label: "Form", value: "form" },
      { label: "Clean sheets", value: "clean_sheets" },
      { label: "Goals conceded", value: "goals_conceded" },
      { label: "Price", value: "now_cost" },
    ],
    candidates: (players) => getTopPlayers(players, 2, 20),
  },
  goalkeepers: {
    label: "Goalkeepers",
    description: "20 goalkeepers shortlisted across multiple stats.",
    defaultSort: "total_points",
    options: [
      { label: "Total points", value: "total_points" },
      { label: "Form", value: "form" },
      { label: "Clean sheets", value: "clean_sheets" },
      { label: "Saves", value: "saves" },
      { label: "Price", value: "now_cost" },
    ],
    candidates: (players) => getTopPlayers(players, 1, 20),
  },
};

const categoryItems = Object.entries(categoryConfig).map(([value, config]) => ({
  label: config.label,
  value,
}));

const activeCategory = computed(() => categoryConfig[category.value] || categoryConfig.popular);
const sortOptions = computed(() => activeCategory.value.options);
const activeMetricLabel = computed(() =>
  sortOptions.value.find((option) => option.value === sortKey.value)?.label || sortOptions.value[0].label,
);
const teamById = computed(() => new Map(props.teams.map((team) => [team.id, team])));
const candidatePlayers = computed(() => activeCategory.value.candidates(props.players));

const visiblePlayers = computed(() =>
  [...candidatePlayers.value]
    .sort((a, b) => (Number(b?.[sortKey.value]) || 0) - (Number(a?.[sortKey.value]) || 0))
    .slice(0, visibleCount.value),
);

const formatMetric = (player, key) => {
  const value = Number(player?.[key]) || 0;

  if (key === "selected_by_percent") return `${value.toFixed(value % 1 ? 1 : 0)}%`;
  if (key === "now_cost") return `£${(value / 10).toFixed(1)}m`;
  if (key === "form" || key === "points_per_game") return value.toFixed(1);
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
};

watch(category, () => {
  sortKey.value = activeCategory.value.defaultSort;
  visibleCount.value = 6;
  playerRail.value?.scrollTo({ left: 0 });
});
</script>
