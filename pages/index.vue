<template>
  <div class="relative min-h-screen text-stone-50">
    <main id="main-content" class="site-content-rail flex w-full flex-col gap-8 py-5 sm:py-7">
      <h1 class="sr-only">FPL player stats and fixtures</h1>
      <HomeDeadlinePanel
        :deadline="nextGameweek?.deadline_time"
        :gameweek="nextGameweek?.id"
        :loading="bootstrapPending"
        :error="bootstrapFailed"
      />

      <HomeCaptainPicks
        :players="bootstrap?.elements || []"
        :teams="bootstrap?.teams || []"
        :loading="bootstrapPending"
        :error="bootstrapFailed"
        :gameweek="nextGameweek?.id"
        @retry="retryBootstrap"
      />

      <HomeTransferTargets
        :players="bootstrap?.elements || []"
        :teams="bootstrap?.teams || []"
        :fixtures="fixturesList"
        :gameweeks="shortlistGameweeks"
        :fixtures-available="hasFixtures"
        :fixtures-loading="fixturesPending && !hasFixtures"
        :snapshot="buyRecommendationData?.snapshot"
        :generated-at="buyRecommendationData?.generatedAt"
        :source="buyRecommendationData?.source"
        :loading="bootstrapPending || buysPending"
        :error="bootstrapFailed || Boolean(buyRecommendationError)"
        @retry="retryBuyRecommendations"
      />

      <HomeTradeRecommendations
        :players="bootstrap?.elements || []"
        :teams="bootstrap?.teams || []"
        :gameweeks="shortlistGameweeks"
        :snapshot="tradeRecommendationData?.snapshot"
        :generated-at="tradeRecommendationData?.generatedAt"
        :loading="bootstrapPending || tradesPending"
        :error="bootstrapFailed || Boolean(tradeRecommendationError)"
        @retry="retryTradeRecommendations"
      />

      <HomePlayerTrends
        :players="bootstrap?.elements || []"
        :teams="bootstrap?.teams || []"
        :loading="bootstrapPending"
        :error="bootstrapFailed"
        @retry="retryBootstrap"
      />

      <HomeFixtureList
        :fixtures="fixturesList"
        :teams="bootstrap?.teams || []"
        :gameweeks="shortlistGameweeks"
        :loading="bootstrapPending || fixturesPending"
        :error="fixturesFailed"
        @retry="refreshFixtures"
      />

      <GameWeekCardNew v-if="recapGameweek" :gameweek="recapGameweek" :teams="bootstrap?.teams || []" />
    </main>

    <UModal
      v-model:open="homepageSearchOpen"
      title="Search players"
      description="Search, filter and compare the full player list."
      fullscreen
      scrollable
      :content="searchModalContent"
      :ui="searchModalUi"
      @after:enter="focusPlayerSearch"
    >
      <template #body>
        <div class="site-content-rail mx-auto w-full py-2 sm:py-4">
          <HomePlayerDiscovery
            :players="bootstrap?.elements || []"
            :teams="bootstrap?.teams || []"
            :fixtures="fixturesList"
            :gameweeks="shortlistGameweeks"
            :fixtures-available="hasFixtures"
            :fixtures-loading="fixturesPending && !hasFixtures"
            :loading="bootstrapPending"
            :error="bootstrapFailed"
            @retry="retryBootstrap"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup>
import { getShortlistGameweeks } from "~/utils/homepage-shortlist";

definePageMeta({
  keepalive: true,
});

const canonicalUrl = useCanonicalUrl();
const route = useRoute();
const homepageSearchOpen = useState("homepage-player-search-open", () => false);
const homepageSearchOrigin = useState("homepage-player-search-origin", () => ({ x: 0, y: 0 }));
const searchModalContent = computed(() => ({
  style: { transformOrigin: `${homepageSearchOrigin.value.x}px ${homepageSearchOrigin.value.y}px` },
}));
const searchModalUi = {
  content: "min-h-dvh bg-[#050608] text-stone-50",
  header: "sticky top-0 z-30 h-14 min-h-14 shrink-0 border-b border-white/10 bg-[#0b0d10] px-4 py-3 sm:px-6",
  body: "min-w-0 px-0 py-4 sm:py-6",
};

const focusPlayerSearch = () => {
  nextTick(() => document.getElementById("player-search")?.focus({ preventScroll: true }));
};

watch(() => route.path, (path) => {
  if (path !== "/") homepageSearchOpen.value = false;
});

