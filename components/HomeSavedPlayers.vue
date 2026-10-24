<template>
  <section v-if="hasLoaded && savedCodes.length" aria-labelledby="saved-players-title" class="grid min-w-0 gap-4">
    <header class="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
      <h2 id="saved-players-title" class="text-2xl font-black tracking-tight text-white">Your saved players</h2>
      <UButton to="/watchlist" variant="link" color="primary" trailing-icon="i-lucide-arrow-right">Open watchlist</UButton>
    </header>
    <ul v-if="savedPlayers.length" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <li v-for="player in savedPlayers" :key="player.code" class="min-w-0">
        <NuxtLink :to="getPlayerRoute(player)" class="flex items-center justify-between gap-3 rounded-lg border border-white/10 px-4 py-3 transition hover:border-lime-300/40 focus-visible:outline-2 focus-visible:outline-lime-300">
          <span class="min-w-0"><span class="block font-semibold text-white [overflow-wrap:anywhere]">{{ player.web_name }}<PlayerAge :player="player" compact class="ml-2" /></span><span class="mt-1 flex flex-wrap items-center gap-2 text-xs text-stone-400"><span>Form {{ player.form ?? '—' }}</span><PlayerDisciplineBadges :yellow-cards="player.yellow_cards" :red-cards="player.red_cards" compact /></span></span>
          <span class="shrink-0 text-sm font-semibold tabular-nums text-lime-200">£{{ (player.now_cost / 10).toFixed(1) }}m</span>
        </NuxtLink>
      </li>
    </ul>
    <p v-else class="text-sm text-stone-300">Your saved players are not in the current player list. Open your watchlist to review them.</p>
  </section>
</template>

<script setup lang="ts">
import { getPlayerRoute } from "~/composables/usePlayerRoute";
import type { ShortlistPlayer } from "~/utils/homepage-shortlist";
const props = defineProps<{ players: ShortlistPlayer[] }>();
const { savedCodes, hasLoaded } = useWatchlist();
const savedPlayers = computed(() => {
  const saved = new Set(savedCodes.value);
  return props.players.filter((player) => saved.has(String(player.code))).slice(0, 4);
});
</script>
