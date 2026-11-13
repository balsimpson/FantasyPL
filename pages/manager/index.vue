<template>
  <main id="main-content" class="site-content-rail grid w-full gap-7 py-6 sm:gap-9 sm:py-10">
    <HomeTeamPlanner landing :gameweek="gameweek" :players="players" />
    <ManagerLandingHighlights :gameweek="gameweek" :differentials="picks.differentials" :overview-ready="overviewStatus === 'success' || overviewStatus === 'error'" />
  </main>
</template>

<script setup lang="ts">
import HomeTeamPlanner from "~/components/HomeTeamPlanner.vue";
import ManagerLandingHighlights from "~/components/ManagerLandingHighlights.vue";
import { getHomepageCaptainPicks, type ShortlistPlayer } from "~/utils/homepage-shortlist";

const canonicalUrl = useCanonicalUrl("/manager");
const title = "FPL Team Planner & Manager Lookup";
const description = "Enter your Fantasy Premier League Team ID to see your squad, plan for the next five gameweeks, and compare suggested lineups and transfers.";
const imageAlt = "FPL Team Planner with a football pitch showing an eleven-player lineup";
useHead({ link: [{ rel: "canonical", href: canonicalUrl }] });
useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogUrl: canonicalUrl,
  ogImageAlt: imageAlt,
  twitterCard: "summary_large_image",
  twitterTitle: title,
  twitterDescription: description,
  twitterImageAlt: imageAlt,
});
defineOgImageComponent("ManagerPlanner", {}, { width: 1200, height: 630, extension: "png", alt: imageAlt });

const { data, status: overviewStatus } = useLazyFetch<{
  events: { id: number; is_next: boolean }[];
  elements: ShortlistPlayer[];
}>("/api/homepage-overview", { server: false, retry: 0 });
const gameweek = computed(() => data.value?.events.find((event) => event.is_next)?.id);
const picks = computed(() => getHomepageCaptainPicks(data.value?.elements ?? []));
const players = computed(() => picks.value.captains.slice(0, 3));
</script>
