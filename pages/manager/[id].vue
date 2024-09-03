<template>
	<div class="p-3">
		<div
			class="max-w-2xl mx-auto overflow-hidden bg-white rounded-lg shadow-lg"
		>
			<div class="p-4 bg-gray-800">
				<h2 class="text-lg font-semibold text-white">Sam Eze</h2>
				<p class="text-sm text-gray-400">India (IND)</p>
			</div>
			<div class="p-4 bg-gray-50">
				<div class="flex justify-between mb-4 text-gray-700">
					<div>
						<p class="text-sm">Overall Points</p>
						<p class="text-xl font-bold">210</p>
					</div>
					<div>
						<p class="text-sm">Overall Rank</p>
						<p class="text-xl font-bold">2,497,137</p>
					</div>
				</div>
				<div class="flex justify-between text-gray-700">
					<div>
						<p class="text-sm">Event Points</p>
						<p class="text-xl font-bold">74</p>
					</div>
					<div>
						<p class="text-sm">Event Rank</p>
						<p class="text-xl font-bold">2,957,239</p>
					</div>
				</div>
			</div>
			<div class="p-4 bg-gray-50">
				<p class="text-sm text-gray-600">
					Active for 9 years. Current Event: 3
				</p>
			</div>
		</div>

		<div v-if="manager && manager.leagues">
			<AppCarousel>
				<LeagueInfoCard
					v-for="league in manager.leagues.classic"
					:key="league.id"
					class="w-full max-w-md shrink-0 snap-start"
					:league="league"
				/>
			</AppCarousel>

			<div
				class="max-w-md mx-auto overflow-hidden bg-white rounded-lg shadow-lg"
			>
				<pre>{{ picks }}</pre>
				<div class="p-4 bg-gray-800">
					<h2 class="text-lg font-semibold text-white">Manager Picks</h2>
					<p class="text-sm text-gray-400">Gameweek 3</p>
				</div>
				<div class="p-4 bg-gray-50">
					<div
						v-if="picks && picks.length > 0"
						class="grid grid-cols-3 gap-4 text-gray-700"
					>
						<!-- Loop through each pick -->
						<div class="col-span-3 font-bold text-center">Starting XI</div>

						<div
							v-for="pick in picks"
							:key="pick"
							class="col-span-1 text-center"
						>
							<!-- <p>Position 1</p> -->
							<p class="text-xl font-bold">{{ pick.element }}</p>
							<p class="text-sm font-semibold text-gray-400">{{ pick.element_type }}</p>
							<p v-if="pick.is_captain" class="text-sm text-gray-500">Captain</p>
							<p v-if="pick.is_vice_captain" class="text-sm text-gray-500">Vice Captain</p>
							<!-- {{ pick }} -->
						</div>

						<!-- Captain and Vice-Captain Highlights -->
						<div class="col-span-3 mt-4 text-center">
							<p class="font-medium text-gray-700">
								Captain: <span class="font-bold">351</span> (Multiplier: 2)
							</p>
							<p class="font-medium text-gray-700">
								Vice-Captain: <span class="font-bold">17</span>
							</p>
						</div>

						<!-- Bench -->
						<div class="col-span-3 mt-4 font-bold text-center">Bench</div>
						<div class="col-span-1 text-center">
							<p>Position 12</p>
							<p class="text-xl font-bold">280</p>
							<p class="text-sm text-gray-500">Multiplier: 0</p>
						</div>
						<div class="col-span-1 text-center">
							<p>Position 13</p>
							<p class="text-xl font-bold">82</p>
							<p class="text-sm text-gray-500">Multiplier: 0</p>
						</div>
						<div class="col-span-1 text-center">
							<p>Position 14</p>
							<p class="text-xl font-bold">461</p>
							<p class="text-sm text-gray-500">Multiplier: 0</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
	const route = useRoute();
	const id = route.params.id;
	const picks = ref([]);

	const { data: manager } = useLazyFetch(`/api/managers/${id}`);
	const { data: bootstrap } = useLazyFetch(`/api/bootstrap-static`);

	watchEffect(async () => {
		if (manager.value && bootstrap.value) {
			picks.value = await $fetch(
				`/api/managers/picks/?gw=${manager.value.current_event}&id=${manager.value.id}`
			);

			picks.value.map((pick) => {
				const element = getPlayerInfo(pick.element, bootstrap.value);
				pick.element = element.web_name;
				pick.element_type = getPositionName(element.element_type);

				return pick;
			});
		}
	});
</script>
