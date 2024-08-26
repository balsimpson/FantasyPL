<template>
	<div class="max-w-sm p-6 mx-auto bg-white rounded-lg shadow-lg">

        <pre>{{ gameweek }}</pre>
		<!-- <div class="flex items-center justify-between mb-4">
			<h2 class="text-2xl font-bold text-gray-800">{{ gameweek.name }}</h2>
			
			<span
				v-if="gameweek.is_previous"
				class="px-3 py-1 text-sm font-semibold text-red-800 bg-red-100 rounded-full"
				>Previous</span
			>
			<span
				v-if="gameweek.is_current"
				class="px-3 py-1 text-sm font-semibold text-teal-800 bg-teal-100 rounded-full"
				>Current</span
			>
			<span
				v-if="gameweek.is_next"
				class="px-3 py-1 text-sm font-semibold text-orange-800 bg-orange-100 rounded-full"
				>Next</span
			>
		</div> -->

		
		<!-- <div v-if="gameweek.chip_plays && gameweek.chip_plays.length > 0" class="mt-4">
			<h3 class="mb-2 text-lg font-semibold text-gray-700">Chip Usage</h3>
			<div class="flex flex-wrap gap-2">
				<span
					v-for="chip in gameweek.chip_plays"
					:key="chip.chip_name"
					class="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded"
				>
					{{ chip.chip_name }}: {{ chip.num_played }}
				</span>
			</div>
		</div> -->
	</div>
</template>

<script setup>
	const props = defineProps({
		gameweek: {
			type: Object,
			required: true,
		},
	});

	const formatDate = (dateString) => {
		if (!dateString) return "TBA";
		const date = new Date(dateString);
		return date.toLocaleDateString("en-GB", {
			day: "numeric",
			month: "short",
			year: "numeric",
		});
	};
</script>
