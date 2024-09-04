<template>
	<div
		class="flex flex-col overflow-hidden bg-white rounded-lg shadow-sm"
		:style="{ backgroundColor: randomPastelColor }"
	>
		<div class="p-4 bg-black/50">
			<h2 class="text-lg font-semibold text-white">
				{{ league.name }}
			</h2>
			<p class="text-sm text-gray-300">League ID: {{ league.id }}</p>
		</div>

		<!-- <pre>{{ league }}</pre> -->
		<div class="p-4">
			<div class="flex justify-between mb-4 text-gray-700">
				<div>
					<p class="text-sm">Current Rank</p>
					<p class="text-xl font-bold">
						{{ new Intl.NumberFormat().format(league.entry_rank) }}
					</p>
				</div>
				<div class="text-right">
					<p class="text-sm">Last Rank</p>
					<p class="text-xl font-bold">{{ new Intl.NumberFormat().format(league.entry_last_rank) }}</p>
				</div>
			</div>
			<div class="flex justify-between text-gray-700">
				<div>
					<p class="text-sm">Participants</p>
					<p class="text-xl font-bold">
						{{ shortenNumber(league.rank_count) }}
					</p>
				</div>
				<div class="text-right">
					<p class="text-sm">Percentile Rank</p>
					<p class="text-xl font-bold">{{ league.entry_percentile_rank }}%</p>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
	const props = defineProps(["league"]);
	const randomPastelColor = `hsl(${Math.random() * 360}, 100%, 85%)`;
</script>
