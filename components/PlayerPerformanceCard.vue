<template>
	<!-- <div>{{ player }}</div> -->

	<div
		v-if="player"
		class="flex flex-col items-center w-full max-w-xl p-3 mx-auto bg-gray-300 rounded-lg sm:flex-row"
	>
		<div class="z-10 flex-grow w-full sm:w-auto">
			<!-- <pre>{{ player }}</pre> -->
			<div class="flex flex-col order-1 p-3 sm:order-1">
				<div class="flex items-center justify-between">
					<h2 class="w-full text-2xl font-bold leading-5">
						{{ player.first_name }} {{ player.second_name }}
					</h2>
					<div class="text-4xl font-black text-slate-500">
						{{ player.now_cost / 10 }}<span class="text-slate-400">m</span>
					</div>
				</div>
				<div class="flex items-center justify-between mb-3 leading-3">
					<!-- cards issued -->
					<div class="flex items-center">
						<img
							:src="`https://resources.premierleague.com/premierleague/badges/t${player.team_code}.png`"
							alt=""
							class="w-8 pr-1 sm:z-0 sm:top-1 sm:right-1 bottom-1"
						/>

						<div class="pr-3 leading-5">
							<div class="text-sm font-semibold">
								{{ player.teamData.name }}
							</div>
							<div class="text-xs uppercase text-slate-500">
								{{ elementType }}
							</div>
						</div>
					</div>
					<section v-if="player.yellow_cards > 0 || player.red_cards > 0">
						<!-- <div class="mt-2 text-sm font-semibold">Cards</div> -->
						<div class="flex items-center">
							<div v-if="player.yellow_cards > 0" class="flex items-center">
								<div v-for="item in player.yellow_cards" :key="item">
									<div
										class="w-4 h-6 mr-1 bg-yellow-400"
										:title="`${player.yellow_cards} Yellow Card${
											player.yellow_cards > 1 ? 's' : ''
										}`"
									></div>
								</div>
							</div>
							<div v-if="player.red_cards > 0" class="flex items-center">
								<div v-for="item in player.red_cards" :key="item">
									<div
										class="w-4 h-6 mr-1 bg-yellow-400"
										:title="`${player.red_cards} Yellow Card${
											player.red_cards > 1 ? 's' : ''
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
							homeValue: shortenNumber(player.transfers_in_event),
							awayWidth: outPercentage,
							awayTitle: 'Out',
							awayValue: shortenNumber(player.transfers_out_event),
						}"
					/>
				</div>
			</div>
		</div>

		<div class="relative z-0 flex justify-center w-full sm:w-auto">
			<!-- image -->
			<img
				:src="`https://resources.premierleague.com/premierleague/photos/players/110x140/p${player.code}.png`"
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
							{{ player.selected_by_percent }}%
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- <div class="flex items-center max-w-2xl mx-auto">
			<div>
				<img
					:src="`https://resources.premierleague.com/premierleague/photos/players/110x140/p${player.code}.png`"
					class="object-cover h-auto sm:z-20"
				/>
			</div>
			<div class="ml-3">
				<div class="text-2xl font-bold leading-6">
					{{ player.first_name }} {{ player.second_name }}
				</div>
				<div>{{ player.teamData.name }}</div>
				<div>{{ getPositionName(player.element_type) }}</div>
				<div>{{ player.minutes }} minutes</div>
				<div>{{ player.total_points }} points</div>
				<div>{{ player.transfers_in_event }} In</div>
				<div>{{ player.transfers_out_event }} Out</div>
				<div>{{ player.value_season }} Value</div>
				<div>#{{ player.ict_index_rank }}</div>
			</div>
		</div> -->
	</div>
</template>

<script setup>
	const props = defineProps(["player"]);

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
