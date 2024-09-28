<template>
	<div
		class="w-[1024px] h-[1024px] bg-gray-200 overflow-hidden bg-gradient-to-tr from-gray-200 text-gray-800 to-gray-300 relative"
	>
		<div class="flex items-center justify-between h-full gap-4">
			<!-- Player 1 image on the left -->
			<div class="relative w-1/2 h-full overflow-hidden">
				<div class="p-5 text-left">
					<h2 class="text-6xl font-bold">{{ player1.web_name }}</h2>
					<div class="flex items-center mt-6 space-x-2">
						<img
							:src="`https://resources.premierleague.com/premierleague/badges/t${player1.team_code}.png`"
							:alt="player1.web_name"
							class="w-24 mr-3"
						/>
						<div>
							<p class="text-3xl">{{ team1.name }}</p>
							<p class="text-4xl font-bold">{{ elementType1 }}</p>
						</div>
					</div>
				</div>
				<div class="absolute left-[-78%] bottom-0 h-[800px]">
					<img
						:src="`https://resources.premierleague.com/premierleague/photos/players/250x250/p${player1.code}.png`"
						alt=""
						class="object-cover w-full h-full shadow-sm"
					/>
				</div>
			</div>

			<div class="relative w-1/2 h-full overflow-hidden">
				<div class="p-5 text-right">
					<h2 class="text-6xl font-bold">{{ player2.web_name }}</h2>
					<div class="flex items-center justify-end mt-6 space-x-2">
						<div class="pr-3">
							<p class="text-3xl">{{ team2.name }}</p>
							<p class="text-4xl font-bold">{{ elementType2 }}</p>
						</div>
						<img
							:src="`https://resources.premierleague.com/premierleague/badges/t${player2.team_code}.png`"
							:alt="player2.web_name"
							class="w-24"
						/>
					</div>
				</div>
				<div class="absolute right-[-80%] bottom-0 h-[800px]">
					<img
						:src="`https://resources.premierleague.com/premierleague/photos/players/250x250/p${player2.code}.png`"
						alt=""
						class="object-cover w-full h-full shadow-sm"
					/>
				</div>
			</div>
		</div>

		<div class="absolute left-0 right-0 top-[30%]">
			<div>
				<h2 class="text-4xl font-bold text-center">Cost</h2>
				<div class="flex items-center justify-center space-x-4">
					<p
						class="text-6xl font-bold"
						:class="[
							player1.now_cost < player2.now_cost
								? 'text-pink-600'
								: 'text-teal-500',
						]"
					>
						{{ player1.now_cost / 10 }}<span class="opacity-50">m</span>
					</p>
					<p
						class="text-6xl font-bold"
						:class="[
							player2.now_cost < player1.now_cost
								? 'text-pink-600'
								: 'text-teal-500',
						]"
					>
						{{ player2.now_cost / 10 }}<span class="opacity-50">m</span>
					</p>
				</div>
			</div>
			<div>
				<h2 class="pt-6 text-4xl font-bold text-center">Played</h2>
				<div class="flex items-center justify-center space-x-4">
					<p
						class="text-6xl font-bold"
						:class="[
							player1.minutes < player2.minutes
								? 'text-pink-600'
								: 'text-teal-500',
						]"
					>
						{{ player1.minutes }}
					</p>
					<span class="text-6xl opacity-50">min</span>
					<p
						class="text-6xl font-bold"
						:class="[
							player2.minutes < player1.minutes
								? 'text-pink-600'
								: 'text-teal-500',
						]"
					>
						{{ player2.minutes }}
					</p>
				</div>
			</div>
			<div>
				<h2 class="pt-6 text-4xl font-bold text-center">Form</h2>
				<div class="flex items-center justify-center space-x-12">
					<p
						class="text-6xl font-bold"
						:class="[
							player1.form < player2.form ? 'text-pink-600' : 'text-teal-500',
						]"
					>
						{{ player1.form }} <span class="opacity-50"></span>
					</p>
					<p
						class="text-6xl font-bold"
						:class="[
							player2.form < player1.form ? 'text-pink-600' : 'text-teal-500',
						]"
					>
						{{ player2.form }}
					</p>
				</div>
			</div>
			<div>
				<h2 class="pt-6 text-4xl font-bold text-center">Points</h2>
				<div class="flex items-center justify-center space-x-12">
					<p
						class="text-6xl font-bold"
						:class="[
							player1.total_points < player2.total_points
								? 'text-pink-600'
								: 'text-teal-500',
						]"
					>
						{{ player1.total_points }} <span class="opacity-50"></span>
					</p>
					<p
						class="text-6xl font-bold"
						:class="[
							player2.total_points < player1.total_points
								? 'text-pink-600'
								: 'text-teal-500',
						]"
					>
						{{ player2.total_points }} <span class="opacity-50"></span>
					</p>
				</div>
			</div>
			<div>
				<h2 class="pt-6 text-4xl font-bold text-center">Selected by</h2>
				<div class="flex items-center justify-center space-x-4">
					<p
						class="text-6xl font-bold"
						:class="[
							Number(player1.selected_by_percent).toFixed(0) <
							Number(player2.selected_by_percent).toFixed(0)
								? 'text-pink-500'
								: 'text-teal-500',
						]"
					>
						{{ Number(player1.selected_by_percent).toFixed(0)
						}}<span class="opacity-50"></span>
					</p>
					<span class="text-6xl opacity-50">%</span>
					<p
						class="text-6xl font-bold"
						:class="[
							Number(player2.selected_by_percent).toFixed(0) <
							Number(player1.selected_by_percent).toFixed(0)
								? 'text-pink-500'
								: 'text-teal-500',
						]"
					>
						{{ Number(player2.selected_by_percent).toFixed(0)
						}}<span class="opacity-50"></span>
					</p>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
	const props = defineProps(["player1", "player2", "team1", "team2"]);

	const totalTransfers1 = computed(
		() => props.player1.transfers_in_event + props.player1.transfers_out_event
	);
	const totalTransfers2 = computed(
		() => props.player2.transfers_in_event + props.player2.transfers_out_event
	);

	const elementTypeMap = {
		1: "Goalkeeper",
		2: "Defender",
		3: "Midfielder",
		4: "Forward",
	};

	const elementType1 = computed(
		() => elementTypeMap[props.player1.element_type] || "Unknown"
	);
	const elementType2 = computed(
		() => elementTypeMap[props.player2.element_type] || "Unknown"
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
