<template>
	<main
		v-if="error"
		class="grid min-h-full px-6 py-24 place-items-center sm:py-32 lg:px-8"
	>
		<div class="text-center">
			<p class="text-base font-semibold text-indigo-600">{{ id }}</p>
			<h1
				class="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-5xl"
			>
				Manager not found
			</h1>
			<p class="mt-6 text-base leading-7 text-gray-600">
				Sorry, we couldn’t find the manager page you’re looking for.
			</p>
			<div class="flex items-center justify-center mt-10 gap-x-6">
				<NuxtLink
					to="/"
					class="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
					>Go back home</NuxtLink
				>
			</div>
		</div>
	</main>
	<div v-else class="p-3">
		<div
			v-if="managerData"
			class="max-w-4xl mx-auto overflow-hidden bg-white rounded-lg shadow-lg"
		>
			<div class="relative py-6 overflow-hidden bg-gray-900 isolate sm:py-12">
				<!-- <img
					src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&crop=focalpoint&fp-y=.8&w=2830&h=1500&q=80&blend=111827&sat=-100&exp=15&blend-mode=multiply"
					alt=""
					class="absolute inset-0 object-cover object-right w-full h-full -z-10 md:object-center"
				/> -->
				<div
					class="hidden sm:absolute sm:-top-10 sm:right-1/2 sm:-z-10 sm:mr-10 sm:block sm:transform-gpu sm:blur-3xl"
					aria-hidden="true"
				>
					<div
						class="aspect-[1097/845] w-[68.5625rem] bg-gradient-to-tr from-[#ff4694] to-[#776fff] opacity-20"
						style="
							clip-path: polygon(
								74.1% 44.1%,
								100% 61.6%,
								97.5% 26.9%,
								85.5% 0.1%,
								80.7% 2%,
								72.5% 32.5%,
								60.2% 62.4%,
								52.4% 68.1%,
								47.5% 58.3%,
								45.2% 34.5%,
								27.5% 76.7%,
								0.1% 64.9%,
								17.9% 100%,
								27.6% 76.8%,
								76.1% 97.7%,
								74.1% 44.1%
							);
						"
					></div>
				</div>
				<div
					class="absolute -top-52 left-1/2 -z-10 -translate-x-1/2 transform-gpu blur-3xl sm:top-[-28rem] sm:ml-16 sm:translate-x-0 sm:transform-gpu"
					aria-hidden="true"
				>
					<div
						class="aspect-[1097/845] w-[68.5625rem] bg-gradient-to-tr from-[#ff4694] to-[#776fff] opacity-20"
						style="
							clip-path: polygon(
								74.1% 44.1%,
								100% 61.6%,
								97.5% 26.9%,
								85.5% 0.1%,
								80.7% 2%,
								72.5% 32.5%,
								60.2% 62.4%,
								52.4% 68.1%,
								47.5% 58.3%,
								45.2% 34.5%,
								27.5% 76.7%,
								0.1% 64.9%,
								17.9% 100%,
								27.6% 76.8%,
								76.1% 97.7%,
								74.1% 44.1%
							);
						"
					></div>
				</div>
				<div class="px-6 mx-auto max-w-7xl lg:px-8">
					<div class="max-w-2xl mx-auto lg:mx-0">
						<h2
							class="text-4xl font-bold tracking-tight text-white sm:text-6xl"
						>
							{{ managerData.player_first_name }}
							{{ managerData.player_last_name }}
						</h2>
						<pre class="text-white">{{ managerData.name }}</pre>
						<p class="mt-1 text-sm leading-8 text-gray-300">
							Active for
							<span class="font-bold">{{ managerData.years_active }}</span>
							years
						</p>
					</div>
					<div
						v-if="managerData && managerData.leagues"
						class="max-w-2xl mx-auto mt-0 lg:mx-0 lg:max-w-none"
					>
						<dl
							class="grid grid-cols-2 gap-8 mt-2 sm:mt-4 sm:grid-cols-2 lg:grid-cols-4"
						>
							<div class="flex flex-col-reverse">
								<dt class="text-base leading-7 text-gray-300">Points</dt>
								<dd
									class="text-2xl font-bold leading-9 tracking-tight text-white"
								>
									{{ managerData.summary_overall_points }}
								</dd>
							</div>

							<div
								v-if="managerData.leagues && managerData.leagues.classic"
								class="flex flex-col-reverse"
							>
								<dt class="text-base leading-7 text-gray-300">Leagues</dt>
								<dd
									class="text-2xl font-bold leading-9 tracking-tight text-white"
								>
									{{ managerData.leagues.classic.length }}
								</dd>
							</div>
							<div class="flex flex-col-reverse">
								<dt class="text-base leading-7 text-gray-300">Overall rank</dt>
								<dd
									class="text-2xl font-bold leading-9 tracking-tight text-white"
								>
									{{
										new Intl.NumberFormat().format(
											managerData.summary_overall_rank
										)
									}}
								</dd>
							</div>
							<div class="flex flex-col-reverse">
								<dt class="text-base leading-7 text-gray-300">Event rank</dt>
								<dd
									class="text-2xl font-bold leading-9 tracking-tight text-white"
								>
									{{
										new Intl.NumberFormat().format(
											managerData.summary_event_rank
										)
									}}
								</dd>
							</div>
						</dl>
					</div>
				</div>
			</div>
		</div>

		<div v-if="managerData && managerData.leagues" class="my-6">
			<h1 class="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
				Classic Leagues
			</h1>
			<AppCarousel class="w-full max-w-5xl mx-auto">
				<LeagueInfoCard
					v-for="league in managerData?.leagues.classic"
					:key="league.id"
					class="w-full max-w-md shrink-0 snap-start"
					:league="league"
				/>
			</AppCarousel>
		</div>

		<div
			class="max-w-5xl pb-12 mx-auto overflow-hidden rounded-lg shadow-lg bg-gray-50"
		>
			<!-- <div class="p-4 bg-gray-800">
				<h2 class="text-lg font-semibold text-white">ManagerData Picks</h2>
				<p class="text-sm text-gray-400">Gameweek 3</p>
			</div> -->
			<div
				v-if="managerData && managerData.player_first_name"
				class="max-w-2xl px-3 py-6 mx-auto text-center"
			>
				<p
					class="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl"
				>
					{{ managerData.player_first_name }}'s picks
				</p>
				<h4 class="text-xs font-light">
					With predicted points for the next 5 weeks
				</h4>
				<h2 class="mt-4 text-base font-semibold leading-7 text-indigo-600">
					GAMEWEEK {{ managerData.current_event }}
				</h2>

				<div class="flex">
					<div class="flex flex-col max-w-xs mx-auto gap-y-0">
						<dt class="text-base leading-5 text-gray-600">Team points</dt>
						<dd
							class="order-first text-2xl font-bold tracking-tight text-gray-900 sm:text-4xl"
						>
							{{ teamPoints }}
						</dd>
					</div>

					<div class="flex flex-col max-w-xs mx-auto gap-y-0">
						<dt class="text-base leading-5 text-gray-600">Team Cost</dt>
						<dd
							class="order-first text-2xl font-bold tracking-tight text-gray-900 sm:text-4xl"
						>
							{{ teamCost / 10 }}m
						</dd>
					</div>
				</div>

				<!-- <pre>{{ picks[0] }}</pre> -->
			</div>
			<div class="p-4 bg-gray-50">
				<div
					v-if="picks && picks.length > 0"
					class="flex flex-col gap-4 text-gray-700 gap-y-12 sm:gap-y-16"
				>
					<div>
						<div
							class="col-span-3 font-mono font-bold text-center text-gray-400 uppercase"
						>
							Forwards
						</div>
						<!-- <pre>{{ groupedByType.Midfielder }}</pre> -->
						<div
							v-if="groupedByType && groupedByType.Forward"
							class="flex flex-wrap items-start justify-center w-full gap-x-6 gap-y-12"
						>
						
							<PlayerCardPick
								:pick="pick"
								v-for="pick in groupedByType.Forward"
								:key="pick"
							/>
						</div>
					</div>

					<div>
						<div
							class="col-span-3 font-mono font-bold text-center text-gray-400 uppercase"
						>
							Midfielders
						</div>
						<div
							v-if="groupedByType && groupedByType.Midfielder"
							class="flex flex-wrap items-start justify-center w-full gap-x-6 gap-y-12"
						>
							<PlayerCardPick
								:pick="pick"
								v-for="pick in groupedByType.Midfielder"
								:key="pick"
							/>
						</div>
					</div>

					<div>
						<div
							class="col-span-3 font-mono font-bold text-center text-gray-400 uppercase"
						>
							Defenders
						</div>
						<div
							v-if="groupedByType && groupedByType.Defender"
							class="flex flex-wrap items-start justify-center w-full gap-x-6 gap-y-12"
						>
							<PlayerCardPick
								:pick="pick"
								v-for="pick in groupedByType.Defender"
								:key="pick"
							/>
						</div>
					</div>
					<div>
						<div
							class="col-span-3 font-mono font-bold text-center text-gray-400 uppercase"
						>
							Goalkeepers
						</div>
						<div
							v-if="groupedByType && groupedByType.Goalkeeper"
							class="flex flex-wrap items-start justify-center w-full gap-x-6 gap-y-12"
						>
							<PlayerCardPick
								:pick="pick"
								v-for="pick in groupedByType.Goalkeeper"
								:key="pick"
							/>
						</div>
					</div>
					<div>
						<div
							class="col-span-3 font-mono font-bold text-center text-gray-400 uppercase"
						>
							Bench
						</div>
						<div
							v-if="bench"
							class="flex flex-wrap items-start justify-center w-full gap-x-6 gap-y-12"
						>
						<!-- <pre>{{ bench }}</pre> -->
							<PlayerCardPick :pick="pick" v-for="pick in bench" :key="pick" />
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
	const bench = ref([]);
	const startingXI = ref([]);
	const groupedByType = ref();

	const managerData = useState("manager", () => []);

	const { data: manager, error } = useFetch(`/api/managers/${id}`);
	const { data: bootstrap } = useLazyFetch(`/api/bootstrap-static`);
	const { data: predictions } = useLazyFetch(`/api/predictions`);

	const teamCost = ref(0);
	const teamPoints = ref(0);

	watchEffect(async () => {
		if (manager.value && bootstrap.value) {
			picks.value = await $fetch(
				`/api/managers/picks/?gw=${manager.value.current_event}&id=${manager.value.id}`
			);

			picks.value.map((pick) => {
				const element = getPlayerInfo(pick.element, bootstrap.value);
				pick.element = element;
				pick.element_type = getPositionName(element.element_type);
				pick.predictions = getPredictionsOfPlayer(
					predictions.value,
					pick.element.code
				);
				return pick;
			});

			// Separate last 4 elements as bench
			bench.value = picks.value.slice(-4);

			// Separate starting XI
			startingXI.value = picks.value.slice(0, -4);

			// Group players by element_type
			groupedByType.value = startingXI.value.reduce((acc, player) => {
				const { element_type } = player;
				if (!acc[element_type]) {
					acc[element_type] = [];
				}
				acc[element_type].push(player);
				return acc;
			}, {});

			teamCost.value = startingXI.value.reduce((total, pick) => {
				const element = getPlayerInfo(pick.element.id, bootstrap.value);
				return total + element.now_cost; // Assuming 'cost' is the property for player cost
			}, 0);

			teamPoints.value = startingXI.value.reduce((total, pick) => {
				const element = getPlayerInfo(pick.element.id, bootstrap.value);
				return total + element.total_points; // Assuming 'cost' is the property for player cost
			}, 0);

			managerData.value = manager.value;

			localStorage.setItem("savedManagerId", id);
		}
	});
</script>
