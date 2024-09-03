<template>
	<div :key="season.season_name" class="p-4 bg-white rounded-lg shadow">
		<div class="flex justify-between">
			<h3 class="mb-2 text-xl font-semibold uppercase text-slate-500">
				{{ season.season_name }}
			</h3>
			<p>
				Played
				<span class="text-sm font-bold">{{
					season.minutes > 60
						? (season.minutes / 60).toFixed(0) + " hrs"
						: season.minutes + " min"
				}}</span>
			</p>
		</div>
		<div class="flex items-start justify-between">
			<div class="flex items-end justify-between w-full gap-4">
				<div>
					<div
						class="text-xs font-semibold leading-3 text-center uppercase text-slate-500"
					>
						Start Cost
					</div>
					<div class="text-xl font-bold text-center">
						{{ season.start_cost / 10 }}m
					</div>
				</div>
				<div>
					<div
						class="text-xs font-semibold leading-3 text-center uppercase text-slate-500"
					>
						End Cost
					</div>
					<div class="text-xl font-bold text-center">
						{{ season.end_cost / 10 }}m
					</div>
				</div>
				<div>
					<div
						class="text-xs font-semibold leading-3 text-center uppercase text-slate-500"
					>
						Points
					</div>
					<div class="text-xl font-bold text-center">
						{{ season.total_points }}
					</div>
				</div>
				<!-- <div>
					<div
						class="text-xs font-semibold leading-3 text-center uppercase text-slate-500"
					>
						Minutes
					</div>
					<div class="text-xl font-bold text-center">
						{{ season.minutes }}
					</div>
				</div> -->
				<div>
					<div
						class="text-xs font-semibold leading-3 text-center uppercase text-slate-500"
					>
						Goals
					</div>
					<div class="text-xl font-bold text-center">
						{{ season.goals_scored }}
					</div>
				</div>
			</div>
		</div>
		<!-- <div>
							<div class="flex">
								<div>
									<div>Assists</div>
									<div>{{ season.assists }}</div>
								</div>
								<div>
									<div>Clean Sheets</div>
									<div>{{ season.clean_sheets }}</div>
								</div>
								<div>
									<div>Goals Conceded</div>
									<div>{{ season.goals_conceded }}</div>
								</div>
								<div>
									<div>Yellow Cards</div>
									<div>{{ season.yellow_cards }}</div>
								</div>
								<div>
									<div>Red Cards</div>
									<div>{{ season.red_cards }}</div>
								</div>
							</div>
						</div> -->
	</div>
</template>

<script setup>
	defineProps(["season"]);
</script>
