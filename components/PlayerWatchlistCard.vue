<template>
	<div>{{ playerData }}</div>
	<div class="grid max-w-4xl grid-cols-1 gap-6 p-4 mx-auto md:grid-cols-2">
		<!-- Player Info Card -->
		<div class="flex flex-col items-center p-6 bg-white rounded-lg shadow-md">
			<img
				:src="`/images/${player.photo}`"
				alt="Player photo"
				class="w-24 h-24 mb-4 rounded-full"
			/>
			<h2 class="text-lg font-bold">
				{{ player.first_name }} {{ player.second_name }}
			</h2>
			<p class="text-gray-500">{{ player.teamData.name }}</p>
			<p class="text-sm text-green-600">
				Status: {{ player.status === "a" ? "Available" : "Unavailable" }}
			</p>
			<p class="text-sm">Price: £{{ (player.now_cost / 10).toFixed(1) }}m</p>
		</div>

		<!-- Performance Card -->
		<div class="p-6 bg-white rounded-lg shadow-md">
			<h3 class="mb-2 text-lg font-bold">Performance</h3>
			<ul class="space-y-1 text-gray-700">
				<li>Points Per Game: {{ player.points_per_game }}</li>
				<li>Total Points: {{ player.total_points }}</li>
				<li>Goals Scored: {{ player.goals_scored }}</li>
				<li>Assists: {{ player.assists }}</li>
				<li>Minutes Played: {{ player.minutes }}</li>
			</ul>
		</div>

		<!-- Stats Card -->
		<div class="p-6 bg-white rounded-lg shadow-md">
			<h3 class="mb-2 text-lg font-bold">Statistics</h3>
			<ul class="space-y-1 text-gray-700">
				<li>Expected Goals (xG): {{ player.expected_goals }}</li>
				<li>Expected Assists (xA): {{ player.expected_assists }}</li>
				<li>Threat: {{ player.threat }}</li>
				<li>Creativity: {{ player.creativity }}</li>
				<li>Influence: {{ player.influence }}</li>
			</ul>
		</div>

		<!-- Transfers Card -->
		<div class="p-6 bg-white rounded-lg shadow-md">
			<h3 class="mb-2 text-lg font-bold">Transfers</h3>
			<ul class="space-y-1 text-gray-700">
				<li>Transfers In: {{ player.transfers_in }}</li>
				<li>Transfers Out: {{ player.transfers_out }}</li>
				<li>Selected By: {{ player.selected_by_percent }}%</li>
			</ul>
		</div>


		<div class="relative">
			<span
				role="progressbar"
				class="block bg-gray-200 rounded-full bg-gradient-to-r from-red-600 to-teal-600"
			>
				<span
					class="relative flex items-center justify-end h-6"
					:style="{ width: player.threat + '%' }"
				>
					<span class="font-bold text-white">{{ player.threat }}</span>
					<!-- Inverted Triangle Indicator -->
					<span
						class="absolute top-[-22px]"
						
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="currentColor"
							class="w-4 rotate-90 stroke-current shrink-0 h-7"
						>
							<path
								fill-rule="evenodd"
								d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z"
								clip-rule="evenodd"
							/>
						</svg>
					</span>
				</span>
			</span>
		</div>
	</div>

	<div
		v-if="playerData"
		class="flex flex-col items-center w-full max-w-xl p-3 mx-auto bg-gray-300 rounded-lg sm:flex-row"
	>
		<div class="z-10 flex-grow w-full sm:w-auto">
			<!-- <pre>{{ playerData }}</pre> -->
			<div class="flex flex-col order-1 p-3 sm:order-1">
				<div class="flex items-center justify-between">
					<h2 class="w-full text-2xl font-bold leading-5">
						{{ playerData.first_name }} {{ playerData.second_name }}
					</h2>
					<div class="text-4xl font-black text-slate-500">
						{{ playerData.now_cost / 10 }}<span class="text-slate-400">m</span>
					</div>
				</div>
				<div class="flex items-center justify-between mb-3 leading-3">
					<!-- cards issued -->
					<div class="flex items-center">
						<img
							:src="`https://resources.premierleague.com/premierleague/badges/t${playerData.team_code}.png`"
							alt=""
							class="w-8 pr-1 sm:z-0 sm:top-1 sm:right-1 bottom-1"
						/>

						<div class="pr-3 leading-5">
							<div class="text-sm font-semibold">
								{{ playerData.teamData.name }}
							</div>
							<div class="text-xs uppercase text-slate-500">
								{{ elementType }}
							</div>
						</div>
					</div>
					<section
						v-if="playerData.yellow_cards > 0 || playerData.red_cards > 0"
					>
						<!-- <div class="mt-2 text-sm font-semibold">Cards</div> -->
						<div class="flex items-center">
							<div v-if="playerData.yellow_cards > 0" class="flex items-center">
								<div v-for="item in playerData.yellow_cards" :key="item">
									<div
										class="w-4 h-6 mr-1 bg-yellow-400"
										:title="`${playerData.yellow_cards} Yellow Card${
											playerData.yellow_cards > 1 ? 's' : ''
										}`"
									></div>
								</div>
							</div>
							<div v-if="playerData.red_cards > 0" class="flex items-center">
								<div v-for="item in playerData.red_cards" :key="item">
									<div
										class="w-4 h-6 mr-1 bg-yellow-400"
										:title="`${playerData.red_cards} Yellow Card${
											playerData.red_cards > 1 ? 's' : ''
										}`"
									></div>
								</div>
							</div>
						</div>
					</section>
				</div>

				<!-- transfers -->
				<div class="w-full">
					<ComparisonBar
						:comparison="{
							label: 'Transfers',
							homeWidth: inPercentage,
							homeTitle: 'In',
							homeValue: shortenNumber(playerData.transfers_in_event),
							awayWidth: outPercentage,
							awayTitle: 'Out',
							awayValue: shortenNumber(playerData.transfers_out_event),
						}"
					/>

					<button
						@click.prevent="addToWatchlist(playerData)"
						class="flex items-center justify-center w-full px-8 py-3 mt-2 text-base font-medium text-white bg-purple-600 border border-transparent rounded-md sm:mt-10 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="1.5"
							stroke="currentColor"
							class="size-6"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
							/>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
							/>
						</svg>

						<span class="pl-2">{{
							isOnWatchlist ? "Remove from watchlist" : "Add to watchlist"
						}}</span>
					</button>
				</div>
			</div>
		</div>

		<div class="relative z-0 flex justify-center w-full sm:w-auto">
			<!-- image -->
			<img
				:src="`https://resources.premierleague.com/premierleague/photos/players/110x140/p${playerData.code}.png`"
				class="object-cover w-auto h-44 sm:h-auto sm:z-20 sm:w-auto"
				:alt="playerData.web_name"
			/>

			<div
				class="absolute z-30 px-4 py-2 rounded-lg shadow-lg -bottom-4 sm:bottom-0 text-slate-800 bg-slate-100/95 right-2 left-2"
			>
				<div class="flex pb-1 border-b border-slate-300 justify-evenly">
					<div class="text-xs text-right uppercase">
						<div class="opacity-50">Points</div>
						<div class="font-semibold lowercase">
							{{ playerData.total_points }}
						</div>
					</div>

					<div class="text-xs text-left uppercase">
						<div class="opacity-50">Goals</div>
						<div class="font-semibold lowercase">
							{{ playerData.goals_scored }}
						</div>
					</div>
				</div>
				<div class="flex justify-between pt-1">
					<div class="text-xs text-left uppercase">
						<div class="opacity-50">Played</div>
						<div class="font-semibold lowercase">
							{{ playerData.minutes }} min
						</div>
					</div>
					<!-- <div class="text-xs text-center uppercase">
							<div class="opacity-50">Form</div>
							<div
								class="font-semibold lowercase"
								:class="['form-value', getFormCategory(player.form)]"
							>
								{{ player.form }}
							</div>
						</div> -->
					<div class="text-xs text-right uppercase">
						<div class="opacity-50">Selected by</div>
						<div class="font-semibold lowercase">
							{{ playerData.selected_by_percent }}%
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
	const props = defineProps(["player", "bootstrap"]);
	const savedWatchlist = ref([]);
	const isOnWatchlist = ref(false);

	const inPercentage = computed(() =>
		totalTransfers.value === 0
			? 50
			: (props.player.transfers_in_event / totalTransfers.value) * 100
	);

	const outPercentage = computed(() =>
		totalTransfers.value === 0
			? 50
			: (props.player.transfers_out_event / totalTransfers.value) * 100
	);

	const totalTransfers = computed(
		() => props.player.transfers_in_event + props.player.transfers_out_event
	);

	const addToWatchlist = (player) => {
		const index = savedWatchlist.value.indexOf(player.code);

		// If player is already on the watchlist, remove them
		if (index !== -1) {
			savedWatchlist.value.splice(index, 1); // Remove the player
			localStorage.setItem(
				"savedWatchlist",
				JSON.stringify(savedWatchlist.value)
			);
			isOnWatchlist.value = false;
		} else {
			// Add player to watchlist if not already present
			savedWatchlist.value.push(player.code);
			localStorage.setItem(
				"savedWatchlist",
				JSON.stringify(savedWatchlist.value)
			);
			isOnWatchlist.value = true;
		}
	};

	const playerData = computed(() => {
		if (props.bootstrap) {
			const selectedPlayer = props.bootstrap.elements.find(
				(p) => p.code == props.player.code
			);
			props.player.teamData = props.bootstrap.teams.find(
				(team) => team.id == props.player.team
			);

			return selectedPlayer ? selectedPlayer : "";
		}

		return null;
	});

	onMounted(() => {
		const savedList = localStorage.getItem("savedWatchlist") ?? "";
		let list = JSON.parse(savedList);
		console.log(list.length);

		if (savedList) {
			savedWatchlist.value = list;
			if (savedWatchlist.value.includes(props.player.code)) {
				isOnWatchlist.value = true;
			}
		}
	});

	const elementTypeMap = {
		1: "Goalkeeper",
		2: "Defender",
		3: "Midfielder",
		4: "Forward",
	};

	const elementType = computed(
		() => elementTypeMap[props.player.element_type] || "Unknown"
	);
</script>
