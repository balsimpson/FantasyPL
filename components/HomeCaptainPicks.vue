<template>
  <div v-if="loading" :class="CAROUSEL_WIDE_COLUMNS" class="grid min-w-0 grid-flow-col gap-4 overflow-hidden" role="status" aria-label="Loading captain picks">
    <USkeleton v-for="index in 3" :key="index" class="h-64 rounded-xl" />
  </div>

  <div v-else-if="error" class="flex flex-wrap items-center justify-between gap-3 py-4" role="alert">
    <p class="text-sm text-stone-300">Captain and differential picks could not be loaded.</p>
    <UButton color="neutral" variant="outline" @click="$emit('retry')">Try again</UButton>
  </div>

  <div v-else>
    <div
      ref="sectionsTrack"
      :class="CAROUSEL_WIDE_COLUMNS"
      class="grid min-w-0 grid-flow-col gap-4 overflow-x-auto overscroll-x-contain pb-2 snap-x snap-mandatory focus-visible:outline-2 focus-visible:outline-primary"
      role="region"
      aria-roledescription="carousel"
      aria-label="Captain, vice-captain, and differential picks"
      tabindex="0"
      @scroll.passive="updateActiveSection"
      @keydown.left.self.prevent="scrollToSection(activeSection - 1)"
      @keydown.right.self.prevent="scrollToSection(activeSection + 1)"
    >
    <section
      v-for="section in sections"
      :key="section.id"
      class="min-w-0 snap-start"
      :aria-labelledby="`captain-picks-${section.id}-title`"
    >
      <header class="mb-2 border-b border-white/10 pb-2">
        <h2 :id="`captain-picks-${section.id}-title`" class="text-xl font-bold tracking-tight text-white">{{ section.title }}</h2>
        <p v-if="section.description" class="mt-1 text-sm leading-5 text-stone-400">{{ section.description }}</p>
      </header>

      <ul v-if="section.players.length" class="divide-y divide-white/10" :aria-label="section.title">
        <HomePlayerDiscoveryRow
          v-for="(player, index) in section.players"
          :key="player.id"
          :player="player"
          :team="getTeam(player)"
          :rank="section.rankOffset + index + 1"
          compact
          :metric-label="section.metricLabel"
          :metric-value="formatMetric(player, section.metricKey)"
          :metric-unit="section.metricKey === 'ep_next' ? 'pts' : ''"
        />
      </ul>
      <p v-else class="py-4 text-sm text-stone-400">{{ section.emptyMessage }}</p>
    </section>
    </div>
    <div class="mt-2 flex items-center justify-between">
      <p class="text-xs text-stone-400" aria-live="polite">{{ sections[activeSection]?.title }} · {{ activeSection + 1 }} of {{ sections.length }}</p>
      <div class="flex items-center gap-1">
        <CarouselArrowButton direction="previous" aria-label="Previous pick list" :disabled="activeSection === 0" @click="scrollToSection(activeSection - 1)" />
        <CarouselArrowButton direction="next" aria-label="Next pick list" :disabled="activeSection === sections.length - 1" @click="scrollToSection(activeSection + 1)" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import CarouselArrowButton from "~/components/CarouselArrowButton.vue";
import { CAROUSEL_WIDE_COLUMNS } from "~/utils/carousel-layout";
import { getHomepageCaptainPicks, type ShortlistPlayer } from "~/utils/homepage-shortlist";

const props = withDefaults(defineProps<{
  players: ShortlistPlayer[];
  teams: Record<string, any>[];
  loading?: boolean;
  error?: boolean;
  gameweek?: number;
}>(), { loading: false, error: false });

defineEmits(["retry"]);

const picks = computed(() => getHomepageCaptainPicks(props.players));
const sectionsTrack = ref<HTMLElement | null>(null);
const activeSection = ref(0);
const scrollToSection = (index: number) => {
  const track = sectionsTrack.value;
  if (!track) return;
  const targetIndex = Math.max(0, Math.min(index, sections.value.length - 1));
  const target = track.children[targetIndex] as HTMLElement | undefined;
  if (!target) return;
  const first = track.children[0] as HTMLElement;
  const next = track.children[1] as HTMLElement | undefined;
  let left = target.offsetLeft - first.offsetLeft;
  if (targetIndex < activeSection.value && left >= track.scrollLeft - 1) {
    left = track.scrollLeft - (next ? next.offsetLeft - first.offsetLeft : first.offsetWidth);
  }
  activeSection.value = targetIndex;
  track.scrollTo({
    left: Math.max(0, left),
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
  });
};
const updateActiveSection = () => {
  const track = sectionsTrack.value;
  if (!track) return;
  if (track.scrollWidth <= track.clientWidth + 1 || track.scrollLeft <= 1) {
    activeSection.value = 0;
    return;
  }
  if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 1) {
    activeSection.value = sections.value.length - 1;
    return;
  }
  const first = track.children[0] as HTMLElement;
  let nearestIndex = 0;
  let nearestDistance = Number.POSITIVE_INFINITY;
  Array.from(track.children).forEach((child, index) => {
    const distance = Math.abs((child as HTMLElement).offsetLeft - first.offsetLeft - track.scrollLeft);
    if (distance < nearestDistance) {
      nearestIndex = index;
      nearestDistance = distance;
    }
  });
  activeSection.value = nearestIndex;
};
const sections = computed(() => {
  return [
    {
      id: "captains",
      title: "Captain picks",
      description: "",
      players: picks.value.captains,
      rankOffset: 0,
      metricKey: "ep_next",
      metricLabel: "expected points",
      emptyMessage: "FPL expected points are not available right now.",
    },
    {
      id: "vice-captains",
      title: "Vice-captain picks",
      description: "",
      players: picks.value.viceCaptains,
      rankOffset: 4,
      metricKey: "ep_next",
      metricLabel: "expected points",
      emptyMessage: "No further players have an FPL expected-points estimate.",
    },
    {
      id: "differentials",
      title: "Differential picks",
      description: "",
      players: picks.value.differentials,
      rankOffset: 0,
      metricKey: "selected_by_percent",
      metricLabel: "owned",
      emptyMessage: "No low-owned players with recent form are available.",
    },
  ];
});

const getTeam = (player: ShortlistPlayer) => props.teams.find((team) => team.id === player.team) || null;

const formatMetric = (player: ShortlistPlayer, key: string) => {
  const value = Number(player[key]);
  if (!Number.isFinite(value)) return "Unavailable";
  if (key === "selected_by_percent") {
    return `${new Intl.NumberFormat("en-GB", { maximumFractionDigits: 1 }).format(value)}%`;
  }
  return new Intl.NumberFormat("en-GB", { maximumFractionDigits: 1 }).format(value);
};
</script>
