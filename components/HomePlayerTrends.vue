<template>
  <div v-if="loading" class="grid min-w-0 gap-6 lg:grid-cols-3" role="status" aria-label="Loading player trends">
    <USkeleton v-for="index in 3" :key="index" class="h-72 rounded-xl" />
  </div>

  <div v-else-if="error" class="flex flex-wrap items-center justify-between gap-3 py-4" role="alert">
    <p class="text-sm text-stone-300">Player trend rankings could not be loaded.</p>
    <UButton color="neutral" variant="outline" @click="$emit('retry')">Try again</UButton>
  </div>

  <div v-else class="min-w-0">
    <h2 class="sr-only">Player transfers</h2>
    <UTabs
      :items="sections"
      :default-value="sections[0]?.id ?? 'most-sold'"
      value-key="id"
      label-key="title"
      variant="pill"
      color="primary"
      :ui="{
        list: 'w-full gap-0 divide-x divide-white/10 rounded-lg border border-white/10 bg-white/[0.04] p-0 sm:w-fit',
        indicator: 'hidden',
        trigger: 'min-h-8 flex-1 justify-center whitespace-normal rounded-none first:rounded-l-lg last:rounded-r-lg bg-transparent px-3 py-1 text-center text-xs leading-4 text-stone-400 ring-0 transition-colors hover:bg-lime-300/10 hover:text-lime-200 data-[state=active]:bg-lime-300/10 data-[state=active]:text-lime-200 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-lime-300 focus-visible:ring-0 motion-reduce:transition-none sm:flex-none sm:text-sm',
      }"
      class="min-w-0"
    >
      <template #content="{ item }">
        <div class="pt-3">
          <ul v-if="item.players.length" class="divide-y divide-white/10" :aria-label="item.title">
            <HomePlayerDiscoveryRow
              v-for="(player, index) in item.players"
              :key="player.id"
              :player="player"
              :team="getTeam(player)"
              :rank="index + 1"
              compact
              :show-availability="item.id === 'most-sold'"
              :metric-label="item.metricLabel"
              :metric-value="formatMetric(player, item.metricKey)"
              :metric-title="formatExactMetric(player, item.metricKey)"
            />
          </ul>
          <p v-else class="py-4 text-sm text-stone-400">{{ emptyMessage(item) }}</p>
        </div>
      </template>
    </UTabs>
  </div>
</template>

<script setup lang="ts">
import { getHomepagePlayerTrendSections, type ShortlistPlayer } from "~/utils/homepage-shortlist";
import { compactInstagramNumber } from "~/utils/instagram-designs";

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
    id: "most-sold",
    title: "Most sold this gameweek",
    metricKey: "transfers_out_event",
    metricLabel: "transfers out",
    players: rankedPlayers.value.mostSold,
  },
  {
    id: "most-bought",
    title: "Most bought this gameweek",
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
  return compactInstagramNumber(value);
};

const formatExactMetric = (player: ShortlistPlayer, key: string) =>
  new Intl.NumberFormat("en-GB").format(Number(player[key]));

const hasMetricData = (key: string) => props.players.some((player) =>
  player[key] !== null && player[key] !== undefined && player[key] !== "" && Number.isFinite(Number(player[key])),
);

const emptyMessage = (section: (typeof sections.value)[number]) => {
  if (section.metricKey === "selected_by_percent") return hasMetricData(section.metricKey)
    ? "No low-owned players with recent form are available."
    : "Ownership data is not available right now.";
  return hasMetricData(section.metricKey)
    ? "No transfers have been recorded in this gameweek yet."
    : "Gameweek transfer data is not available right now.";
};
</script>
