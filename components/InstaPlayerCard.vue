<template>
	<div :id="props.id">
		<div
			class="w-[1080px] h-[1350px]  bg-gray-200 border border-black overflow-hidden bg-gradient-to-br from-gray-100 text-gray-800 to-gray-300 relative" 
		>
		<div class="flex absolute justify-between px-10 pt-10 w-full">
			<!-- Player Info -->
			<div class="flex justify-between w-full">
				<div class="text-left">
					<h2 class="text-6xl font-bold">{{ player.web_name }}</h2>
					<div class="flex items-center mt-6 space-x-2">
						<img
							:src="`https://resources.premierleague.com/premierleague/badges/t${player.team_code}.png`"
							:alt="player.web_name"
							class="mr-3 w-24"
						/>
						<div>
							<p class="text-3xl">{{ team }}</p>
							<p class="text-4xl font-bold">{{ elementType }}</p>
						</div>
					</div>

					<p class="mt-36 text-3xl">Played</p>
					<p class="text-6xl font-bold">{{ player.minutes }} min</p>
					<p class="mt-8 text-3xl">Selected by</p>
					<p class="text-6xl font-bold">{{ player.selected_by_percent }}<span class="opacity-50">%</span></p>
					<p class="mt-8 text-3xl">Bonus</p>
					<p class="text-6xl font-bold">{{ player.bonus }}</p>
				</div>
				<div class="text-right">
					<p class="text-5xl">GAMEWEEK {{ gameweek.id }}</p>
					<p class="pt-8 text-8xl font-bold">
						{{ player.now_cost / 10 }}<span class="opacity-50">m</span>
					</p>
					<p class="mt-36 text-3xl">Age</p>
					<p class="text-6xl font-bold">
						{{ getAge(player.birth_date) }}
					</p>
					<p class="mt-8 text-3xl">Points per game</p>
					<p class="text-6xl font-bold">{{ player.points_per_game }}</p>
					<p class="mt-8 text-3xl">Total points</p>
					<p class="text-6xl font-bold">{{ player.total_points }}</p>
				</div>
			</div>
		</div>

		<div class="flex relative flex-col justify-end items-center w-full h-full">
			<div class="absolute  left-1/2 -translate-x-1/2 z-50 py-2 bottom-[240px]">
				<div
					class="w-[400px] bg-white/90 flex flex-col items-center justify-center rounded-lg pb-3"
				>
					<p class="mb-2 text-xl font-bold text-center text-black">
						Upcoming games difficulty
					</p>
					<!-- <pre>{{ upcoming }}</pre> -->
					<div
						v-if="upcoming"
						class="flex justify-center items-center mt-0 space-x-2"
					>
						<div
							v-for="item in upcoming"
							:key="item"
							class="flex justify-center items-center w-16 h-16 rounded-md"
							:class="`${getDifficultyColors(item.difficulty)}`"
						>
							<!-- <img
							:src="`https://resources.premierleague.com/premierleague/badges/t${!item.is_home ? item.team_h : item.team_a}.png`"
							:alt="!item.is_home ? item.team_h : item.team_a"
							class="w-12"
						/> -->
						<div class="relative text-center">

							<div class="text-xl font-bold">{{ item.difficulty }}</div>
							<div class="absolute left-1/2 text-xs font-light -translate-x-1/2">{{item.is_home ? 'Home': ''}}</div>
						</div>
						
						</div>
					</div>
				</div>
			</div>
			<!-- Image -->
			<!-- style="max-width:1000px; max-height:1000px; width:900px; height:auto;" -->
			<div class="flex justify-center items-center pt-3 w-full h-full">
				<img
					:src="`https://resources.premierleague.com/premierleague/photos/players/250x250/p${player.code}.png`"
					alt=""
					class="object-contain drop-shadow-lg scale-150"
					
				/>
			</div>

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
					<div class="w-[1080px] h-[200px] bg-teal-500 z-10 relative"></div>

					<!-- Content Overlay with higher z-index -->
					<div
						class="absolute z-30 w-full flex justify-between items-center h-[100px] bottom-12 px-12 text-white"
					>
						<div class="text-center">
							<!-- <pre>{{ JSON.stringify(transfersOutWidth) }}</pre>
							<pre>{{ JSON.stringify(outPercentage) }}</pre> -->
							<p class="text-8xl font-bold">
								{{ shortenNumber(player.transfers_out_event) }}
							</p>
							<p class="text-4xl">Transfers Out</p>
						</div>

						<div class="text-center">
							<p class="text-8xl font-bold">
								{{ shortenNumber(player.transfers_in_event) }}
							</p>
							<p class="text-4xl">Transfers In</p>
						</div>
					</div>

					<div
						class="flex absolute right-0 left-0 bottom-10 z-50 justify-center items-center w-full"
					>
						<div
							class="px-6 py-3 text-center text-black rounded-lg border bg-white/90"
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
	</div>
</template>

<script setup>
	const props = defineProps(["player", "team", "upcoming", "gameweek", "id"]);

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
			1: "bg-teal-300",
			2: "bg-blue-300",
			3: "bg-yellow-300",
			4: "bg-orange-300",
			5: "bg-red-300",
		};
		return colors[difficulty];
	}

	const getAge = (birthDate) => {
		if (!birthDate) return 0;
		
		const today = new Date();
		const birth = new Date(birthDate);
		
		let age = today.getFullYear() - birth.getFullYear();
		const monthDiff = today.getMonth() - birth.getMonth();
		
		// If birthday hasn't occurred this year yet, subtract 1
		if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
			age--;
		}
		
		return age;
	}
</script>

<style scoped></style>
