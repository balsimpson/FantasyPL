<template>
	<div class="w-full max-w-5xl p-3 mx-auto">
		<NuxtLink
			to="/"
			class="flex items-center text-2xl font-extrabold tracking-tight text-[#4B0082] transition duration-200 ease-in-out hover:text-gray-600"
		>
			<!-- <img src="/favicon.ico" alt="" class="w-8 pr-2" /> -->
			Fantasy<span class="text-[#7300c5]">PL</span>
		</NuxtLink>

		<div v-if="bootstrap && bootstrap.elements" class="space-y-12">
			<!-- Most Transferred In -->
			<div v-if="bootstrap && bootstrap.elements" class="w-full max-w-5xl mt-4">
				<div class="max-w-3xl mb-6">
					<h1
						class="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl"
					>
						Most Transferred In Players
					</h1>
					<p class="mt-4 text-sm text-gray-500">
						These are the rising stars, currently in high demand by managers
						looking to strengthen their squads.
					</p>
				</div>
				<AppCarousel>
					<PlayerCardNew
						v-for="item in mostTransferredIn"
						:key="item.id"
						:player="item"
						:data="bootstrap.teams"
						class="flex-shrink-0 w-64 rounded-lg bg-gradient-to-br from-slate-100 to-slate-300 snap-start"
					/>
				</AppCarousel>
			</div>
			<!-- Most Transferred Out -->
			<div class="w-full max-w-5xl mt-4">
				<div class="max-w-3xl mb-6">
					<h1
						class="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl"
					>
						Most Transferred Out Players
					</h1>
					<p class="mt-4 text-sm text-gray-500">
						These are the players managers are dropping, often due to injuries,
						poor form, or tough upcoming fixtures.
					</p>
				</div>
				<AppCarousel>
					<PlayerCardNew
						v-for="item in mostTransferredOut"
						:key="item.id"
						:player="item"
						:data="bootstrap.teams"
						class="flex-shrink-0 w-64 rounded-lg bg-gradient-to-br from-slate-100 to-slate-300 snap-start"
					/>
				</AppCarousel>
			</div>
			<!-- Top Forwards -->
			<div v-if="bootstrap && bootstrap.elements" class="w-full max-w-5xl mt-4">
				<div class="max-w-3xl mb-2">
					<h1
						class="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl"
					>
						Top Forwards
					</h1>
				</div>
				<AppCarousel v-if="bootstrap && bootstrap.elements">
					<PlayerCardNew
						v-for="item in getTopPlayers(bootstrap.elements, 4, 20)"
						:key="item"
						:player="item"
						:data="bootstrap.teams"
						class="flex-shrink-0 w-64 rounded-lg bg-gradient-to-br from-slate-100 to-slate-300 snap-start"
					/>
				</AppCarousel>
			</div>
			<!-- Top Midfielders -->
			<div v-if="bootstrap && bootstrap.elements" class="w-full max-w-5xl mt-4">
				<div class="max-w-3xl mb-2">
					<h1
						class="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl"
					>
						Top Midfielders
					</h1>
				</div>
				<AppCarousel v-if="bootstrap && bootstrap.elements">
					<PlayerCardNew
						v-for="item in getTopPlayers(bootstrap.elements, 3, 20)"
						:key="item"
						:player="item"
						:data="bootstrap.teams"
						class="flex-shrink-0 w-64 rounded-lg bg-gradient-to-br from-slate-100 to-slate-300 snap-start"
					/>
				</AppCarousel>
			</div>
			<!-- Top Defenders -->
			<div v-if="bootstrap && bootstrap.elements" class="w-full max-w-5xl mt-4">
				<div class="max-w-3xl mb-2">
					<h1
						class="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl"
					>
						Top Defenders
					</h1>
				</div>
				<AppCarousel>
					<PlayerCardNew
						v-for="item in getTopPlayers(bootstrap.elements, 2, 20)"
						:key="item"
						:player="item"
						:data="bootstrap.teams"
						class="flex-shrink-0 w-64 rounded-lg bg-gradient-to-br from-slate-100 to-slate-300 snap-start"
					/>
				</AppCarousel>
			</div>
			<!-- Top Goalkeepers -->
			<div v-if="bootstrap && bootstrap.elements" class="w-full max-w-5xl mt-4">
				<div class="max-w-3xl mb-2">
					<h1
						class="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl"
					>
						Top Goalkeepers
					</h1>
				</div>
				<AppCarousel >
					<PlayerCardNew
						v-for="item in getTopPlayers(bootstrap.elements, 1, 20)"
						:key="item"
						:player="item"
						:data="bootstrap.teams"
						class="flex-shrink-0 w-64 rounded-lg bg-gradient-to-br from-slate-100 to-slate-300 snap-start"
					/>
				</AppCarousel>
			</div>
		</div>
	</div>
</template>

<script setup>
	const selectedPosition = ref(1);
	const topPlayers = ref([]);

	// const store = useState("store", () => ({}));

	// const { data: bootstrap, error } = useFetch("/api/bootstrap-static");
	// if (error.value) {
	// 	console.error("Failed to fetch bootstrap data:", error.value);
	// }

	const { data: bootstrap, error } = await useAsyncData("bootstrap", () =>
		$fetch("/api/bootstrap-static")
	);

	const mostTransferredIn = computed(() => {
		if (bootstrap.value && bootstrap.value.elements) {
			return getMostTransferredInPlayers(bootstrap.value.elements, 5);
		}
		return [];
	});

	const mostTransferredOut = computed(() => {
		if (bootstrap.value && bootstrap.value.elements) {
			return getMostTransferredOutPlayers(bootstrap.value.elements, 5);
		}
		return [];
	});
</script>

<style>
	.PlayerCard {
		height: 100%; /* Make sure the card takes up the full height of its container */
	}

	.PlayerCard-content {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		height: 300px; /* Set a fixed height for the card content */
	}

	.PlayerCard-content h1,
	.PlayerCard-content p {
		margin-bottom: auto; /* Ensure text does not push the height */
	}
</style>
