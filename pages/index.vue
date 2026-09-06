<template>
  <div class="relative min-h-screen text-stone-50">
    <main id="main-content" class="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
      <section aria-labelledby="home-title" class="grid min-w-0 gap-x-8 gap-y-5 border-b border-white/10 pb-5 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:items-start">
          <h1 id="home-title" class="order-0 max-w-xl text-3xl font-black leading-tight tracking-[-0.03em] text-white sm:text-4xl">
            Find your next FPL player
          </h1>
          <div class="order-1 min-w-0 w-full md:order-2">
            <UFormField
              label="Search players"
              :ui="{ root: 'w-full', label: 'text-sm font-semibold text-stone-200', description: 'mt-2 text-sm text-stone-400' }"
            >
              <UInput
                id="player-search"
                v-model="playerQuery"
                type="search"
                icon="i-lucide-search"
                placeholder="Haaland"
                autocomplete="off"
                aria-controls="player-search-results"
                :aria-expanded="Boolean(playerQuery.trim() && hasPlayerCatalog && !bootstrapFailed)"
                aria-autocomplete="list"
                class="w-full"
                :ui="{
                  root: 'w-full',
                  base: 'w-full rounded-xl border border-accented bg-default h-12 text-base font-medium text-highlighted shadow-sm outline-none transition placeholder:text-muted hover:bg-elevated focus:border-primary/60 focus:ring-2 focus:ring-primary/25'
                }"
                @keydown.enter.prevent="goToFirstPlayerResult"
              />
            </UFormField>

            <div id="player-search-results" :class="{ 'mt-3': bootstrapPending || bootstrapFailed || playerQuery.trim() }" aria-live="polite">
              <p v-if="bootstrapPending" class="text-sm text-stone-400">
                Loading current player data…
              </p>

              <div v-else-if="bootstrapFailed" class="flex flex-wrap items-center gap-3 rounded-xl border border-error/25 bg-error/10 px-4 py-3">
                <p class="text-sm leading-6 text-stone-200">
                  Player search is unavailable because the current FPL data could not be loaded.
                </p>
                <UButton color="neutral" variant="outline" size="sm" @click="retryBootstrap">
                  Try again
                </UButton>
              </div>

              <div v-else-if="playerQuery.trim() && playerSearchResults.length" class="overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
                <NuxtLink
                  v-for="player in playerSearchResults"
                  :key="player.id"
                  :to="getPlayerRoute(player)"
                  class="group flex items-center justify-between gap-4 border-b border-white/10 px-4 py-3.5 text-left transition last:border-b-0 hover:bg-white/[0.06] focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                >
                  <span class="min-w-0">
                    <span class="block truncate text-base font-semibold text-white">
                      {{ player.first_name }} {{ player.second_name }}
                    </span>
                    <span class="mt-1 block truncate text-sm text-stone-400">
                      {{ player.web_name }} · {{ getTeamInfo(player.team, bootstrap)?.name || 'Team unavailable' }}
                    </span>
                  </span>
                  <UIcon name="i-lucide-arrow-up-right" class="size-4 shrink-0 text-stone-500 transition group-hover:text-primary" aria-hidden="true" />
                </NuxtLink>
              </div>

              <p v-else-if="playerQuery.trim()" class="text-sm text-stone-400">
                No players match that search. Try a surname or the name shown in FPL.
              </p>


            </div>
          </div>
        <HomeDeadlinePanel
          class="order-3 md:order-1 md:self-center"
          :deadline="nextGameweek?.deadline_time"
          :loading="bootstrapPending"
          :error="bootstrapFailed"
        />
        <HomeManagerLookup class="order-2 md:order-3" />
      </section>

      <HomePlayerDiscovery
        :players="bootstrap?.elements || []"
        :teams="bootstrap?.teams || []"
        :loading="bootstrapPending"
        :error="bootstrapFailed"
        @retry="retryBootstrap"
      />

      <HomeFixtureList
        :fixtures="fixturesList"
        :teams="bootstrap?.teams || []"
        :loading="fixturesPending"
        :error="fixturesFailed"
        @retry="retryFixtures"
      />

      <GameWeekCardNew v-if="recapGameweek" :gameweek="recapGameweek" />
    </main>
  </div>
</template>

<script setup>
import { getPlayerRoute } from "~/composables/usePlayerRoute";

definePageMeta({
  keepalive: true,
});

const canonicalUrl = useCanonicalUrl();

useHead({
  link: [{ rel: "canonical", href: canonicalUrl }],
});

useSeoMeta({
  title: "Fantasy Premier League Stats, Fixtures & Ownership",
  description:
    "Compare Fantasy Premier League player stats, fixtures, ownership, transfers, and form in one clean dashboard to make faster weekly decisions and spot trends.",
  ogTitle: "Fantasy Premier League Stats, Fixtures & Ownership | FPL Insights",
  ogDescription:
    "Track player stats, fixtures, ownership, transfers, and form with a clean FPL dashboard built for faster weekly decisions.",
  twitterTitle: "Fantasy Premier League Stats, Fixtures & Ownership | FPL Insights",
  twitterDescription:
    "Fantasy Premier League stats, fixtures, ownership, and form in one clean dashboard.",
});

const playerQuery = ref("");

const {
  data: bootstrap,
  pending: bootstrapPending,
  error: bootstrapRequestError,
  refresh: refreshBootstrap,
} = await useAsyncData("homepage-bootstrap", () => $fetch("/api/homepage-data"));

const {
  data: fixtures,
  pending: fixturesPending,
  error: fixturesRequestError,
  refresh: refreshFixtures,
} = await useLazyAsyncData("fixtures", () => $fetch("/api/fixtures"));

const hasPlayerCatalog = computed(() => Array.isArray(bootstrap.value?.elements));
const bootstrapFailed = computed(() => !bootstrapPending.value && Boolean(bootstrapRequestError.value || !hasPlayerCatalog.value));

const fixturesList = computed(() => (Array.isArray(fixtures.value) ? fixtures.value : []));
const fixturesFailed = computed(() =>
  !fixturesPending.value && Boolean(fixturesRequestError.value || !Array.isArray(fixtures.value)),
);

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

const playerSearchResults = computed(() => {
  const query = playerQuery.value.trim().toLowerCase();

  if (!query || !hasPlayerCatalog.value) return [];

  return [...bootstrap.value.elements]
    .filter((player) => {
      const searchableText = [player.first_name, player.second_name, player.web_name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    })
    .sort((a, b) => {
      const aName = `${a.first_name} ${a.second_name}`.toLowerCase();
      const bName = `${b.first_name} ${b.second_name}`.toLowerCase();
      const aStartsWith = aName.startsWith(query) || (a.web_name || "").toLowerCase().startsWith(query);
      const bStartsWith = bName.startsWith(query) || (b.web_name || "").toLowerCase().startsWith(query);

      if (aStartsWith !== bStartsWith) return aStartsWith ? -1 : 1;
      return Number(b.total_points || 0) - Number(a.total_points || 0);
    })
    .slice(0, 6);
});

const goToFirstPlayerResult = async () => {
  if (!playerSearchResults.value.length) return;
  await navigateTo(getPlayerRoute(playerSearchResults.value[0]));
};

const retryBootstrap = async () => {
  await refreshBootstrap();
};

const retryFixtures = async () => {
  await refreshFixtures();
};
</script>
