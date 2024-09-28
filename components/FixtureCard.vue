<template>
	<!-- <div -->
	<!-- class="flex items-center justify-center overflow-hidden bg-gray-700 rounded-lg -->
	<!-- h-44 w-96 shrink-0 snap-start" > -->
	<!-- <div class="flex items-center justify-center w-full mx-auto gap-x-4">
			<div class="w-24">
				<TeamInfo :team="getTeamInfo(fixture.team_a, bootstrap)"/>
				<div>{{ fixture.team_a_difficulty }}</div>
			</div>
			<div>vs</div>
			<div class="w-24">
				<TeamInfo
					:team="getTeamInfo(fixture.team_h, bootstrap)"
					alignment="right"
				/>
				<div>{{ fixture.team_h_difficulty }}</div>
			</div>
		</div>

		<div class="text-center">{{ formatDate(fixture.kickoff_time) }}</div> -->

	<div
		class="w-full max-w-sm mx-auto overflow-hidden bg-gray-200 rounded-lg shrink-0"
	>
		<div class="flex items-center justify-between p-4 bg-gray-800">
			<div class="flex items-center">
				<img
					:src="`https://resources.premierleague.com/premierleague/badges/t${
						getTeamInfo(fixture.team_h, bootstrap).code
					}.png`"
					alt="Team 1 Logo"
					class="w-12 h-12 mr-4 shrink-0"
				/>
				<!-- <span class="text-lg font-semibold text-white">{{
					getTeamInfo(fixture.team_h, bootstrap).name
				}}</span> -->

				
				<span class="text-lg font-semibold text-white">
					<span class="hidden md:inline">{{
						getTeamInfo(fixture.team_h, bootstrap).name
					}}</span>
					<span class="inline md:hidden">{{
						getTeamInfo(fixture.team_h, bootstrap).short_name
					}}</span>
				</span>
			</div>
			<span class="text-sm text-gray-400">VS</span>
			<div class="flex items-center">
				<!-- <span class="text-lg font-semibold text-white">{{
					getTeamInfo(fixture.team_a, bootstrap).name
				}}</span> -->
				<span class="text-lg font-semibold text-white">
					<span class="hidden md:inline">{{
						getTeamInfo(fixture.team_a, bootstrap).name
					}}</span>
					<span class="inline md:hidden">{{
						getTeamInfo(fixture.team_a, bootstrap).short_name
					}}</span>
				</span>
				<img
					:src="`https://resources.premierleague.com/premierleague/badges/t${
						getTeamInfo(fixture.team_a, bootstrap).code
					}.png`"
					alt="Team 2 Logo"
					class="w-12 h-12 ml-4 shrink-0"
				/>
			</div>
		</div>
		<div class="p-4 bg-gray-300">
			<div class="text-sm text-center text-gray-700">
				<!-- <p>Match Time:</p> -->
				<p class="text-xl font-bold">{{ formatDate(fixture.kickoff_time) }}</p>
			</div>
		</div>
	</div>
	<!-- </div> -->
</template>

<script setup>
	const props = defineProps({
		fixture: {
			type: Object,
			required: true,
		},
		bootstrap: {
			type: Object,
			required: true,
		},
	});
</script>
