<template>
	<div
		class="w-[1024px] h-[1024px] bg-gray-200 overflow-hidden bg-gradient-to-tr from-gray-200 text-gray-800 to-gray-300 relative" 
	>
		<div class="absolute flex justify-between w-full px-10 pt-10">
			<!-- Player Info -->

			<div class="flex justify-between w-full">
				<div class="text-left">
					<h2 class="text-6xl font-bold">{{ player.web_name }}</h2>
					<div class="flex items-center mt-6 space-x-2">
						<img
							:src="`https://resources.premierleague.com/premierleague/badges/t${player.team_code}.png`"
							:alt="player.web_name"
							class="w-24 mr-3"
						/>
						<div>
							<p class="text-3xl">{{ team }}</p>
							<p class="text-4xl font-bold">{{ elementType }}</p>
						</div>
					</div>

					<p class="text-3xl mt-36">Played</p>
					<p class="text-6xl font-bold">{{ player.minutes }} min</p>
				</div>
				<div class="text-right">
					<p class="text-5xl">GAMEWEEK {{ gameweek.id }}</p>
					<p class="pt-8 font-bold text-8xl">
						{{ player.now_cost / 10 }}<span class="opacity-50">m</span>
					</p>
					<p class="text-3xl mt-36">Points</p>
					<p class="text-6xl font-bold">{{ player.total_points }}</p>
				</div>
			</div>
		</div>

		<div class="relative flex flex-col items-center justify-end w-full h-full">
			<div class="absolute right-20 z-50 py-2 bottom-[240px]">
				<div
					class="w-[400px] bg-white/90 flex flex-col items-center justify-center rounded-lg pb-3"
				>
					<p class="mb-2 text-xl font-bold text-center text-black">
						Upcoming difficulty
					</p>
					<!-- <pre>{{ upcoming }}</pre> -->
					<div
						v-if="upcoming"
						class="flex items-center justify-center mt-0 space-x-2"
					>
						<div
							v-for="item in upcoming"
							:key="item"
							class="flex items-center justify-center w-16 h-16 rounded-md"
							:class="`${getDifficultyColors(item.difficulty)}`"
						>
							<!-- <img
							:src="`https://resources.premierleague.com/premierleague/badges/t${!item.is_home ? item.team_h : item.team_a}.png`"
							:alt="player.web_name"
							class="w-12"
						/> -->
						</div>
					</div>
				</div>
			</div>
			<!-- Image -->
			<img
				:src="`https://resources.premierleague.com/premierleague/photos/players/250x250/p${player.code}.png`"
				alt=""
				class="object-cover w-full h-full pt-3 shadow-lg"
			/>

			<div class="absolute bottom-0 left-0 z-30 w-full">
				<!-- Difficulty Bar -->

				<!-- Transfer Stats -->
				<div class="relative bottom-10">
					<!-- Transfers Out Dynamic Width Bar -->
					<div
						:style="{ width: transfersOutWidth + 'px' }"
						class="bg-red-600 h-[200px] z-20 absolute"
					></div>

					<!-- Background Red Bar -->
					<div class="w-[1024px] h-[200px] bg-teal-500 z-10 relative"></div>

					<!-- Content Overlay with higher z-index -->
					<div
						class="absolute z-30 w-full flex justify-between items-center h-[100px] bottom-12 px-12 text-white"
					>
						<div class="text-center">
							<!-- <pre>{{ JSON.stringify(transfersOutWidth) }}</pre>
							<pre>{{ JSON.stringify(outPercentage) }}</pre> -->
							<p class="font-bold text-8xl">
								{{ shortenNumber(player.transfers_out_event) }}
							</p>
							<p class="text-4xl">Transfers Out</p>
						</div>

						<div class="text-center">
							<p class="font-bold text-8xl">
								{{ shortenNumber(player.transfers_in_event) }}
							</p>
							<p class="text-4xl">Transfers In</p>
						</div>
					</div>

					<div
						class="absolute left-0 right-0 z-50 flex items-center justify-center w-full bottom-10"
					>
						<div
							class="px-6 py-3 text-center text-black border rounded-lg bg-white/90"
						>
							<p class="text-6xl font-bold">
								{{ player.form }}
							</p>
							<p class="text-4xl">Form</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
	const props = defineProps(["player", "team", "upcoming", "gameweek"]);

	const totalTransfers = computed(
		() => props.player.transfers_in_event + props.player.transfers_out_event
	);

	const outPercentage = computed(() =>
		totalTransfers.value == 0
			? 50
			: (props.player.transfers_out_event / totalTransfers.value) * 100
	);

	const transfersOutWidth = computed(() =>
		(1024 * (outPercentage.value / 100)).toString()
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

	// Helper to get difficulty colors
	function getDifficultyColors(difficulty) {
		const colors = {
			1: "bg-blue-500",
			2: "bg-blue-600",
			3: "bg-yellow-500",
			4: "bg-orange-500",
			5: "bg-red-500",
		};
		return colors[difficulty];
	}
</script>

<style scoped></style>
