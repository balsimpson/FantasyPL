<template>
	<div class="w-full max-w-5xl p-3 mx-auto">
		<NuxtLink
			to="/"
			class="flex items-center text-2xl font-extrabold tracking-tight text-[#4B0082] transition duration-200 ease-in-out hover:text-gray-600"
		>
			<!-- <img src="/favicon.ico" alt="" class="w-8 pr-2" /> -->
			Fantasy<span class="text-[#7300c5]">PL</span>
		</NuxtLink>

		
		<GameWeekCard v-if="bootstrap" :gameweek="currentGameweek" />
		

		<div class="mt-6 text-2xl text-center"><span class="font-semibold">{{nextGameweek.name}}</span> starts <span class="font-bold text-teal-500">{{ getRemainingTime(nextGameweek.deadline_time) }}</span></div>

		<!-- section to display options when the user picks the position and specifies a budget with a slider -->
		<RecommendedPlayers />
		<!-- </div> -->

		<div v-if="bootstrap && bootstrap.elements" class="mt-12 space-y-12">
			<!-- Most Selected -->
			<div v-if="bootstrap && bootstrap.elements" class="w-full max-w-5xl mt-4">
				<div class="max-w-3xl mb-6">
					<h1
						class="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl"
					>
						Most Selected Players
					</h1>
					<!-- <p class="mt-4 text-sm text-gray-500">
						These are the rising stars, currently in high demand by managers
						looking to strengthen their squads.
					</p> -->
				</div>
				<AppCarousel>
					<LazyPlayerCardNew
						v-for="item in mostSelected"
						:key="item.id"
						:player="item"
						:data="bootstrap.teams"
						class="flex-shrink-0 w-64 rounded-lg bg-gradient-to-br from-slate-100 to-slate-300 snap-start"
					/>
				</AppCarousel>
			</div>
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
					<LazyPlayerCardNew
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
					<LazyPlayerCardNew
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
					<LazyPlayerCardNew
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
					<LazyPlayerCardNew
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
					<LazyPlayerCardNew
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
				<AppCarousel>
					<LazyPlayerCardNew
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
	// const recommendedPlayers = ref([]);

	const allPlayers = useState("allPlayers", () => []);
	const allTeams = useState("allTeams", () => []);

	// const { data: bootstrap, error } = useFetch("/api/bootstrap-static");
	// if (error.value) {
	// 	console.error("Failed to fetch bootstrap data:", error.value);
	// }

	const { data: bootstrap, error } = await useAsyncData("bootstrap", () =>
		$fetch("/api/bootstrap-static")
	);
	allPlayers.value = bootstrap.value.elements;
	allTeams.value = bootstrap.value.teams;

	const currentGameweek = computed(() => {
		if (bootstrap.value && bootstrap.value.events) {
			let currentWeek = bootstrap.value.events.find(
				(event) => event.is_current
			);

			if (currentWeek) {
				let most_captained = getPlayerInfo(
					currentWeek.most_captained,
					bootstrap.value
				);
				let most_captained_team = most_captained.team;
				let most_vice_captained = getPlayerInfo(
					currentWeek.most_vice_captained,
					bootstrap.value
				);
				let most_vice_captained_team = most_vice_captained.team;

				currentWeek.mostCaptained = `${most_captained.first_name} ${most_captained.second_name}`;

				currentWeek.mostCaptainedTeam = getTeamInfo(most_captained_team, bootstrap.value);
				
				currentWeek.mostViceCaptained = `${most_vice_captained.first_name} ${most_vice_captained.second_name}`;
				currentWeek.mostViceCaptainedTeam = getTeamInfo(most_vice_captained_team, bootstrap.value);
				
				return currentWeek;
			}
		}
	});

	const nextGameweek = computed(() => {
		if (bootstrap.value && bootstrap.value.events) {
			return bootstrap.value.events.find(
				(event) => event.is_next
			);
		}
	});

	const mostSelected = computed(() => {
		if (bootstrap.value && bootstrap.value.elements) {
			return getMostSelectedPlayers(bootstrap.value.elements, 20);
		}
		return [];
	});

	const mostTransferredIn = computed(() => {
		if (bootstrap.value && bootstrap.value.elements) {
			return getMostTransferredInPlayers(bootstrap.value.elements, 20);
		}
		return [];
	});

	const mostTransferredOut = computed(() => {
		if (bootstrap.value && bootstrap.value.elements) {
			return getMostTransferredOutPlayers(bootstrap.value.elements, 20);
		}
		return [];
	});

	// const allPlayers = computed(() => {
	// 	return bootstrap.value.elements;
	// });

	// const recommendedPlayers = computed(() => {
	// console.log("Computing recommendedPlayers");
	// console.log("allPlayers:", allPlayers.value.length);
	// console.log("selectedPosition:", selectedPosition.value);
	// console.log("selectedBudget:", selectedBudget.value);
	// return getRecommendedTopPlayers(
	// 	allPlayers.value,
	// 	selectedPosition.value,
	// 	5,
	// 	selectedBudget.value
	// );
	// });

	// watch(
	// 	recommendedPlayers,
	// 	(newValue) => {
	// 		console.log("recommendedPlayers changed:", newValue.length);
	// 	},
	// 	{ deep: true }
	// );

	// const recommendPlayers = () => {
	// 	if (bootstrap.value && bootstrap.value.elements) {
	// 		let filtered = bootstrap.value.elements.filter((p) => {
	// 			console.log("p", p.now_cost, selectedBudget.value * 10, selectedPosition.value, p.element_type);
	// 			if (
	// 				p.element_type == selectedPosition.value &&
	// 				p.now_cost <= selectedBudget.value * 10
	// 			) {
	// 				console.log('select', p);
	// 				return p;
	// 			} else {
	// 				// console.log("element_type", p.element_type, selectedPosition.value)
	// 				// console.log("budget", p.now_cost, selectedBudget.value * 10)
	// 				// console.log('else', p.element_type == selectedPosition.value, p.now_cost <= selectedBudget.value * 10);
	// 			}

	// 			// return (
	// 			// 	(selectedPosition.value
	// 			// 		? p.element_type === selectedPosition.value
	// 			// 		: true) && p.now_cost < selectedBudget.value * 10
	// 			// );
	// 		});
	// 		// 	filteredPlayers = players.filter((p) => {
	// 		// 		// console.log("p", p.now_cost);
	// 		// 		console.log("budget", p.now_cost <= budget * 10);
	// 		// 		return (position ? p.element_type === position : true) &&
	// 		// 			p.now_cost <= budget * 10; // Convert budget from millions to FPL's cost unit (usually in tenths of millions)
	// 		// 	});

	// 		// return getTopPlayers(
	// 		// 	bootstrap.value.elements,
	// 		// 	selectedPosition.value,
	// 		// 	20,
	// 		// 	selectedBudget.value
	// 		// );
	// 		recommendedPlayers.value = filtered
	// 		console.log("recommendedPlayers", recommendedPlayers.value);
	// 		// return filtered;
	// 	}
	// 	recommendedPlayers.value = [];
	// };

	// watchEffect(() => {
	// 	if (bootstrap.value && bootstrap.value.elements) {
	// 		let results = getTopPlayers(
	// 			allPlayers.value,
	// 			selectedPosition.value,
	// 			5,
	// 			selectedBudget.value
	// 		);

	// 		console.log("results", results.length);
	// 		recommendedPlayers.value = results;
	// 	}
	// 	console.log("effect", selectedPosition.value);
	// 	// recommendedPlayers.value = [];
	// });

	// const recommendedPlayers = computed(() => {
	// 	if (bootstrap.value && bootstrap.value.elements) {
	// 		let filtered = bootstrap.value.elements.filter((p) => {
	// 			console.log("p", p.now_cost, selectedBudget.value * 10, selectedPosition.value, p.element_type);
	// 			if (
	// 				p.element_type === selectedPosition.value &&
	// 				p.now_cost <= selectedBudget.value * 10
	// 			) {
	// 				console.log('select', p);
	// 				return p;
	// 			} else {
	// 				console.log("element_type", p.element_type, selectedPosition.value)
	// 				console.log("budget", p.now_cost, selectedBudget.value * 10)
	// 				console.log('else', p.element_type == selectedPosition.value, p.now_cost <= selectedBudget.value * 10);
	// 			}

	// 			// return (
	// 			// 	(selectedPosition.value
	// 			// 		? p.element_type === selectedPosition.value
	// 			// 		: true) && p.now_cost < selectedBudget.value * 10
	// 			// );
	// 		});
	// 		// 	filteredPlayers = players.filter((p) => {
	// 		// 		// console.log("p", p.now_cost);
	// 		// 		console.log("budget", p.now_cost <= budget * 10);
	// 		// 		return (position ? p.element_type === position : true) &&
	// 		// 			p.now_cost <= budget * 10; // Convert budget from millions to FPL's cost unit (usually in tenths of millions)
	// 		// 	});

	// 		// return getTopPlayers(
	// 		// 	bootstrap.value.elements,
	// 		// 	selectedPosition.value,
	// 		// 	20,
	// 		// 	selectedBudget.value
	// 		// );
	// 		console.log("filtered", filtered);
	// 		return filtered;
	// 	}
	// 	return [];
	// });
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
