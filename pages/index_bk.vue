<template>
	<!-- <pre>{{ getDetailedGameweekStats(bootstrap, "current") }}</pre> -->
	<!-- <pre>{{ getDetailedGameweekStats(bootstrap, "current") }}</pre> -->
	<!-- <pre>{{ getDetailedGameweekStats(bootstrap, "next") }}</pre> -->

	<!-- <div class="p-4 bg-gray-100 rounded-lg shadow-md">
		<h2 class="text-xl font-bold text-gray-800">
			Gameweek {{ currentGameweek.id }} Stats
		</h2>

		<div class="flex mt-4 space-x-4">
			<div class="flex-1">
				<img
					:src="playerImage(mostCaptainedPlayer)"
					alt="Most Captained"
					class="w-16 h-16 rounded-full"
				/>
				<p class="mt-2 text-sm text-center">
					Most Captained: {{ mostCaptainedPlayer.web_name }}
				</p>
			</div>

			<div class="flex-1">
				<img
					:src="playerImage(mostViceCaptainedPlayer)"
					alt="Most Vice-Captained"
					class="w-16 h-16 rounded-full"
				/>
				<p class="mt-2 text-sm text-center">
					Most Vice-Captained: {{ mostViceCaptainedPlayer.web_name }}
				</p>
			</div>

			<div class="flex-1">
				<img
					:src="teamImage(topTeam)"
					alt="Top Team"
					class="w-16 h-16 rounded-full"
				/>
				<p class="mt-2 text-sm text-center">Top Team: {{ topTeam.name }}</p>
			</div>
		</div>

		<p class="mt-4 text-sm text-center">
			Top Player Points: {{ topPlayerPoints }}
		</p>
	</div> -->

	<!-- <div>store: {{ store }}</div> -->

	<GameWeekCard
		v-if="bootstrap"
		:gameweek="getGameweekData('current', bootstrap)"
	/>

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

	<!-- <pre>{{ bootstrap }}</pre> -->

	<!-- <pre>{{ getTopPlayers(store.elements, 1, 5) }}</pre> -->

	<div v-if="store && store.elements" class="w-full max-w-3xl mx-auto">
		<div class="max-w-3xl px-6 mb-6">
			<h1 class="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
				Most Transferred In Players
			</h1>
			<p class="mt-4 text-xl text-gray-500">
				These are the players who have been added to the most Fantasy Premier
				League teams this week. They're the rising stars, currently in high
				demand by managers looking to strengthen their squads.
			</p>
		</div>
		<div class="grid grid-cols-2 gap-3 p-2">
			<PlayerCard
				v-for="item in getMostTransferredInPlayers(store.elements, 6)"
				:key="item"
				:player="item"
			/>
		</div>
	</div>

	<div v-if="store && store.elements" class="w-full max-w-3xl mx-auto mt-6">
		<div class="max-w-3xl px-6 mb-6 text-center">
			<h1 class="text-2xl font-bold tracking-tight text-gray-900 sm:text-4xl">
				Most Transferred Out Players
			</h1>
			<p class="mt-2 text-xl text-gray-500">
				These are the players managers are dropping, often due to injuries, poor
				form, or tough upcoming fixtures.
			</p>
		</div>
		<div class="grid grid-cols-2 gap-3 p-2">
			<PlayerCard
				v-for="item in getMostTransferredOutPlayers(store.elements, 6)"
				:key="item"
				:player="item"
			/>
		</div>
	</div>

	<div v-if="store && store.elements" class="w-full max-w-3xl mx-auto mt-6">
		<div class="max-w-3xl px-6 mb-6 text-center">
			<h1 class="text-2xl font-bold tracking-tight text-gray-900 sm:text-4xl">
				Top Players
			</h1>
			<p class="mt-2 text-xl text-gray-500">
				These are the players managers are dropping, often due to injuries, poor
				form, or tough upcoming fixtures.
			</p>

			<!-- dropdown to select position -->
			<div class="flex justify-center mt-4">
				<select
					v-model="selectedPosition"
					class="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					<option value="1">Forward</option>
					<option value="2">Midfielder</option>
					<option value="3">Defender</option>
					<option value="4">Goalkeeper</option>
				</select>
			</div>
		</div>
		<div class="grid grid-cols-2 gap-3 p-2">
			<PlayerCard v-for="item in topPlayers" :key="item" :player="item" />
		</div>
	</div>

	<!-- <div>{{ topTeams }}</div> -->

	<!-- <div>{{ bootstrap.events }}</div> -->
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

	// watchEffect(() => {
	// 	if (store.value) {
	// 		topPlayers.value = getTopPlayers(
	// 			store.value.elements,
	// 			selectedPosition.value,
	// 			5
	// 		);
	// 	}
	// });

	// const currentGameweek = computed(() => {
	// 	return bootstrap.value.events.find((gw) => gw.is_current === true);
	// });

	// const nextGameweek = computed(() => {
	// 	return bootstrap.value.events.find((gw) => gw.is_next === true);
	// });

	// const previousGameweek = computed(() => {
	// 	return bootstrap.value.events.find((gw) => gw.is_previous === true);
	// });

	const currentGameweek = () => {
		let gameweek = bootstrap.value.events.find((gw) => gw.is_current === true);

		console.log("gameweek", gameweek);

		if (gameweek) {
			gameweek.value.mostCaptainedPlayer = bootstrap.value.elements.find(
				(player) => {
					console.log("gameweek", gameweek.value);
					// player.id === gameweek.value.most_captained
					return player.id === gameweek.value.most_captained;
				}
			);
			return gameweek;
		}
		return;
	};

	const mostCaptainedPlayer = computed(() => {
		return bootstrap.value.elements.find(
			(player) => player.id === currentGameweek.value.most_captained
		);
	});

	const mostViceCaptainedPlayer = computed(() => {
		return bootstrap.value.elements.find(
			(player) => player.id === currentGameweek.value.most_vice_captained
		);
	});

	const topPlayerPoints = computed(() => {
		return bootstrap.value.elements.find(
			(player) => player.id === currentGameweek.value.top_element
		).total_points;
	});

	const topTeam = computed(() => {
		return bootstrap.value.teams.find(
			(team) => team.id === mostCaptainedPlayer.value.team
		);
	});

	const topTeams = computed(() => {
		return getTopTeams(bootstrap.value.teams, 5);
	});

	function calculateTeamScore(team) {
		// Calculate a weighted score based on important attributes
		return (
			team.strength_overall_home * 0.3 + // 30% weight to overall home strength
			team.strength_overall_away * 0.3 + // 30% weight to overall away strength
			team.strength_attack_home * 0.1 + // 10% weight to attack home
			team.strength_attack_away * 0.1 + // 10% weight to attack away
			team.strength_defence_home * 0.1 + // 10% weight to defense home
			team.strength_defence_away * 0.1 // 10% weight to defense away
		);
	}

	function getTopTeams(teams, topN = 5) {
		// Add a score property to each team based on their calculated score
		teams.forEach((team) => {
			team.score = calculateTeamScore(team);
		});

		// Sort teams based on their score in descending order
		const sortedTeams = teams.sort((a, b) => b.score - a.score);

		// Pick the top N teams
		return sortedTeams.slice(0, topN);
	}

	// comparison charts
	function normalizeValue(value, max) {
		return (value / max) * 100;
	}

	function calculateComparisonData(team) {
		const maxStrength = 1500;

		const overallHome = normalizeValue(team.strength_overall_home, maxStrength);
		const overallAway = normalizeValue(team.strength_overall_away, maxStrength);
		const attackHome = normalizeValue(team.strength_attack_home, maxStrength);
		const attackAway = normalizeValue(team.strength_attack_away, maxStrength);
		const defenceHome = normalizeValue(team.strength_defence_home, maxStrength);
		const defenceAway = normalizeValue(team.strength_defence_away, maxStrength);

		const overallDiff = team.strength_overall_home - team.strength_overall_away;
		const attackDiff = team.strength_attack_home - team.strength_attack_away;
		const defenceDiff = team.strength_defence_home - team.strength_defence_away;

		return {
			overallHome,
			overallAway,
			attackHome,
			attackAway,
			defenceHome,
			defenceAway,
			overallDiff,
			attackDiff,
			defenceDiff,
		};
	}

	const playerImage = (player) =>
		`https://resources.premierleague.com/premierleague/photos/players/110x140/p${player.code}.png`;
	const teamImage = (team) =>
		`https://resources.premierleague.com/premierleague/badges/t${team.code}.png`;

	/**
	 * Retrieves player information by player ID.
	 *
	 * @param {Object} data - The bootstrap-static JSON data from FPL API.
	 * @param {Number} playerId - The ID of the player.
	 * @returns {Object|null} - Returns the player object or null if not found.
	 */
	function getPlayerInfoById(data = bootstrap.value, playerId) {
		if (!data || !data.elements) {
			console.error("Invalid data provided.");
			return null;
		}

		return data.elements.find((player) => player.id === playerId) || null;
	}

	/**
	 * Retrieves team information by team ID.
	 *
	 * @param {Object} data - The bootstrap-static JSON data from FPL API.
	 * @param {Number} teamId - The ID of the team.
	 * @returns {Object|null} - Returns the team object or null if not found.
	 */
	function getTeamInfoById(data = bootstrap.value, teamId) {
		if (!data || !data.teams) {
			console.error("Invalid data provided.");
			return null;
		}

		return data.teams.find((team) => team.id === teamId) || null;
	}

	/**
	 * Retrieves detailed gameweek statistics including most captained and vice-captained players.
	 *
	 * @param {Object} data - The bootstrap-static JSON data from FPL API.
	 * @param {String|Number} type - Can be 'current', 'next', 'previous', or a specific gameweek ID (number).
	 * @returns {Object|null} - Returns an object containing detailed gameweek stats or null if not found.
	 */
	function getDetailedGameweekStats(data = bootstrap.value, type) {
		const gameweek = getGameweekData(data, type);

		if (!gameweek) {
			console.error("Gameweek data not found.");
			return null;
		}

		const mostCaptainedPlayer = getPlayerInfoById(
			data,
			gameweek.most_captained
		);
		const mostViceCaptainedPlayer = getPlayerInfoById(
			data,
			gameweek.most_vice_captained
		);
		const topTeam = getTeamInfoById(data, gameweek.top_element_info?.team);

		let gameweekDetails = gameweek;
		gameweekDetails.mostCaptainedPlayer = mostCaptainedPlayer;
		gameweekDetails.mostViceCaptainedPlayer = mostViceCaptainedPlayer;
		gameweekDetails.topTeam = topTeam;
		gameweekDetails.topPlayerPoints = gameweek.top_element_info?.points || null;

		console.log("gameweekDetails", gameweekDetails);

		return gameweekDetails;
	}
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
