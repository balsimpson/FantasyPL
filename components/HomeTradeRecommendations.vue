<template>
  <section aria-labelledby="recommended-trades-title" class="grid min-w-0 gap-3">
    <div class="flex items-start justify-between gap-3">
      <header>
        <h2 id="recommended-trades-title" class="text-xl font-bold tracking-tight text-white">Recommended trades</h2>
        <p v-if="updatedAtLabel" class="mt-1 text-xs text-stone-500">Updated {{ updatedAtLabel }}</p>
      </header>
      <div v-if="tradeIdeas.length" class="flex shrink-0 items-center gap-1">
        <UButton icon="i-lucide-chevron-left" color="neutral" variant="ghost" size="sm" class="text-stone-300 hover:bg-white/5 hover:text-white" aria-label="Previous recommended trades" :disabled="!canScrollPrevious" @click="scrollTradeIdeas(-1)" />
        <UButton icon="i-lucide-chevron-right" color="neutral" variant="ghost" size="sm" class="text-stone-300 hover:bg-white/5 hover:text-white" aria-label="Next recommended trades" :disabled="!canScrollNext" @click="scrollTradeIdeas(1)" />
      </div>
    </div>

    <div v-if="loading" class="grid min-w-0 grid-flow-col auto-cols-[92%] gap-4 overflow-hidden sm:auto-cols-[calc((100%_-_1rem)/2)] xl:auto-cols-[calc((100%_-_2rem)/3)]" role="status" aria-label="Loading trade ideas">
      <USkeleton v-for="index in 3" :key="index" class="h-[34rem] rounded-xl" />
    </div>

    <div v-else-if="error" class="flex flex-wrap items-center justify-between gap-3 py-4" role="alert">
      <p class="text-sm text-stone-300">Trade ideas could not be loaded.</p>
      <UButton color="neutral" variant="outline" @click="$emit('retry')">Try again</UButton>
    </div>

    <p v-else-if="!rankedTradeIdeas.length" class="py-4 text-sm text-stone-400" role="status">
      No clear same-position upgrades are available from the current FPL data.
    </p>

    <div v-else-if="!tradeIdeas.length" class="flex flex-col items-center justify-center gap-3 py-4 text-center" :style="reservedRailHeight ? { minHeight: `${reservedRailHeight}px` } : undefined">
      <p class="text-sm text-stone-400">No more trade ideas are available for this gameweek.</p>
      <UButton color="neutral" variant="ghost" size="sm" @click="restoreDismissedIdeas">Show trade ideas again</UButton>
    </div>

    <ul v-else ref="rail" :style="reservedRailHeight ? { minHeight: `${reservedRailHeight}px` } : undefined" class="grid min-w-0 grid-flow-col auto-cols-[92%] gap-4 overflow-x-auto overscroll-x-contain pb-3 snap-x snap-mandatory focus-visible:outline-2 focus-visible:outline-primary sm:auto-cols-[calc((100%_-_1rem)/2)] xl:auto-cols-[calc((100%_-_2rem)/3)]" aria-label="Recommended trade ideas" tabindex="0" @scroll.passive="updateScrollControls" @keydown.left.self.prevent="scrollTradeIdeas(-1)" @keydown.right.self.prevent="scrollTradeIdeas(1)">
      <li v-for="(idea, index) in tradeIdeas" :key="idea.id" class="min-w-0 snap-start">
        <article class="flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-white/10 bg-[#101216]">
          <header class="flex items-center justify-between gap-2 px-3 py-3 sm:px-4">
            <p class="text-xs text-stone-400">{{ index + 1 }} / {{ tradeIdeas.length }}</p>
            <p class="shrink-0 text-xs font-semibold tabular-nums text-primary">
              {{ formatDelta(idea.expectedPointsGain, 1) }} expected · GW {{ gameweeks[0] ?? '—' }}
            </p>
          </header>

          <div class="relative grid h-[23rem] grid-cols-2 border-y border-white/10">
            <NuxtLink :to="getPlayerRoute(idea.outgoing)" :aria-label="`View ${idea.outgoing.web_name}, sell option`" class="group relative flex h-full min-w-0 flex-col justify-end overflow-hidden bg-stone-900/50 focus-visible:z-20 focus-visible:outline-2 focus-visible:outline-primary">
              <PlayerPortrait :player="idea.outgoing" :alt="idea.outgoing.web_name" fill-frame />
              <span class="absolute inset-0 z-20 bg-gradient-to-t from-black/90 via-black/55 via-25% to-transparent to-65%" aria-hidden="true" />
              <span class="relative z-30 min-w-0 px-3 pb-3 pt-32 sm:px-4 sm:pb-4">
                <span class="block text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-stone-300">Sell</span>
                <span class="mt-1 block text-lg font-bold leading-tight text-white group-hover:text-primary [overflow-wrap:anywhere]">{{ idea.outgoing.web_name }}</span>
                <span class="mt-1 flex min-h-4 flex-wrap items-center gap-x-1.5 text-xs leading-4 text-stone-300">
                  <img v-if="getTeamCode(idea.outgoing.team)" :src="`https://resources.premierleague.com/premierleague/badges/t${getTeamCode(idea.outgoing.team)}.png`" alt="" width="16" height="16" loading="lazy" decoding="async" class="size-4 shrink-0 object-contain" />
                  <span class="[overflow-wrap:anywhere]">{{ getTeamName(idea.outgoing.team) }} · {{ getPositionName(idea.outgoing) }}</span>
                </span>
                <span class="mt-1 block text-base font-semibold tabular-nums text-white">£{{ (Number(idea.outgoing.now_cost) / 10).toFixed(1) }}m</span>
              </span>
            </NuxtLink>

            <NuxtLink :to="getPlayerRoute(idea.incoming)" :aria-label="`View ${idea.incoming.web_name}, buy option`" class="group relative flex h-full min-w-0 flex-col justify-end overflow-hidden border-l border-white/10 bg-stone-900/50 focus-visible:z-20 focus-visible:outline-2 focus-visible:outline-primary">
              <PlayerPortrait :player="idea.incoming" :alt="idea.incoming.web_name" fill-frame />
              <span class="absolute inset-0 z-20 bg-gradient-to-t from-black/90 via-black/55 via-25% to-transparent to-65%" aria-hidden="true" />
              <span class="relative z-30 w-full min-w-0 px-3 pb-3 pt-32 text-right sm:px-4 sm:pb-4">
                <span class="block text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-primary">Buy</span>
                <span class="mt-1 block text-lg font-bold leading-tight text-white group-hover:text-primary [overflow-wrap:anywhere]">{{ idea.incoming.web_name }}</span>
                <span class="mt-1 flex min-h-4 flex-wrap items-center justify-end gap-x-1.5 text-xs leading-4 text-stone-300">
                  <img v-if="getTeamCode(idea.incoming.team)" :src="`https://resources.premierleague.com/premierleague/badges/t${getTeamCode(idea.incoming.team)}.png`" alt="" width="16" height="16" loading="lazy" decoding="async" class="size-4 shrink-0 object-contain" />
                  <span class="[overflow-wrap:anywhere]">{{ getTeamName(idea.incoming.team) }} · {{ getPositionName(idea.incoming) }}</span>
                </span>
                <span class="mt-1 flex flex-wrap items-baseline justify-end gap-x-1.5 text-base font-semibold tabular-nums text-white">
                  <span>£{{ (Number(idea.incoming.now_cost) / 10).toFixed(1) }}m</span>
                  <span v-if="idea.priceChange" class="text-xs" :class="idea.priceChange > 0 ? 'text-amber-100' : 'text-primary'">({{ formatPriceChange(idea.priceChange) }})</span>
                </span>
              </span>
            </NuxtLink>

            <span class="pointer-events-none absolute left-1/2 top-1/2 z-40 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-[#101216] px-2 py-1 text-[0.62rem] font-bold uppercase tracking-[0.1em] text-stone-200" aria-hidden="true">vs</span>
          </div>

          <div class="px-3 py-3 sm:px-4">
            <p class="text-sm leading-5 text-stone-200">{{ idea.reason }}</p>
            <p v-if="idea.sampleNote" class="mt-1 text-xs leading-5 text-amber-200">{{ idea.sampleNote }}</p>
            <table class="mt-3 w-full table-fixed text-xs tabular-nums">
              <caption class="sr-only">Player comparison for {{ idea.outgoing.web_name }} and {{ idea.incoming.web_name }}</caption>
              <thead class="sr-only">
                <tr><th scope="col">Sell</th><th scope="col">Measure</th><th scope="col">Buy and change</th></tr>
              </thead>
              <tbody>
                <tr v-for="row in getComparisonRows(idea)" :key="row.label" class="border-t border-white/10">
                  <td class="w-[30%] py-2.5 text-left text-sm font-semibold text-white">{{ row.outgoing }}</td>
                  <th scope="row" class="w-[40%] px-1 py-2.5 text-center font-normal leading-4 text-stone-400">{{ row.label }}</th>
                  <td class="w-[30%] py-2.5 text-right">
                    <span class="flex items-center justify-end gap-1.5 sm:gap-2">
                      <span class="text-sm font-semibold text-white">{{ row.incoming }}</span>
                      <span class="inline-flex w-12 shrink-0 items-center justify-end gap-0.5 text-[0.65rem] font-semibold" :class="getChangeClass(row)">
                        <UIcon :name="getChangeIcon(row.delta)" class="size-3 shrink-0" aria-hidden="true" />
                        <span>{{ formatDelta(row.delta, row.precision) }}{{ row.suffix }}</span>
                      </span>
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="mt-auto px-3 py-2 sm:px-4">
          <UButton
            class="mt-2 w-full justify-center text-stone-300 hover:bg-white/5 hover:text-white"
            color="neutral"
            variant="ghost"
            size="sm"
            icon="i-lucide-eye-off"
            type="button"
            :aria-label="`Not interested in trading ${idea.outgoing.web_name} for ${idea.incoming.web_name}`"
            @click.stop="dismissTradeIdea(String(idea.id))"
          >
            Not interested
          </UButton>
          </div>
        </article>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { type ShortlistPlayer } from "~/utils/homepage-shortlist";
