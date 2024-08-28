<template>
	<div class="w-full mx-auto my-6">
		<h1 class="text-2xl font-bold tracking-tight text-gray-900 sm:text-4xl">
			<span class="text-[#7300c5]">{{ recommendedPlayers.length }}</span>
			recommendations
		</h1>
		<div
			class="flex flex-col items-center justify-between p-3 mb-3 border rounded-lg sm:flex-row gap-x-3"
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
						class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
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
					max="25"
					v-model="selectedBudget"
					step="1"
					class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
				/>
				<div class="flex justify-between px-2 text-xs">
					<span>0</span>
					<span>25</span>
				</div>
			</div>
		</div>
		<AppCarousel>
			<LazyPlayerCardNew
				v-for="item in recommendedPlayers"
				:key="item"
				:player="item"
				:data="allTeams"
				class="flex-shrink-0 w-64 rounded-lg bg-gradient-to-br from-slate-100 to-slate-300 snap-start"
			/>
		</AppCarousel>
	</div>
</template>

<script setup>
	const selectedPosition = ref(2);
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
</script>
