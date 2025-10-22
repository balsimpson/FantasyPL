<template>
	<div class="p-3 mx-auto w-full max-w-7xl">
		<GameWeekCard v-if="bootstrap" :gameweek="currentGameweek" />

		<div
			class="flex flex-col mt-3 bg-indigo-200 rounded-xl md:flex-row md:items-center sm:gap-x-4"
		>
			<div class="p-4">
				<div class="text-2xl text-center">
					<span class="font-semibold"
						><span class="text-purple-600">{{ nextGameweek.name }}</span>
						deadline</span
					>
				</div>
				<CountdownTimer :targetDate="nextGameweek.deadline_time" />
			</div>

			<!-- FPL Manager Stats -->
			<div class="overflow-hidden mx-auto w-full rounded-xl">
				<div class="p-4">
					<div class="sm:max-w-lg">
						<h1 class="text-4xl font-bold tracking-tight text-gray-900">
							Check Manager Stats
						</h1>
						<p class="text-xl text-gray-500">
							Check on yours or your friend's stats easily, including team and
							leagues.
						</p>
					</div>

					<form>
						<div class="flex gap-x-4 mt-1">
							<label for="manager-id" class="sr-only">Manager ID</label>
							<input
								v-model="managerID"
								id="manager-id"
								autocomplete="true"
								class="flex-auto px-3.5 py-2 min-w-0 rounded-md border ring-1 ring-inset shadow-sm ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
								placeholder="Enter Manager ID"
							/>
							<button
								@click.prevent="navigateTo(`/manager/${managerID}`)"
								class="flex-none px-3.5 py-2.5 text-sm font-semibold text-white bg-indigo-500 rounded-md shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
								:class="[
									managerID ? 'opacity-100' : 'opacity-50 pointer-events-none',
								]"
							>
								View Stats
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>

		<!-- <LeagueInfoCard /> -->

		<div>

  </div>

		<!-- section to display options when the user picks the position and specifies a budget with a slider -->
		<RecommendedPlayers />
		<!-- </div> -->

		<!-- upcoming fixtures -->
		<div v-if="fixtures && fixtures.length" class="space-y-2">
			<h1 class="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
				Upcoming
			</h1>
			<AppCarousel class="snap-x snap-mandatory">
				<LazyFixtureCard
					v-for="fixture in fixtures"
					:key="fixture.id"
					:fixture="fixture"
					:bootstrap="bootstrap"
					class="snap-start"
				/>
			</AppCarousel>
		</div>

		<div v-if="bootstrap && bootstrap.elements" class="mt-12 space-y-12">
			<!-- Most Selected -->
			<div v-if="bootstrap && bootstrap.elements" class="mt-4 w-full max-w-7xl">
				<div class="mb-6 max-w-3xl">
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
						class="flex-shrink-0 w-64 bg-gradient-to-br rounded-lg from-slate-100 to-slate-300 snap-start"
					/>
				</AppCarousel>
			</div>
			<!-- Most Transferred In -->
			<div v-if="bootstrap && bootstrap.elements" class="mt-4 w-full max-w-7xl">
				<div class="mb-6 max-w-3xl">
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
						class="flex-shrink-0 w-64 bg-gradient-to-br rounded-lg from-slate-100 to-slate-300 snap-start"
					/>
				</AppCarousel>
			</div>
			<!-- Most Transferred Out -->
			<div class="mt-4 w-full max-w-7xl">
				<div class="mb-6 max-w-3xl">
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
						class="flex-shrink-0 w-64 bg-gradient-to-br rounded-lg from-slate-100 to-slate-300 snap-start"
					/>
				</AppCarousel>
			</div>
			<!-- Top Forwards -->
			<div v-if="bootstrap && bootstrap.elements" class="mt-4 w-full max-w-7xl">
				<div class="mb-2 max-w-3xl">
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
						class="flex-shrink-0 w-64 bg-gradient-to-br rounded-lg from-slate-100 to-slate-300 snap-start"
					/>
				</AppCarousel>
			</div>
			<!-- Top Midfielders -->
			<div v-if="bootstrap && bootstrap.elements" class="mt-4 w-full max-w-7xl">
				<div class="mb-2 max-w-3xl">
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
						class="flex-shrink-0 w-64 bg-gradient-to-br rounded-lg from-slate-100 to-slate-300 snap-start"
					/>
				</AppCarousel>
			</div>
			<!-- Top Defenders -->
			<div v-if="bootstrap && bootstrap.elements" class="mt-4 w-full max-w-7xl">
				<div class="mb-2 max-w-3xl">
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
						class="flex-shrink-0 w-64 bg-gradient-to-br rounded-lg from-slate-100 to-slate-300 snap-start"
					/>
				</AppCarousel>
			</div>
			<!-- Top Goalkeepers -->
			<div v-if="bootstrap && bootstrap.elements" class="mt-4 w-full max-w-7xl">
				<div class="mb-2 max-w-3xl">
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
						class="flex-shrink-0 w-64 bg-gradient-to-br rounded-lg from-slate-100 to-slate-300 snap-start"
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
	const allFixtures = useState("allFixtures", () => []);

	const managerID = ref(null);

	// const { data: bootstrap, error } = useFetch("/api/bootstrap-static");
	// if (error.value) {
	// 	console.error("Failed to fetch bootstrap data:", error.value);
	// }

	const { data: bootstrap, error } = await useLazyAsyncData("bootstrap", () =>
		$fetch("/api/bootstrap-static")
	);

	const { data: fixtures } = await useLazyAsyncData("fixtures", () =>
		$fetch("/api/fixtures")
	);

	const { data: predictions } = useLazyFetch(`/api/predictions`);

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

				currentWeek.mostCaptainedTeam = getTeamInfo(
					most_captained_team,
					bootstrap.value
				);

				currentWeek.mostViceCaptained = `${most_vice_captained.first_name} ${most_vice_captained.second_name}`;
				currentWeek.mostViceCaptainedTeam = getTeamInfo(
					most_vice_captained_team,
					bootstrap.value
				);

				return currentWeek;
			}
		}
	});

	const nextGameweek = computed(() => {
		if (bootstrap.value && bootstrap.value.events) {
			return bootstrap.value.events.find((event) => event.is_next);
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

	onMounted(() => {
		const savedManagerId = localStorage.getItem("savedManagerId") ?? "";

		if (savedManagerId) {
			managerID.value = savedManagerId;
		}

		allPlayers.value = bootstrap.value.elements;
		allTeams.value = bootstrap.value.teams;
	});

	const playerId = '596047'



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
