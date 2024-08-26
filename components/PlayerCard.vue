<template>
	<div
		class="relative flex flex-col w-full max-w-2xl mx-auto border rounded-lg"
	>
		<img
			:src="`https://resources.premierleague.com/premierleague/badges/t${player.team_code}.png`"
			alt=""
			class="absolute w-16 h-16 sm:z-0 sm:top-1 sm:right-1 bottom-1"
		/>
		<!-- <pre>{{ player }}</pre> -->
		<div
			class="flex flex-col w-full sm:items-end sm:flex-row"
		>
			<div class="flex flex-col order-1 p-3 sm:order-1">
				<div class="leading-3 ">
					<!-- cards issued -->
					<div class="flex items-center">
						<div class="pr-3">
							<div class="text-sm font-semibold">{{ teamName }}</div>
							<div class="text-xs uppercase text-slate-500">
								{{ elementType }}
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
				</div>
				<!-- <h1 class="w-full text-2xl font-bold leading-5">
					{{ player.first_name }} {{ player.second_name }}
				</h1> -->
				<h2 class="w-full text-2xl font-bold leading-5">
					{{ player.web_name }}
				</h2>
				<div class="mt-1 mb-3 text-3xl font-black text-slate-500">
					{{ player.now_cost / 10 }}<span class="text-slate-400">m</span>
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

					<!-- <ComparisonChartBar :comparison="{label: '', homeWidth: inPercentage, homeTitle: 'In', homeValue: player.transfers_in_event, awayWidth: outPercentage, awayTitle: 'Out', awayValue: player.transfers_out_event}"/> -->
				</div>
			</div>

			<div class="flex items-end order-2 w-full sm:w-auto sm:order-1 sm:ml-2">
				<img
					:src="`https://resources.premierleague.com/premierleague/photos/players/110x140/p${player.code}.png`"
					class="object-cover w-full h-auto sm:z-10 sm:h-36 sm:w-auto"
					:alt="player.web_name"
				/>
			</div>
		</div>
		<!-- <pre>{{ player }}</pre> -->
	</div>
</template>

<script setup>
	const props = defineProps({
		player: Object,
	});
	const store = useState("bootstrap");
	const teamData = ref(null);
	const teamName = ref("");

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

	watchEffect(() => {
		if (store.value && store.value.teams) {
			const team = store.value.teams.find((t) => t.id === props.player.team);
			teamName.value = team.name || "";
			return team ? team.name : "Unknown Team";
		}
		return "Loading...";
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

	// const playerTeam = computed(() => {
	//     if (store.teams && props.player) {
	//         // let team = store.teams[props.player.team] || ""
	//         // teamData.value = store.value.teams.find(team => team.code === props.player.team)
	//         // teamData.value = store.teams[0]
	//         console.log("teamData", teamData)

	//         return store.teams.find(team => {
	//             console.log("team", team);
	//             team.id === props.player.team
	//         });

	//         // return store.teams.find((team) => team.id == [props.player.team_code]) || ""
	//         return teamData.value
	//     }
	// })
</script>
