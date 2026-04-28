<template>
	<div class="mx-auto my-6 w-full">
		<h1 class="text-2xl font-bold tracking-tight text-gray-900 sm:text-4xl">
			<span class="text-[#7300c5]">{{ recommendedPlayers.length }}</span>
			recommendations
		</h1>
		<div
			class="flex flex-col gap-x-3 justify-between items-center p-3 mb-3 rounded-lg border sm:flex-row bg-slate-100"
		>
			<div v-if="allPlayers && allPlayers.length" class="mb-4">
				<div class="w-44">
					<label
						for="position-select"
						class="block text-sm font-medium text-gray-900"
						>Position</label
					>
					<select
						v-model="selectedPosition"
						id="position-select"
						class="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
					>
						<option value="">Choose a position</option>
						<option value="4">Forward</option>
						<option value="3">Midfielder</option>
						<option value="2">Defender</option>
						<option value="1">Goalkeeper</option>
					</select>
				</div>
			</div>
			<div class="w-44">
				<label
					for="budget-slider"
					class="block text-sm font-medium text-gray-900"
					>Budget: {{ selectedBudget }}£m</label
				>
				<input
					type="range"
					id="budget-slider"
					name="budget-slider"
					min="0"
					max="20"
					v-model="selectedBudget"
					step="0.5"
					class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
				/>
				<div class="flex justify-between px-2 text-xs">
					<span>0</span>
					<span>25</span>
				</div>
			</div>
		</div>

		<div v-if="recommendedPlayers && recommendedPlayers.length > 0">
			<AppCarousel>
				<LazyPlayerCardNew
					v-for="item in recommendedPlayersNew"
					:key="item"
					:player="item"
					:data="allTeams"
					class="flex-shrink-0 w-[88vw] sm:w-[24rem] lg:w-[28rem] snap-start"
				/>
			</AppCarousel>
		</div>
		<div v-else class="text-2xl font-semibold text-center text-red-600">No players available!</div>
	</div>
</template>

<script setup>
	const selectedPosition = ref(4);
	const selectedBudget = ref(5);
	const allPlayers = useState("allPlayers");
	const allTeams = useState("allTeams");
	const MAX_OPTIONS = 50;

	const recommendedPlayers = computed(() => {
		if (!allPlayers.value) return [];

		let filteredPlayers = allPlayers.value.filter(
			(player) =>
				player.element_type == selectedPosition.value &&
				player.now_cost <= selectedBudget.value * 10
		);

		// Calculate scores
		// @ts-ignore
		const scoredPlayers = filteredPlayers.map((player) => ({
			...player,
			score: calculatePlayerScore(player),
		}));

		// Sort by score in descending order and take the top N
		// @ts-ignore
		return scoredPlayers
			.sort((a, b) => b.score - a.score)
			.slice(0, MAX_OPTIONS);
	});
	

	const recommendedPlayersNew = computed(() => {
		
		let filteredPlayers = allPlayers.value.filter(
			(player) =>
				player.element_type == selectedPosition.value &&
				player.now_cost <= selectedBudget.value * 10
		);
		return computeScores(filteredPlayers)


	})

</script>
