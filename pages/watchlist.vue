<template>
	<div class="p-4">
		<div>Watchlist</div>

        <div v-if="filteredPlayers.length">

            <pre>{{ filteredPlayers }}</pre>

            <PlayerWatchlistCard v-for="player in filteredPlayers" :key="player.code" :player="player" :bootstrap="bootstrap"/>
            
        </div>


		
	</div>
</template>

<script setup>
	const { data: bootstrap, error } = useLazyAsyncData("bootstrap", () =>
		$fetch("/api/bootstrap-static")
	);

	const watchlist = ref([]);

	onMounted(() => {
		const savedWatchlist = localStorage.getItem("savedWatchlist") ?? "";

		if (savedWatchlist) {
			watchlist.value = savedWatchlist;
		}
	});

    // get the players from bootstrap.elements and filter them by the watchlist
    const filteredPlayers = computed(() => {
        if (bootstrap.value && bootstrap.value.elements) {
            return bootstrap.value.elements.filter((player) => {
                return watchlist.value.includes(player.code);
            });
        }
        return [];
    });
</script>
