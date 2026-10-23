<template>
  <div v-if="loading" class="grid min-w-0 gap-6 lg:grid-cols-3" role="status" aria-label="Loading player trends">
    <USkeleton v-for="index in 3" :key="index" class="h-72 rounded-xl" />
  </div>

  <div v-else-if="error" class="flex flex-wrap items-center justify-between gap-3 py-4" role="alert">
    <p class="text-sm text-stone-300">Player trend rankings could not be loaded.</p>
    <UButton color="neutral" variant="outline" @click="$emit('retry')">Try again</UButton>
  </div>

  <div v-else class="grid min-w-0 gap-8 lg:grid-cols-3">
    <section
      v-for="section in sections"
      :key="section.id"
      class="min-w-0"
      :aria-labelledby="`player-trend-${section.id}-title`"
    >
      <header class="mb-3 border-b border-white/10 pb-3">
        <h2 :id="`player-trend-${section.id}-title`" class="text-xl font-bold tracking-tight text-white">{{ section.title }}</h2>
        <p class="mt-1 text-sm leading-5 text-stone-400">{{ section.description }}</p>
      </header>

      <ul v-if="section.players.length" class="divide-y divide-white/10" :aria-label="section.title">
        <HomePlayerDiscoveryRow
          v-for="(player, index) in section.players"
          :key="player.id"
          :player="player"
          :team="getTeam(player)"
          :rank="index + 1"
          :metric-label="section.metricLabel"
          :metric-value="formatMetric(player, section.metricKey)"
        />
      </ul>
      <p v-else class="py-4 text-sm text-stone-400">{{ emptyMessage(section) }}</p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { getHomepagePlayerTrendSections, type ShortlistPlayer } from "~/utils/homepage-shortlist";

const props = withDefaults(defineProps<{
  players: ShortlistPlayer[];
  teams: Record<string, any>[];
  loading?: boolean;
  error?: boolean;
}>(), { loading: false, error: false });

defineEmits(["retry"]);

const rankedPlayers = computed(() => getHomepagePlayerTrendSections(props.players));
const sections = computed(() => [
  {
    id: "differentials",
    title: "Differentials",
    description: "Lowest FPL ownership first; form and season points break ties.",
    metricKey: "selected_by_percent",
    metricLabel: "owned",
    players: rankedPlayers.value.differentials,
  },
  {
    id: "most-sold",
    title: "Most sold this gameweek",
    description: "Ranked by current-gameweek transfers out.",
    metricKey: "transfers_out_event",
    metricLabel: "transfers out",
    players: rankedPlayers.value.mostSold,
  },
  {
    id: "most-bought",
    title: "Most bought this gameweek",
    description: "Ranked by current-gameweek transfers in.",
    metricKey: "transfers_in_event",
    metricLabel: "transfers in",
    players: rankedPlayers.value.mostBought,
  },
]);

const getTeam = (player: ShortlistPlayer) => props.teams.find((team) => team.id === player.team) || null;

const formatMetric = (player: ShortlistPlayer, key: string) => {
  const value = Number(player[key]);
  if (!Number.isFinite(value)) return "Unavailable";
  if (key === "selected_by_percent") {
    return `${new Intl.NumberFormat("en-GB", { maximumFractionDigits: 1 }).format(value)}%`;
  }
  return new Intl.NumberFormat("en-GB").format(value);
};

const hasMetricData = (key: string) => props.players.some((player) =>
  player[key] !== null && player[key] !== undefined && player[key] !== "" && Number.isFinite(Number(player[key])),
);

const emptyMessage = (section: (typeof sections.value)[number]) => {
  if (section.metricKey === "selected_by_percent") return "Ownership data is not available right now.";
  return hasMetricData(section.metricKey)
    ? "No transfers have been recorded in this gameweek yet."
    : "Gameweek transfer data is not available right now.";
};
</script>
