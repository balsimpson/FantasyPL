<template>
  <main id="main-content" class="site-content-rail flex w-full flex-col gap-6 py-5 sm:py-7">
    <header>
      <h1 class="text-3xl font-bold tracking-tight text-white">Players</h1>
      <p class="mt-2 text-sm text-stone-300">Find a player, compare form and price, then open their stats and fixtures.</p>
    </header>
    <form class="grid w-full gap-3" @submit.prevent="submit">
      <div class="flex items-end gap-2">
        <UFormField label="Search players or clubs" class="min-w-0 flex-1" :ui="fieldUi">
          <UInput v-model="search" type="search" :maxlength="100" icon="i-lucide-search" class="w-full" :ui="{ root: 'w-full', base: 'w-full' }" />
        </UFormField>
        <UButton type="submit" color="primary" class="shrink-0">Search</UButton>
      </div>
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <UFormField label="Position" :ui="fieldUi">
          <USelect v-model="position" :items="positions" class="w-full" :ui="{ base: 'w-full' }" />
        </UFormField>
        <UFormField label="Max price" :ui="fieldUi">
          <USelect v-model="price" :items="prices" class="w-full" :ui="{ base: 'w-full' }" />
        </UFormField>
        <UFormField label="Rank by" class="col-span-2 sm:col-span-1" :ui="fieldUi">
          <USelect v-model="sort" :items="SHORTLIST_SORTS" class="w-full" :ui="{ base: 'w-full' }" />
        </UFormField>
      </div>
    </form>
    <div v-if="status === 'pending'" role="status" aria-label="Loading players" class="grid gap-3 sm:grid-cols-2">
      <USkeleton v-for="index in 6" :key="index" class="h-24" />
    </div>
    <div v-else-if="error" role="alert" class="flex flex-wrap items-center justify-between gap-3">
      <p>Player data is temporarily unavailable.</p>
      <UButton color="neutral" variant="outline" @click="refresh()">Try again</UButton>
    </div>
    <template v-else-if="data">
      <p role="status" aria-live="polite" class="text-sm text-stone-400">{{ data.total }} {{ data.total === 1 ? 'player' : 'players' }} · Page {{ data.page }} of {{ data.pages }}</p>
      <p v-if="!data.elements.length" class="py-8 text-stone-300">No players match. Try another search, position, or price cap.</p>
      <ul v-else aria-label="Players" class="grid min-w-0 gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
        <HomePlayerDiscoveryRow v-for="(player, index) in data.elements" :key="player.id" :player="player"
          :team="data.teams.find((team) => team.id === player.team)" :rank="(data.page - 1) * data.pageSize + index + 1"
          compact show-availability :metric-label="sortLabel" :metric-value="String(player[sort] ?? '—')" class="border-t border-white/10" />
      </ul>
      <nav v-if="data.pages > 1" aria-label="Player pages" class="flex items-center justify-between border-t border-white/10 pt-4">
        <UButton v-if="data.page > 1" :to="pageLink(data.page - 1)" color="neutral" variant="outline" icon="i-lucide-arrow-left">Previous</UButton>
        <span v-else />
        <UButton v-if="data.page < data.pages" :to="pageLink(data.page + 1)" color="neutral" variant="outline" trailing-icon="i-lucide-arrow-right">Next</UButton>
      </nav>
    </template>
  </main>
</template>

<script setup lang="ts">
import { usePlayerDirectory } from "~/composables/usePlayerDirectory";
import { SHORTLIST_POSITIONS, SHORTLIST_PRICE_LIMITS, SHORTLIST_SORTS } from "~/utils/homepage-shortlist";
const { request, search, position, price, sort, submit, pageLink } = usePlayerDirectory();
const { data, status, error, refresh } = await request;
const positions = SHORTLIST_POSITIONS.map((item) => ({ ...item, value: String(item.value) }));
const prices = SHORTLIST_PRICE_LIMITS.map((item) => ({ ...item, value: String(item.value) }));
const sortLabel = computed(() => SHORTLIST_SORTS.find((item) => item.value === sort.value)?.label || "Form");
const fieldUi = { root: "w-full min-w-0", label: "text-xs font-semibold text-stone-300" };
const route = useRoute();
const canonical = useCanonicalUrl(computed(() => (data.value?.page || 1) > 1 ? `/players?page=${data.value?.page}` : "/players"));
useHead({ link: [{ rel: "canonical", href: canonical }] });
useSeoMeta({
  title: "Browse FPL Players, Prices & Form",
  description: "Browse current Fantasy Premier League players. Search by name or club, filter by position and price, and compare form and points.",
  robots: () => route.query.q || route.query.position || route.query.price || route.query.sort ? "noindex, follow" : "index, follow",
});
</script>
