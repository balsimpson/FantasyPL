<template>
	<main id="main-content" class="site-content-rail flex w-full flex-col gap-7 py-5 sm:py-7">
		<section
			aria-labelledby="watchlist-title"
			class="flex min-w-0 flex-col gap-5 border-b border-white/10 pb-5"
		>
			<div class="flex min-w-0 flex-wrap items-center justify-between gap-4">
				<div class="min-w-0">
					<h1 id="watchlist-title" class="max-w-xl text-3xl font-black leading-tight tracking-[-0.03em] text-white sm:text-4xl">
						Watchlist
					</h1>
					<p class="mt-2 max-w-xl text-sm leading-6 text-stone-300 sm:text-base">
						Compare recent returns and upcoming fixtures for the players you are considering.
					</p>
				</div>
				<UButton to="/" color="primary" icon="i-lucide-search" class="w-fit">
					Find players
				</UButton>
			</div>
			<HomeDeadlinePanel
				:gameweek="nextGameweek?.id"
				:deadline="nextGameweek?.deadline_time"
				:loading="isLoading"
				:error="Boolean(dataError)"
			/>
		</section>

		<div v-if="isLoading" class="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-live="polite">
			<p class="sr-only" role="status">Loading your saved players and current FPL data.</p>
			<USkeleton v-for="index in 3" :key="index" class="h-[34rem] rounded-2xl" />
		</div>

		<div v-else-if="dataError || !hasPlayerCatalog" class="flex flex-wrap items-center justify-between gap-4 border-y border-rose-300/20 py-6">
			<div>
				<h2 class="text-xl font-bold text-white">Player data is temporarily unavailable</h2>
				<p class="mt-2 max-w-xl text-sm leading-6 text-stone-300">
					Your saved players are safe, but the current FPL list could not be loaded.
				</p>
			</div>
			<UButton color="neutral" variant="outline" :loading="isRefreshing" @click="retryLoad">
				Try again
			</UButton>
		</div>

		<div v-else-if="!savedCodes.length" class="grid min-h-64 place-items-center border-y border-white/10 py-10 text-center">
			<div class="max-w-lg">
				<UIcon name="i-lucide-bookmark-plus" class="size-9 text-lime-300" aria-hidden="true" />
				<h2 class="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">Save players as you compare them.</h2>
				<p class="mt-3 text-sm leading-6 text-stone-300 sm:text-base">
					Your shortlist will bring their form and fixture runs together before the next deadline.
				</p>
				<UButton class="mt-5" to="/" color="primary" icon="i-lucide-search">
					Browse players
				</UButton>
			</div>
		</div>

		<div v-else-if="!savedPlayers.length" class="grid min-h-64 place-items-center border-y border-white/10 py-10 text-center">
			<div class="max-w-lg">
				<UIcon name="i-lucide-users-round" class="size-9 text-lime-300" aria-hidden="true" />
				<h2 class="mt-3 text-2xl font-bold tracking-tight text-white">No saved players are in the current FPL data.</h2>
				<p class="mt-3 text-sm leading-6 text-stone-300">
					The current player list may have changed. Search it to start a fresh shortlist.
				</p>
				<UButton class="mt-5" to="/" color="primary" icon="i-lucide-search">
					Search current players
				</UButton>
			</div>
		</div>

		<section v-else aria-labelledby="saved-players-title" class="grid min-w-0 gap-4">
			<header class="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
				<div class="min-w-0">
					<h2 id="saved-players-title" class="text-xl font-bold tracking-tight text-white">Saved players</h2>
					<p class="mt-1 text-sm text-stone-400" aria-live="polite" aria-atomic="true">
						{{ filteredPlayers.length }} of {{ savedPlayers.length }} shown · sorted by {{ activeSortLabel }}
					</p>
				</div>

				<div class="grid min-w-0 grid-cols-2 gap-2 sm:w-[22rem]">
					<UFormField label="Position" :ui="fieldUi">
						<USelect v-model="position" :items="SHORTLIST_POSITIONS" class="w-full" :ui="selectUi" />
					</UFormField>
					<UFormField label="Sort by" :ui="fieldUi">
						<USelect v-model="sortKey" :items="WATCHLIST_SORTS" class="w-full" :ui="selectUi" />
					</UFormField>
				</div>
			</header>

			<p class="text-xs leading-5 text-stone-400">
				H = home · A = away · Fixture difficulty (FDR): 1 easiest, 5 hardest.
			</p>

			<div v-if="!filteredPlayers.length" class="flex flex-wrap items-center justify-between gap-3 border-y border-white/10 py-6">
				<p class="text-sm text-stone-300">No saved players match this position.</p>
				<UButton color="neutral" variant="outline" @click="resetPosition">
					Show all positions
				</UButton>
			</div>

			<ul v-else class="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Saved player cards">
				<li v-for="player in filteredPlayers" :key="player.code" class="min-w-0">
					<PlayerWatchlistCard
						:player="player"
						:bootstrap="bootstrap"
						:sort-key="sortKey"
					/>
				</li>
			</ul>
		</section>
	</main>
</template>

<script setup lang="ts">
import { SHORTLIST_POSITIONS } from "~/utils/homepage-shortlist";
import { WATCHLIST_SORTS, useWatchlistView } from "~/composables/useWatchlistView";

const { data: bootstrap, pending, error: requestError, refresh } = await useFetch(
	"/api/bootstrap-static",
	{
		key: "watchlist-bootstrap",
		cache: "no-cache",
		// Keep this page's full snapshot independent of the shared player store.
		getCachedData: (key, nuxtApp) => nuxtApp.isHydrating ? nuxtApp.payload.data[key] : undefined,
	},
);
const { savedCodes, hasLoaded: watchlistReady } = useWatchlist();

const hasPlayerCatalog = computed(() => Array.isArray(bootstrap.value?.elements));
const dataError = computed(() => requestError.value);
const isLoading = computed(() => pending.value || !watchlistReady.value);
const savedCodeSet = computed(() => new Set(savedCodes.value));
const savedPlayers = computed(() => {
	if (!hasPlayerCatalog.value) {
		return [];
	}

	return bootstrap.value.elements.filter((player: any) => savedCodeSet.value.has(String(player.code)));
});
const { position, sortKey, filteredPlayers } = useWatchlistView(() => savedPlayers.value);
const nextGameweek = computed(() => bootstrap.value?.events?.find((event: any) => event.is_next) || null);
const activeSortLabel = computed(() => WATCHLIST_SORTS.find((item) => item.value === sortKey.value)?.label || "Form");
const isRefreshing = ref(false);
const fieldUi = { root: "min-w-0 w-full", label: "text-xs font-semibold text-stone-300" };
const selectUi = {
	base: "h-10 w-full rounded-lg border border-white/15 bg-black/25 text-sm font-semibold text-stone-100 focus-visible:border-lime-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-300/50 [color-scheme:dark]",
};

const resetPosition = () => {
	position.value = 0;
};

const retryLoad = async () => {
	if (isRefreshing.value) return;

	isRefreshing.value = true;

	try {
		await refresh();
	} finally {
		isRefreshing.value = false;
	}
};

useSeoMeta({
	title: "Watchlist",
	description: "Save Fantasy Premier League players and review their recent points and fixtures before the next deadline.",
	robots: "noindex,follow",
});
</script>
