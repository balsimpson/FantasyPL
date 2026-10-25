<template>
  <div class="relative min-h-screen text-stone-50">
    <main id="main-content" class="site-content-rail flex w-full flex-col gap-8 py-5 sm:py-7">
      <h1 class="sr-only">FPL player stats and fixtures</h1>
      <section v-if="bootstrapFailed" class="space-y-4 py-10" role="status">
        <h2 class="text-xl font-semibold text-white">FPL data is taking longer than usual</h2>
        <p class="text-sm text-stone-300">The latest player stats are temporarily unavailable. Please try again in a moment.</p>
        <UButton color="neutral" variant="outline" @click="retryBootstrap">Try again</UButton>
      </section>
      <template v-else>
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

      <p v-if="bootstrap?.fetchedAt" class="text-xs text-stone-400">
        FPL data updated <time :datetime="bootstrap.fetchedAt">{{ new Date(bootstrap.fetchedAt).toUTCString() }}</time>
      </p>
      <GameWeekCardNew v-if="recapGameweek" :gameweek="recapGameweek" :teams="bootstrap?.teams || []" />
      </template>
    </main>
  </div>
</template>

<script setup>
import { getShortlistGameweeks } from "~/utils/homepage-shortlist";

definePageMeta({
  keepalive: true,
});

const canonicalUrl = useCanonicalUrl();

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

const { request: bootstrapRequest, pending: bootstrapPending, failed: bootstrapFailed } = useHomepageBootstrap();
await bootstrapRequest;
const { data: bootstrap, refresh: refreshBootstrap } = bootstrapRequest;

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
