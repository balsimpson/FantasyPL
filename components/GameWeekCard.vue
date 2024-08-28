<template>
	<div class="p-6 mx-auto mt-6 bg-gradient-to-br bg-[#4B0082] from-[#4B0082] to-[#7300c5] rounded-lg shadow-lg">
		<div class="flex items-center justify-center mb-4">
			<h2 class="pr-3 text-2xl font-bold text-purple-200">{{ gameweek.name }}</h2>

			<span
				v-if="gameweek.is_previous"
				class="px-3 py-1 text-sm font-semibold text-red-800 bg-red-100 rounded-full"
				>Previous</span
			>
			<span
				v-if="gameweek.is_current"
				class="px-3 py-1 text-sm font-semibold text-teal-800 bg-teal-200 rounded-full"
				>Current</span
			>
			<span
				v-if="gameweek.is_next"
				class="px-3 py-1 text-sm font-semibold text-orange-800 bg-orange-100 rounded-full"
				>Next</span
			>
		</div>

		<!-- {{ gameweek.mostCaptainedTeam }} -->

		<div class="flex flex-col items-start justify-between space-y-8 text-purple-200 md:space-y-0 md:flex-row md:gap-x-12">
			

			<div class="flex justify-between w-full max-w-sm mx-auto">
				<div>
					<h3 class="text-xs uppercase text-slate-200">Transfers</h3>
					<div class="text-sm font-semibold">
						{{ shortenNumber(gameweek.transfers_made) }}
					</div>
				</div>

				<div class="text-right">
					<h3 class="text-xs uppercase text-slate-200">Deadline</h3>
					<div class="text-sm font-semibold">
						{{ getRemainingTime(gameweek.deadline_time) }}
					</div>
				</div>
			</div>

			<div class="flex justify-between w-full max-w-sm mx-auto">
				<div class="leading-5">
					<h3 class="text-xs uppercase text-slate-200">Most Captained</h3>
					<div class="font-semibold">
						{{ gameweek.mostCaptained }}
					</div>
					<div class="italic text-slate-300">
						{{ gameweek.mostCaptainedTeam.name }}
					</div>
				</div>

				<div class="leading-5 text-right">
					<h3 class="text-xs uppercase text-slate-200">Most Vice Captained</h3>
					<div class="font-semibold">
						{{ gameweek.mostViceCaptained }}
					</div>
					<div class="italic text-slate-300">
						{{ gameweek.mostViceCaptainedTeam.name }}
					</div>
				</div>
			</div>
		</div>

		<div
			v-if="gameweek.chip_plays && gameweek.chip_plays.length > 0"
			class="w-full max-w-sm mx-auto mt-4 md:max-w-md"
		>
			<h3 class="mb-2 text-lg font-semibold text-center text-purple-300">Chip Usage</h3>
			<div class="flex flex-wrap justify-center gap-2">
				<span
					v-for="chip in gameweek.chip_plays"
					:key="chip.chip_name"
					class="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded"
				>
					{{ chip.chip_name }}: {{ shortenNumber(chip.num_played) }}
				</span>
			</div>
		</div>
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