useHead({
  link: [{ rel: "canonical", href: canonicalUrl }],
});

useSeoMeta({
  title: "FPL Player Stats, Fixtures & Transfer Trends",
  description:
    "Find your next FPL player. Compare prices, form, ownership and upcoming fixtures, then save your shortlist before the next gameweek deadline.",
  ogTitle: "Make your next transfer count | FPL Insights",
  ogDescription:
    "Find your next FPL player. Compare prices, form, ownership and upcoming fixtures, then save your shortlist before the next gameweek deadline.",
  ogUrl: canonicalUrl,
  twitterTitle: "Make your next transfer count | FPL Insights",
  twitterDescription:
    "Find your next FPL player. Compare prices, form, ownership and upcoming fixtures, then save your shortlist before the next gameweek deadline.",
});

const {
  data: bootstrap,
  pending: bootstrapPending,
  error: bootstrapRequestError,
  refresh: refreshBootstrap,
} = await useAsyncData("homepage-bootstrap", () => $fetch("/api/homepage-bootstrap"));

const {
  data: fixtureData,
  status: fixturesStatus,
  error: fixturesRequestError,
  refresh: refreshFixtures,
} = useLazyAsyncData("homepage-fixtures", () => $fetch("/api/homepage-fixtures"), { server: false });

const {
  data: tradeRecommendationData,
  status: tradeRecommendationStatus,
  error: tradeRecommendationError,
  refresh: refreshTradeRecommendations,
} = useLazyAsyncData("homepage-trade-recommendations", () => $fetch("/api/homepage-trades"), {
  server: false,
  default: () => ({ snapshot: null, generatedAt: null, sourceFetchedAt: null }),
});

const tradesPending = computed(() => tradeRecommendationStatus.value === "idle" || tradeRecommendationStatus.value === "pending");
const retryTradeRecommendations = () => Promise.all([retryBootstrap(), refreshTradeRecommendations()]);

const {
  data: buyRecommendationData,
  status: buyRecommendationStatus,
  error: buyRecommendationError,
  refresh: refreshBuyRecommendations,
} = useLazyAsyncData("homepage-buy-recommendations", () => $fetch("/api/homepage-buys"), {
  server: false,
  default: () => ({ snapshot: null, generatedAt: null, source: 'rules' }),
});
const buysPending = computed(() => buyRecommendationStatus.value === "idle" || buyRecommendationStatus.value === "pending");
const retryBuyRecommendations = () => Promise.all([retryBootstrap(), refreshBuyRecommendations()]);

const hasPlayerCatalog = computed(() => Array.isArray(bootstrap.value?.elements));
const bootstrapFailed = computed(() => !bootstrapPending.value && Boolean(bootstrapRequestError.value || !hasPlayerCatalog.value));

const hasFixtures = computed(() => Array.isArray(fixtureData.value?.fixtures));
const fixturesPending = computed(() => fixturesStatus.value === "idle" || fixturesStatus.value === "pending");
const fixturesList = computed(() => hasFixtures.value ? fixtureData.value.fixtures : []);
const fixturesFailed = computed(() => !fixturesPending.value && !hasFixtures.value && Boolean(fixturesRequestError.value || fixtureData.value));
const shortlistGameweeks = computed(() => getShortlistGameweeks(bootstrap.value?.events || []));

const nextGameweek = computed(() => {
  if (!Array.isArray(bootstrap.value?.events)) return null;
  return bootstrap.value.events.find((event) => event.is_next) || null;
});

const recapGameweek = computed(() => {
  const events = Array.isArray(bootstrap.value?.events) ? bootstrap.value.events : [];
  const event = events.find((item) => item.is_current) || [...events].reverse().find((item) => item.finished);

  if (!event) return null;

  const captainedPlayer = getPlayerInfo(event.most_captained, bootstrap.value);
  const viceCaptainedPlayer = getPlayerInfo(event.most_vice_captained, bootstrap.value);
  const playerLabel = (player) => {
    if (!player) return null;
    return `${player.first_name || ""} ${player.second_name || player.web_name || ""}`.trim();
  };

  return {
    ...event,
    mostCaptained: playerLabel(captainedPlayer),
    mostViceCaptained: playerLabel(viceCaptainedPlayer),
    captainedPlayer,
    viceCaptainedPlayer,
  };
});

const retryBootstrap = async () => {
  await Promise.all([refreshBootstrap(), refreshFixtures()]);
};

</script>
