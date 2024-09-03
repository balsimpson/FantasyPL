<template>
	<div class="p-4 bg-white rounded-lg shadow snap-start">
		<div class="flex items-center justify-between">
			<div>
				<h3 class="text-sm font-semibold uppercase text-slate-400">
					{{ fixture.event_name }}
				</h3>

				<div class="flex">
					<div class="flex items-center text-gray-600">
						<div class="font-bold">
							{{ fixture.is_home ? "Home" : "Away" }}
							<span class="text-slate-500/70">vs</span>
						</div>

						<img
							:src="`https://resources.premierleague.com/premierleague/badges/t${
								getTeamLogo(fixture.is_home ? fixture.team_a : fixture.team_h)
									.code
							}.png`"
							alt=""
							class="w-6 ml-1"
						/>
						<div class="ml-2 font-bold">
							{{
								getTeamLogo(fixture.is_home ? fixture.team_a : fixture.team_h)
									.name
							}}
						</div>
					</div>
				</div>

				<!-- <div class="flex items-center">
								</div> -->

				<!-- <span class="pl-2 text-xl font-bold">
										
									</span> -->
				<!-- </p> -->
				<!-- <span v-if="bootstrap">{{
										getTeamInfo(
											fixture.is_home ? fixture.team_a : fixture.team_h,
											bootstrap
										).name
									}}</span> -->
				<!-- </p> -->
				<p class="text-sm uppercase text-slate-400">
					{{ formatDate(fixture.kickoff_time) }}
				</p>
			</div>
			<div class="flex flex-col items-center">
				<div class="text-xs text-center uppercase text-slate-400">
					difficulty
				</div>
				<div
					class="flex items-center justify-center w-10 h-10 rounded text-slate-600"
					:class="[fixture.difficulty ? getColorClass(fixture.difficulty) : '']"
				>
					<div class="font-bold">{{ fixture.difficulty }}</div>
				</div>
			</div>
		</div>
	</div>
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

	const getTeamLogo = (teamId) => {
		// console.log(bootstrap.value);

		const team = props.bootstrap.teams.find((team) => team.id === teamId);
		return team ? team : "";
	};

	const getColorClass = (difficulty) => {
		switch (difficulty) {
			case 1:
				return "bg-green-500";
			case 2:
				return "bg-green-300";
			case 3:
				return "bg-yellow-300";
			case 4:
				return "bg-orange-400";
			case 5:
				return "bg-red-500 text-red-50";
		}
	};
</script>
