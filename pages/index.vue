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
        @expired="retryBootstrap"
      />

      <HomeCaptainPicks
        :players="bootstrap?.elements || []"
        :teams="bootstrap?.teams || []"
        :loading="bootstrapPending"
        :error="bootstrapFailed"
        :gameweek="nextGameweek?.id"
        @retry="retryBootstrap"
      />

      <div ref="recommendationsTarget" class="grid min-w-0 gap-8">
      <LazyHomeTransferTargets
        :players="recommendationPlayers"
        :teams="bootstrap?.teams || []"
        :fixtures="fixturesList"
        :gameweeks="shortlistGameweeks"
        :fixtures-available="hasFixtures"
        :fixtures-loading="fixturesPending && !hasFixtures"
        :snapshot="buyRecommendationData?.snapshot"
        :generated-at="buyRecommendationData?.generatedAt"
        :source="buyRecommendationData?.source"
        :loading="bootstrapPending || catalogPending || buysPending"
        :error="bootstrapFailed || catalogFailed || Boolean(buyRecommendationError)"
        @retry="retryBuyRecommendations"
      />

      <LazyHomeTradeRecommendations
        :players="recommendationPlayers"
        :teams="bootstrap?.teams || []"
        :gameweeks="shortlistGameweeks"
        :snapshot="tradeRecommendationData?.snapshot"
        :generated-at="tradeRecommendationData?.generatedAt"
        :loading="bootstrapPending || catalogPending || tradesPending"
        :error="bootstrapFailed || catalogFailed || Boolean(tradeRecommendationError)"
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
      </div>
      </template>
    </main>
  </div>
</template>

<script setup>
import { useHomepageRecommendations } from "~/composables/useHomepageRecommendations";
import { getHomepageCaptainPicks, getShortlistGameweeks } from "~/utils/homepage-shortlist";
import { getJsonLdScript, getOrganizationSchema, getWebsiteSchema } from "~/utils/structured-data";
import { getPublicSiteOrigin } from "~/utils/site-url";

definePageMeta({
  keepalive: true,
});

const canonicalUrl = useCanonicalUrl();
const siteOrigin = getPublicSiteOrigin(useRuntimeConfig().public.SITE_URL);

useHead({
  link: [{ rel: "canonical", href: canonicalUrl }],
  script: [
    getJsonLdScript({
      "@graph": [getWebsiteSchema(siteOrigin), getOrganizationSchema(siteOrigin)],
    }),
  ],
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
if (import.meta.server && bootstrapRequest.error.value && !Array.isArray(bootstrap.value?.elements)) {
  setResponseStatus(502);
}

useHead(() => {
  const player = getHomepageCaptainPicks(bootstrap.value?.elements || []).captains[0];
  return { link: player?.code ? [{
    rel: "preload", as: "image", fetchpriority: "high",
    href: `https://resources.premierleague.com/premierleague25/photos/players/110x140/${player.code}.png`,
  }] : [] };
});

const {
  target: recommendationsTarget, recommendationPlayers, catalogPending, catalogFailed,
  fixtureData, fixturesStatus, fixturesRequestError, refreshFixtures,
  tradeRecommendationData, tradeRecommendationError, tradesPending, retryTradeRecommendations,
  buyRecommendationData, buyRecommendationError, buysPending, retryBuyRecommendations,
} = useHomepageRecommendations();

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
