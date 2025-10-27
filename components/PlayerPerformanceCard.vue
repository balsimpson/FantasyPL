<template>
	<div
		
		class="flex flex-col items-center w-full max-w-xl p-3 mx-auto bg-gray-300 rounded-lg sm:flex-row"
	>

		<div class="relative z-0 flex justify-center w-full sm:w-auto">
			<!-- image -->
			<img
				:src="`https://resources.premierleague.com/premierleague25/photos/players/110x140/${player.code}.png`"
				class="object-cover w-auto h-44 sm:h-auto sm:z-20 sm:w-auto"
				:alt="player.web_name"
			/>

			<div
				class="absolute z-30 px-4 py-2 rounded-lg shadow-lg -bottom-4 sm:bottom-0 text-slate-800 bg-slate-100/95 right-2 left-2"
			>
				<div class="flex pb-1 border-b border-slate-300 justify-evenly">
					<div class="text-xs text-right uppercase">
						<div class="opacity-50">Points</div>
						<div class="font-semibold lowercase">
							{{ player.total_points }}
						</div>
					</div>

					<div class="text-xs text-left uppercase">
						<div class="opacity-50">Goals</div>
						<div class="font-semibold lowercase">
							{{ player.goals_scored }}
						</div>
					</div>
				</div>
				<div class="flex justify-between pt-1">
					<div class="text-xs text-left uppercase">
						<div class="opacity-50">Played</div>
						<div class="font-semibold lowercase">{{ player.minutes }} min</div>
					</div>
					<div class="text-xs text-center uppercase">
							<div class="opacity-50">Form</div>
							<div
								class="font-semibold lowercase"
								:class="['form-value']"
							>
								{{ player.form }}
							</div>
						</div>
					<div class="text-xs text-right uppercase">
						<div class="opacity-50">Selected by</div>
						<div class="font-semibold lowercase">
							{{ player.selected_by_percent }}%
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="flex items-center max-w-2xl mx-auto mt-5">
			<div class="ml-3">
				<div class="text-2xl font-bold leading-6">
					{{ playerFullName }}
				</div>


									<div class="flex items-center justify-between my-3 leading-3">
						<!-- cards issued -->
						<div class="flex items-center">
							<img
								:src="`https://resources.premierleague.com/premierleague/badges/t${player.team_code}.png`"
								alt=""
								class="w-12 pr-1 bottom-1 sm:z-0 sm:top-1 sm:right-1"
							/>

							<div class="pr-3 leading-5">
								<div class="text-sm font-semibold">{{ player.teamData?.name || 'N/A' }}</div>
								<div class="text-xs uppercase text-slate-500">
									{{ elementType }}
								</div>
							</div>
						</div>
						<section v-if="player.yellow_cards > 0 || player.red_cards > 0">
							<!-- <div class="mt-2 text-sm font-semibold">Cards</div> -->
							<div class="flex items-center">
								<div
									v-if="player.yellow_cards > 0"
									class="w-4 h-6 mr-1 bg-yellow-400"
									:title="`${player.yellow_cards} Yellow Card${
										player.yellow_cards > 1 ? 's' : ''
									}`"
								/>
								<div
									v-if="player.red_cards > 0"
									class="w-4 h-6 bg-red-600 rounded-[2px]"
									:title="`${player.red_cards} Red Card${
										player.red_cards > 1 ? 's' : ''
									}`"
								/>
								<span
									v-if="player.yellow_cards === 0 && player.red_cards === 0"
									class="text-sm"
								>
									None
								</span>
							</div>
						</section>
					</div>

				
				<div class="w-full mb-3">
						<ComparisonBar
							:comparison="{
								label: 'Transfers',
								homeWidth: inPercentage,
								homeTitle: 'In',
								homeValue: shortenNumber(player.transfers_in_event),
								awayWidth: outPercentage,
								awayTitle: 'Out',
								awayValue: shortenNumber(player.transfers_out_event),
							}"
						/>
					</div>

				<div class="flex justify-between">
					<span>Season Value:</span>
					<span class="font-semibold">{{ player.value_season }}</span>
				</div>
				<div class="flex justify-between">
					<span>ICT Index Rank:</span>
					<span class="font-semibold">#{{ player.ict_index_rank }}</span>
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
		if (bootstrap.value) {
			const selectedPlayer = bootstrap.value.elements.find((player) => player.id == id);
			

			return selectedPlayer ? selectedPlayer : "No player data";
		}

		return null;
	});

	onMounted(() => {
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

	const playerFullName = computed(
		() => `${props.player.first_name} ${props.player.second_name}`
	);
</script>
