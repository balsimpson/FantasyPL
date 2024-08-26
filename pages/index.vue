<template>
	<div class="w-full max-w-3xl p-3 mx-auto">
		<NuxtLink
			to="/"
			class="flex items-center text-2xl font-extrabold tracking-tight text-[#4B0082] transition duration-200 ease-in-out hover:text-gray-600"
		>
			<img src="/favicon.ico" alt="" class="w-8 pr-2" />
			Fantasy<span class="text-[#7300c5]">PL</span>
		</NuxtLink>

		<div class="space-y-12">
			<!-- Most Transferred In -->
			<div v-if="store && store.elements" class="w-full max-w-3xl mx-auto mt-4">
				<div class="max-w-3xl px-6 mb-6">
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
				<AppCarousel v-if="store && store.elements">
					<!-- <div class="flex-shrink-0 w-64 p-4 bg-gray-200 snap-start"> -->
					<PlayerCard
						v-for="item in getMostTransferredInPlayers(store.elements, 20)"
						:key="item"
						:player="item"
						class="flex-shrink-0 w-64 p-4 bg-gray-200 snap-start"
					/>
					<!-- </div> -->
				</AppCarousel>
			</div>

			<!-- Most Transferred Out -->
			<div v-if="store && store.elements" class="w-full max-w-3xl mx-auto mt-4">
				<div class="max-w-3xl px-6 mb-6">
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
				<AppCarousel v-if="store && store.elements">
					<!-- <div class="flex-shrink-0 w-64 p-4 bg-gray-200 snap-start"> -->
					<PlayerCard
						v-for="item in getMostTransferredOutPlayers(store.elements, 20)"
						:key="item"
						:player="item"
						class="flex-shrink-0 w-64 p-4 bg-gray-200 snap-start"
					/>
					<!-- </div> -->
				</AppCarousel>
			</div>

			<!-- Top Players -->
			<div v-if="store && store.elements" class="w-full max-w-3xl mx-auto mt-4">
				<div class="max-w-3xl px-6 mb-6">
					<h1
						class="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl"
					>
						Top Forwards
					</h1>
				</div>

				<AppCarousel v-if="store && store.elements">
					<!-- <div class="flex-shrink-0 w-64 p-4 bg-gray-200 snap-start"> -->
					<PlayerCard
						v-for="item in getTopPlayers(store.elements, 4, 20)"
						:key="item"
						:player="item"
						class="flex-shrink-0 w-64 p-4 bg-gray-200 snap-start"
					/>
					<!-- </div> -->
				</AppCarousel>

				<!-- <AppCarousel v-if="store && store.elements">
					<div
						v-for="player in getTopPlayers(store.elements, 4, 20)"
						class="bg-blue-100 shrink-0"
					>
						<div class="flex flex-col">
							<div class="bg-blue-200 grow">
								<h2 class="w-full text-2xl font-bold leading-5">
									{{ player.web_name }}
								</h2>
								<div class="mt-1 mb-3 text-3xl font-black text-slate-500">
									{{ player.now_cost / 10
									}}<span class="text-slate-400">m</span>
								</div> -->

				<!-- transfers -->
				<!-- <div class="w-full"> -->
				<!-- <ComparisonBar
										:comparison="{
											label: 'Transfers',
											homeWidth: inPercentage,
											homeTitle: 'In',
											homeValue: shortenNumber(player.transfers_in_event),
											awayWidth: outPercentage,
											awayTitle: 'Out',
											awayValue: shortenNumber(player.transfers_out_event),
										}"
									/> -->
				<!-- </div> -->
				<!-- </div>

							<div>
								<img
									:src="`https://resources.premierleague.com/premierleague/photos/players/110x140/p${player.code}.png`"
									class="object-cover w-full h-auto sm:z-10 sm:h-36 sm:w-auto"
									:alt="player.web_name"
								/>
							</div>
						</div>
					</div>
				</AppCarousel> -->
			</div>

			<!-- Top Players -->
			<div v-if="store && store.elements" class="w-full max-w-3xl mx-auto mt-4">
				<div class="max-w-3xl px-6 mb-6">
					<h1
						class="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl"
					>
						Top Forwards
					</h1>
				</div>

				<AppCarousel v-if="store && store.elements">
					<!-- <div class="flex-shrink-0 w-64 p-4 bg-gray-200 snap-start"> -->
					<PlayerCard
						v-for="item in getTopPlayers(store.elements, 4, 20)"
						:key="item"
						:player="item"
						class="flex-shrink-0 w-64 p-4 bg-gray-200 snap-start"
					/>
					<!-- </div> -->
				</AppCarousel>
			</div>
		</div>
	</div>
</template>

<script setup>
	const store = useState("bootstrap");
	const selectedPosition = ref(1);
	const topPlayers = ref([]);

	const {
		status,
		data: bootstrap,
		refresh,
		error,
	} = useLazyAsyncData("bootstrap", () => $fetch("/api/bootstrap-static"));
	store.value = bootstrap.value;
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
