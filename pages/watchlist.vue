<template>
	<div class="relative min-h-[70vh] overflow-hidden text-stone-50">
		<section class="relative mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
			<header class="flex flex-col gap-5 border-b border-white/10 pb-8 sm:flex-row sm:items-end sm:justify-between">
				<div class="max-w-2xl">
					<p class="text-[0.68rem] font-semibold uppercase tracking-[0.34em] text-stone-400">
						Saved players
					</p>
					<h1 class="mt-3 text-4xl font-black leading-none tracking-tight text-white sm:text-6xl">
						Watchlist
					</h1>
					<p class="mt-4 text-sm leading-6 text-stone-300 sm:text-base">
						Keep the players you are weighing in one place before the next deadline.
					</p>
				</div>

				<div
					v-if="watchlistReady"
					class="w-fit rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.28em] text-stone-300"
				>
					{{ savedCodes.length }} {{ savedCodes.length === 1 ? "player" : "players" }} saved
				</div>
			</header>

			<div v-if="isLoading" class="mt-8 rounded-[28px] border border-white/10 bg-white/[0.03] p-6 sm:p-8">
				<div class="flex items-center gap-4">
					<span
						aria-hidden="true"
						class="size-7 shrink-0 animate-spin rounded-full border-2 border-white/15 border-t-primary"
					/>
					<div>
						<h2 class="text-xl font-black text-white">Loading your saved players</h2>
						<p class="mt-1 text-sm text-stone-400">Loading the current FPL player data.</p>
					</div>
				</div>
			</div>

			<div v-else-if="dataError || !hasPlayerCatalog" class="mt-8 rounded-[28px] border border-rose-300/20 bg-rose-400/10 p-6 sm:p-8">
				<h2 class="text-2xl font-black text-white">Player data is temporarily unavailable</h2>
				<p class="mt-3 max-w-xl text-sm leading-6 text-stone-300">
					We could not load the current player list, so your saved players are still safe but cannot be shown right now.
				</p>
				<UButton class="mt-5" color="neutral" variant="soft" :loading="isRefreshing" @click="retryLoad">
					Try again
				</UButton>
			</div>

			<div v-else-if="!savedCodes.length" class="mt-8 rounded-[28px] border border-white/10 bg-white/[0.03] p-6 sm:p-10">
				<p class="text-[0.68rem] font-semibold uppercase tracking-[0.32em] text-primary">Start a shortlist</p>
				<h2 class="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">Save players as you compare them.</h2>
				<p class="mt-4 max-w-xl text-sm leading-6 text-stone-300 sm:text-base">
					Open a player profile, choose Save to watchlist, and come back here before the next gameweek deadline.
				</p>
				<UButton class="mt-6" to="/" color="primary">
					Search players
				</UButton>
			</div>

			<div v-else-if="!savedPlayers.length" class="mt-8 rounded-[28px] border border-white/10 bg-white/[0.03] p-6 sm:p-10">
				<h2 class="text-2xl font-black tracking-tight text-white">No saved players are in the current FPL data.</h2>
				<p class="mt-3 max-w-xl text-sm leading-6 text-stone-300">
					The season player list may have changed. Search the current catalog to build a new shortlist.
				</p>
				<UButton class="mt-6" to="/" color="primary">
					Search current players
				</UButton>
			</div>

			<div v-else class="mt-8 grid gap-5 md:grid-cols-2">
				<PlayerWatchlistCard
					v-for="player in savedPlayers"
					:key="player.code"
					:player="player"
					:bootstrap="bootstrap"
				/>
			</div>
		</section>
	</div>
</template>

<script setup lang="ts">
const playersStore = usePlayersStore();
const { bootstrap, loading: playersLoading, error: playersError } = storeToRefs(playersStore);
const { pending, error: requestError, refresh } = await useAsyncData("watchlist-bootstrap", () =>
	playersStore.fetchPlayers(),
);
const { savedCodes, hasLoaded: watchlistReady } = useWatchlist();

const hasPlayerCatalog = computed(() => Array.isArray(bootstrap.value?.elements));
const dataError = computed(() => requestError.value || playersError.value);
const isLoading = computed(() => pending.value || playersLoading.value || !watchlistReady.value);
const savedCodeSet = computed(() => new Set(savedCodes.value));
const savedPlayers = computed(() => {
	if (!hasPlayerCatalog.value) {
		return [];
	}

	return bootstrap.value.elements.filter((player: any) => savedCodeSet.value.has(String(player.code)));
});
const isRefreshing = ref(false);

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
	description: "Save Fantasy Premier League players and review them before the next deadline.",
	robots: "noindex,follow",
});
</script>
