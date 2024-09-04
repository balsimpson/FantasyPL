<template>
	<!-- <div>Player {{ id }}</div> -->
	<!-- <pre>{{ bootstrap.teams }}</pre> -->
	<div
		v-if="player && player.fixtures && bootstrap"
		class="w-full p-4"
	>
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
						<p class="text-sm uppercase text-slate-400">
							{{ formatDate(history.kickoff_time) }}
						</p>
					</div>
				</div>
			</div>

			<!-- past seasons -->
			<div class="mt-6">
				<h2 class="mb-2 text-2xl font-semibold text-gray-700">Past Seasons</h2>
				<div
					class="grid grid-cols-1 gap-2 max-h-[340px] overflow-scroll snap-y scroll-smooth snap-mandatory"
				>
					<PlayerSeasonCard
						v-for="season in player.history_past.slice().reverse()"
						:season="season"
					/>
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
