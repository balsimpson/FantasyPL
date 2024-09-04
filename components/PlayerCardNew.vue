<template>
	<div class="relative flex flex-col overflow-hidden">
		<NuxtLink :to="'/player/' + player.id">
			<!-- content -->
			<div class="z-10 flex-grow">
				<!-- <pre>{{ player }}</pre> -->
				<div class="flex flex-col order-1 p-3 sm:order-1">
					<div class="flex items-center justify-between">
						<h2 class="w-full text-2xl font-bold leading-5">
							{{ player.web_name }}
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
								<div class="text-sm font-semibold">{{ teamName }}</div>
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

			<div class="z-0 flex justify-center drop-shadow-lg">
				<!-- image -->
				<img
					:src="`https://resources.premierleague.com/premierleague/photos/players/110x140/p${player.code}.png`"
					class="object-cover w-64 h-auto sm:z-20 sm:w-auto "
					:alt="player.web_name"
				/>

			</div>
			<div
				class="absolute z-30 px-4 py-2 rounded-lg shadow-lg text-slate-800 bg-slate-100/95 right-2 left-2 bottom-2"
			>
				<div class="flex pb-1 border-b border-slate-300 justify-evenly">
					<div class="text-xs text-right uppercase">
						<div class="opacity-50">Points</div>
						<div class="font-semibold lowercase">
							{{ player.event_points }}
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
						<div class="font-semibold lowercase">
							{{ player.minutes }} min
						</div>
					</div>
					<div class="text-xs text-center uppercase">
						<div class="opacity-50">Form</div>
						<div
							class="font-semibold lowercase"
							:class="['form-value', getFormCategory(player.form)]"
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
		</NuxtLink>
	</div>
</template>

<script setup>
	const props = defineProps({
		player: Object,
		data: Object,
	});

	const teamName = computed(() => {
		const team = props.data.find((team) => team.id === props.player.team);
		return team ? team.name : "Unknown Team";
	});

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

	const getFormCategory = (form) => {
		const formValue = parseFloat(form);
		if (formValue >= 5) return "good";
		if (formValue >= 3) return "average";
		return "bad";
	};
</script>

<style scoped>
	.form-value {
		padding: 2px 6px;
		border-radius: 4px;
	}
	.good {
		background-color: #4caf50;
		color: white;
	}
	.average {
		background-color: #ffa500;
		color: black;
	}
	.bad {
		background-color: #f44336;
		color: white;
	}
</style>