import { getPlayerRoute } from "~/composables/usePlayerRoute";

const props = withDefaults(defineProps<{
  players: ShortlistPlayer[];
  teams: Record<string, any>[];
  gameweeks: number[];
  snapshot?: { version?: number; gameweeks?: number[]; ideas?: Record<string, any>[] } | null;
  generatedAt?: number | null;
  loading?: boolean;
  error?: boolean;
}>(), { loading: false, error: false });

defineEmits(["retry"]);

const currentGameweek = computed(() => Number(props.gameweeks[0]) || 0);
const dismissalStorageKey = computed(() => currentGameweek.value
  ? `fpl-insights:recommended-trades:v1:gw-${currentGameweek.value}`
  : null);
const dismissedIdeaIds = ref<string[]>([]);
const reservedRailHeight = ref<number | null>(null);
const rail = ref<HTMLElement | null>(null);
const canScrollPrevious = ref(false);
const canScrollNext = ref(false);

const rankedTradeIdeas = computed(() => {
  const snapshotGameweek = props.snapshot?.gameweeks?.[0];
  return snapshotGameweek === currentGameweek.value && Array.isArray(props.snapshot?.ideas)
    ? props.snapshot.ideas : [];
});
const tradeIdeas = computed(() => rankedTradeIdeas.value.filter((idea) => !dismissedIdeaIds.value.includes(String(idea.id))));

