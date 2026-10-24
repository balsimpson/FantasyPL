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

      <HomePlayerDiscovery
        :players="bootstrap?.elements || []"
        :teams="bootstrap?.teams || []"
        :fixtures="fixturesList"
        :gameweeks="shortlistGameweeks"
        :fixtures-available="!fixturesFailed && !bootstrapPending"
        :loading="bootstrapPending"
        :error="bootstrapFailed"
        @retry="retryBootstrap"
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
        :loading="bootstrapPending"
        :error="fixturesFailed"
        @retry="retryBootstrap"
      />

      <GameWeekCardNew v-if="recapGameweek" :gameweek="recapGameweek" :teams="bootstrap?.teams || []" />
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

const {
  data: bootstrap,
  pending: bootstrapPending,
  error: bootstrapRequestError,
  refresh: refreshBootstrap,
} = await useAsyncData("homepage-bootstrap", () => $fetch("/api/homepage-data"));

const hasPlayerCatalog = computed(() => Array.isArray(bootstrap.value?.elements));
const bootstrapFailed = computed(() => !bootstrapPending.value && Boolean(bootstrapRequestError.value || !hasPlayerCatalog.value));

const fixturesList = computed(() => Array.isArray(bootstrap.value?.fixtures) ? bootstrap.value.fixtures : []);
const fixturesFailed = computed(() => !bootstrapPending.value && !Array.isArray(bootstrap.value?.fixtures));
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
  await refreshBootstrap();
};

</script>
