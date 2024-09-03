<template>
	<!-- <div>Player {{ id }}</div> -->
	<!-- <pre>{{ bootstrap.teams }}</pre> -->
	<div
		v-if="player && player.fixtures && bootstrap"
		class="w-full min-h-screen p-4 bg-gray-100"
	>
		<NuxtLink
			to="/"
			class="flex items-center text-2xl font-extrabold tracking-tight text-[#4B0082] transition duration-200 ease-in-out hover:text-gray-600"
		>
			<!-- <img src="/favicon.ico" alt="" class="w-8 pr-2" /> -->
			Fantasy<span class="text-[#7300c5]">PL</span>
		</NuxtLink>
		<div class="max-w-4xl mx-auto mt-6">
			<div class="w-full bg-gray-300 rounded-lg">
				<PlayerPerformanceCard :player="playerData" />
			</div>

			<!-- fixtures -->
			<div v-if="player.fixtures && bootstrap" class="my-8">
				<!-- <pre>{{ player.fixtures }}</pre> -->
				<h2 class="mb-2 text-2xl font-semibold text-gray-700">
					Upcoming Fixtures
				</h2>
				<div
					class="grid grid-cols-1 gap-2 max-h-[340px] overflow-scroll snap-y scroll-smooth snap-mandatory"
				>
					<PlayerFixtureCard
						v-for="fixture in player.fixtures"
						:key="fixture.id"
						:fixture="fixture"
						:bootstrap="bootstrap"
					/>
				</div>
			</div>

			<!-- history -->
			<div>
				<h2 class="mb-2 text-2xl font-semibold text-gray-700">
					Player History
				</h2>
				<div
					class="grid grid-cols-1 gap-2 max-h-[340px] overflow-scroll snap-y scroll-smooth snap-mandatory"
				>
					<div
						v-for="history in player.history"
						:key="history.fixture"
						class="p-4 bg-white rounded-lg shadow"
					>
						<div class="flex items-start justify-between gap-4">
							<div>
								<h3 class="text-sm font-semibold uppercase text-slate-400">
									Fixture {{ history.fixture }}
								</h3>
								<p class="text-sm uppercase text-slate-400">
									{{ formatDate(history.kickoff_time) }}
								</p>
								<p class="flex items-center mt-2 text-gray-600">
									<img
										:src="`https://resources.premierleague.com/premierleague/badges/t${
											getTeamInfo(history.opponent_team, bootstrap).code
										}.png`"
										alt=""
										class="w-6 pr-1 sm:z-0 sm:top-1 sm:right-1 bottom-1"
									/>

									<span class="pl-1 font-bold">
										{{ getTeamInfo(history.opponent_team, bootstrap).name }}
									</span>
								</p>
							</div>
							<div class="flex items-start gap-4">
								<div class="flex flex-col items-center">
									<div class="text-xs text-center uppercase text-slate-400">
										scored
									</div>
									<div
										class="flex items-center justify-center w-10 h-10 rounded text-slate-600 bg-slate-200"
									>
										<div class="font-bold">{{ history.total_points }}</div>
									</div>
									<div class="text-xs text-center uppercase text-slate-400">
										points
									</div>
								</div>
								<div class="flex flex-col items-center">
									<div class="text-xs text-center uppercase text-slate-400">
										played
									</div>
									<div
										class="flex flex-col items-center justify-center w-auto h-10 p-3 rounded text-slate-600 bg-slate-200"
									>
										<div class="font-bold">{{ history.minutes }}</div>
									</div>
									<div class="text-xs text-center uppercase text-slate-400">
										minutes
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- past seasons -->
			<div class="mt-6">
				<h2 class="mb-2 text-2xl font-semibold text-gray-700">Past Seasons</h2>
				<div
					class="grid grid-cols-1 gap-2 max-h-[340px] overflow-scroll snap-y scroll-smooth snap-mandatory"
				>
					<div
						v-for="season in player.history_past.slice().reverse()"
						:key="season.season_name"
						class="p-4 bg-white rounded-lg shadow"
					>
						<h3 class="mb-2 text-xl font-semibold uppercase text-slate-500">
							{{ season.season_name }}
						</h3>
						<div class="flex items-start justify-between">
							<div class="flex items-end justify-between w-full gap-4">
								<div>
									<div
										class="text-xs font-semibold leading-3 text-center uppercase text-slate-500"
									>
										Start Cost
									</div>
									<div class="text-xl font-bold text-center">
										{{ season.start_cost / 10 }}m
									</div>
								</div>
								<div>
									<div
										class="text-xs font-semibold leading-3 text-center uppercase text-slate-500"
									>
										End Cost
									</div>
									<div class="text-xl font-bold text-center">
										{{ season.end_cost / 10 }}m
									</div>
								</div>
								<div>
									<div
										class="text-xs font-semibold leading-3 text-center uppercase text-slate-500"
									>
										Points
									</div>
									<div class="text-xl font-bold text-center">
										{{ season.total_points }}
									</div>
								</div>
								<div>
									<div
										class="text-xs font-semibold leading-3 text-center uppercase text-slate-500"
									>
										Minutes
									</div>
									<div class="text-xl font-bold text-center">
										{{ season.minutes }}
									</div>
								</div>
								<div>
									<div
										class="text-xs font-semibold leading-3 text-center uppercase text-slate-500"
									>
										Goals
									</div>
									<div class="text-xl font-bold text-center">
										{{ season.goals_scored }}
									</div>
								</div>
							</div>
						</div>
						<!-- <div>
							<div class="flex">
								<div>
									<div>Assists</div>
									<div>{{ season.assists }}</div>
								</div>
								<div>
									<div>Clean Sheets</div>
									<div>{{ season.clean_sheets }}</div>
								</div>
								<div>
									<div>Goals Conceded</div>
									<div>{{ season.goals_conceded }}</div>
								</div>
								<div>
									<div>Yellow Cards</div>
									<div>{{ season.yellow_cards }}</div>
								</div>
								<div>
									<div>Red Cards</div>
									<div>{{ season.red_cards }}</div>
								</div>
							</div>
						</div> -->
					</div>
				</div>
			</div>

			<!-- <pre>{{ player.history_past }}</pre> -->
		</div>
	</div>
</template>

<script setup>
	const route = useRoute();
	const id = route.params.id;

	const { data: player } = useFetch(`/api/players/${id}`);
	const { data: bootstrap } = useFetch("/api/bootstrap-static");
	// const { data: fixtures } = useLazyFetch("/api/fixtures");

	const playerData = computed(() => {
		if (bootstrap.value) {
			const player = bootstrap.value.elements.find((player) => player.id == id);
			player.teamData = bootstrap.value.teams.find(
				(team) => team.id == player.team
			);

			return player ? player : "";
		}

		return null;
	});
</script>