const updateScrollControls = () => {
  const track = rail.value;
  canScrollPrevious.value = Boolean(track && track.scrollLeft > 1);
  canScrollNext.value = Boolean(track && track.scrollLeft + track.clientWidth < track.scrollWidth - 1);
};

const loadDismissedIdeas = () => {
  const key = dismissalStorageKey.value;
  if (!key) {
    dismissedIdeaIds.value = [];
    return;
  }

  try {
    const stored = JSON.parse(localStorage.getItem(key) || "[]");
    dismissedIdeaIds.value = Array.isArray(stored)
      ? stored.filter((id): id is string => typeof id === "string" && /^\d+-\d+$/.test(id))
      : [];
  } catch {
    dismissedIdeaIds.value = [];
  }
};

onMounted(() => {
  if (rail.value) reservedRailHeight.value = rail.value.getBoundingClientRect().height;
  loadDismissedIdeas();
  nextTick(updateScrollControls);
});
watch(currentGameweek, () => {
  reservedRailHeight.value = null;
  loadDismissedIdeas();
  nextTick(updateScrollControls);
});
watch(tradeIdeas, () => nextTick(updateScrollControls));

const dismissTradeIdea = (ideaId: string) => {
  if (reservedRailHeight.value === null && rail.value) {
    reservedRailHeight.value = rail.value.getBoundingClientRect().height;
  }
  const nextIds = [...new Set([...dismissedIdeaIds.value, ideaId])];
  dismissedIdeaIds.value = nextIds;
  const key = dismissalStorageKey.value;
  if (!key) return;

  try {
    localStorage.setItem(key, JSON.stringify(nextIds));
  } catch {
    // Keep the dismissal active for this page view if local storage is unavailable.
  }
};

const restoreDismissedIdeas = () => {
  dismissedIdeaIds.value = [];
  const key = dismissalStorageKey.value;
  if (!key) return;

  try {
    localStorage.setItem(key, "[]");
  } catch {
    // Keep the reset active for this page view if local storage is unavailable.
  }
};

const scrollTradeIdeas = (direction: number) => {
  if (!rail.value) return;
  rail.value.scrollBy({
    left: direction * rail.value.clientWidth * 0.9,
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
  });
};
const updatedAtLabel = computed(() => typeof props.generatedAt === "number" && Number.isFinite(props.generatedAt) && props.generatedAt > 0
  ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(props.generatedAt)
  : null);
const getTeamName = (teamId: number) => props.teams.find((team) => Number(team.id) === Number(teamId))?.name || "Club unavailable";
const getTeamCode = (teamId: number) => Number(props.teams.find((team) => Number(team.id) === Number(teamId))?.code) || null;
const formatStat = (value: unknown) => value === null || value === undefined || !Number.isFinite(Number(value)) ? "—" : Number(value).toFixed(1);
const formatNumber = (value: unknown) => value === null || value === undefined || !Number.isFinite(Number(value)) ? "—" : Number(value).toLocaleString("en-GB");
const formatDelta = (delta: number | null, precision: number) => delta === null
  ? "—"
  : `${delta > 0 ? "+" : delta < 0 ? "−" : ""}${Math.abs(delta).toFixed(precision)}`;
const getComparisonRows = (idea: Record<string, any>) => [
  { label: `Expected · GW ${currentGameweek.value}`, outgoing: formatStat(idea.outgoing.ep_next), incoming: formatStat(idea.incoming.ep_next), delta: Number(idea.expectedPointsGain.toFixed(1)), precision: 1, suffix: "", neutral: false },
  { label: "Recent minutes / match", outgoing: formatNumber(Math.round(idea.outgoingRecent.minutesPerMatch)), incoming: formatNumber(Math.round(idea.incomingRecent.minutesPerMatch)), delta: Math.round(idea.incomingRecent.minutesPerMatch) - Math.round(idea.outgoingRecent.minutesPerMatch), precision: 0, suffix: "", neutral: false },
  { label: "Recent starts / matches", outgoing: `${idea.outgoingRecent.starts}/${idea.outgoingRecent.matches}`, incoming: `${idea.incomingRecent.starts}/${idea.incomingRecent.matches}`, delta: Number(((idea.incomingRecent.starts / idea.incomingRecent.matches - idea.outgoingRecent.starts / idea.outgoingRecent.matches) * 100).toFixed(0)), precision: 0, suffix: "pp", neutral: false },
  { label: "Recent points / appearance", outgoing: formatStat(idea.outgoingRecent.pointsPerAppearance), incoming: formatStat(idea.incomingRecent.pointsPerAppearance), delta: idea.recentPointsGain === null ? null : Number(idea.recentPointsGain.toFixed(1)), precision: 1, suffix: "", neutral: false },
  { label: "Selected by", outgoing: `${formatStat(idea.outgoing.selected_by_percent)}%`, incoming: `${formatStat(idea.incoming.selected_by_percent)}%`, delta: Number((Number(idea.incoming.selected_by_percent) - Number(idea.outgoing.selected_by_percent)).toFixed(1)), precision: 1, suffix: "pp", neutral: true },
  { label: "Season points", outgoing: formatNumber(idea.outgoing.total_points), incoming: formatNumber(idea.incoming.total_points), delta: Number(idea.incoming.total_points) - Number(idea.outgoing.total_points), precision: 0, suffix: "", neutral: false },
];
const getChangeClass = (row: { neutral: boolean; delta: number | null }) => row.neutral || row.delta === null || row.delta === 0 ? "text-stone-400" : row.delta > 0 ? "text-primary" : "text-rose-400";
const getChangeIcon = (delta: number | null) => delta === null || delta === 0 ? "i-lucide-minus" : delta > 0 ? "i-lucide-arrow-up" : "i-lucide-arrow-down";
const formatPriceChange = (value: number) => `${value > 0 ? "+" : value < 0 ? "−" : ""}£${Math.abs(value).toFixed(1)}m`;
const getPositionName = (player: ShortlistPlayer) => ["", "Goalkeeper", "Defender", "Midfielder", "Forward"][Number(player.element_type)] || "Position unavailable";
</script>
