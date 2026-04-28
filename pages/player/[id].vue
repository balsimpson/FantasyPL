<template>
	<div class="relative min-h-screen overflow-hidden text-stone-50">
		<!-- <div
			class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(200,255,61,0.08),transparent_30%),radial-gradient(circle_at_100%_20%,rgba(72,214,255,0.06),transparent_24%),linear-gradient(135deg,#111317_0%,#090a0d_100%)]"
		/>
		<div
			class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-size-[5px_5px] opacity-10"
		/> -->

		<div class="relative mx-auto flex w-full max-w-6xl flex-col gap-6 ">
			<section class="overflow-hidden rounded-4xl ">
		<div class="relative z-10 flex flex-col gap-6 p-3 sm:p-6">
			<div class="max-w-2xl px-5 pt-5 sm:px-6">
				<p class="text-[0.68rem] font-semibold uppercase tracking-[0.34em] text-stone-400">
					Player overview
				</p>
				<h1 class="mt-3 text-4xl font-black leading-[0.92] tracking-tight text-balance text-white sm:text-6xl">
					{{ playerName }}
				</h1>
				<p class="mt-4 max-w-xl text-sm leading-6 text-stone-300 sm:text-base">
					{{ playerSummary }}
				</p>
			</div>

			<!-- <div class="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-5">
				<div class="max-w-2xl">
					<p class="text-[0.68rem] font-semibold uppercase tracking-[0.34em] text-stone-400">
								Player overview
							</p>
							<h1 class="mt-3 text-4xl font-black leading-[0.92] tracking-tight text-balance text-white sm:text-6xl">
								{{ playerName }}
							</h1>
							<p class="mt-4 max-w-xl text-sm leading-6 text-stone-300 sm:text-base">
								{{ playerSummary }}
							</p>
						</div>

						<div class="grid min-w-full gap-3 sm:min-w-[18rem] sm:grid-cols-2">
							<div class="rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-3">
								<p class="text-[0.54rem] font-semibold uppercase tracking-[0.28em] text-stone-400">
									Team
								</p>
								<p class="mt-1 text-sm font-semibold text-white">
									{{ playerTeam }}
								</p>
							</div>
							<div class="rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-3">
								<p class="text-[0.54rem] font-semibold uppercase tracking-[0.28em] text-stone-400">
									Role
								</p>
								<p class="mt-1 text-sm font-semibold text-white">
									{{ playerRole }}
								</p>
							</div>
							<div class="rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-3">
								<p class="text-[0.54rem] font-semibold uppercase tracking-[0.28em] text-stone-400">
									Selected
								</p>
								<p class="mt-1 text-sm font-semibold text-white">
									{{ playerSelectedBy }}
								</p>
							</div>
							<div class="rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-3">
								<p class="text-[0.54rem] font-semibold uppercase tracking-[0.28em] text-stone-400">
									Value
								</p>
								<p class="mt-1 text-sm font-semibold text-white">
									{{ playerPrice }}
								</p>
							</div>
						</div>
					</div> -->

					<!-- <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
						<div class="rounded-[22px] border border-white/10 bg-white/4 px-4 py-3">
							<p class="text-[0.54rem] font-semibold uppercase tracking-[0.28em] text-stone-400">
								Form
							</p>
							<p class="mt-1 font-serif text-2xl font-black leading-none text-white">
								{{ playerForm }}
							</p>
						</div>
						<div class="rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-3">
							<p class="text-[0.54rem] font-semibold uppercase tracking-[0.28em] text-stone-400">
								Minutes
							</p>
							<p class="mt-1 font-serif text-2xl font-black leading-none text-white">
								{{ playerMinutes }}
							</p>
						</div>
						<div class="rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-3">
							<p class="text-[0.54rem] font-semibold uppercase tracking-[0.28em] text-stone-400">
								Points
							</p>
							<p class="mt-1 font-serif text-2xl font-black leading-none text-white">
								{{ playerPoints }}
							</p>
						</div>
						<div class="rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-3">
							<p class="text-[0.54rem] font-semibold uppercase tracking-[0.28em] text-stone-400">
								ICT rank
							</p>
							<p class="mt-1 font-serif text-2xl font-black leading-none text-white">
								{{ playerIctRank }}
							</p>
						</div>
					</div> -->

					<div class="space-y-4 ">
						<!-- <div class="flex flex-wrap items-end justify-between gap-3">
							<div>
								<p class="text-[0.62rem] font-semibold uppercase tracking-[0.34em] text-stone-400">
									Live summary
								</p>
								<p class="mt-2 max-w-xl text-sm leading-6 text-stone-300">
									Current form, fixtures, and history in one view.
								</p>
							</div>
						</div> -->

						<div v-if="playerData" class="mx-auto ">
							<PlayerPerformanceCard :player="playerData" :bootstrap="bootstrap" />
						</div>
						<div
							v-else
							class="rounded-[28px] border border-white/10 bg-white/[0.03] px-5 py-6 text-sm text-stone-500"
						>
							Loading player details.
						</div>
					</div>
				</div>
			</section>

			<section class="grid gap-6 lg:grid-cols-2">
				<div class="">
					<div class="border-b border-white/10 px-5 pb-5 pt-5 sm:px-6">
						<p class="text-[0.62rem] font-semibold uppercase tracking-[0.34em] text-stone-400">
							Short term
						</p>
						<h2 class="mt-2 text-3xl font-black leading-none tracking-tight text-white sm:text-5xl">
							Next Fixtures
						</h2>
						<p class="mt-3 max-w-xl text-sm leading-6 text-stone-300">
							A quick read on the path ahead and how sharp the schedule looks.
						</p>
					</div>

					<div v-if="player && fixtureCount" class="mt-3 grid max-h-[340px] grid-cols-1 gap-2 overflow-auto p-4 sm:p-6 snap-y scroll-smooth snap-mandatory">
						<PlayerFixtureCard
							v-for="fixture in upcomingFixtures"
							:key="fixture.id"
							:fixture="fixture"
							:bootstrap="bootstrap"
						/>
					</div>
					<p v-else-if="player" class="px-5 py-6 text-sm leading-6 text-stone-500 sm:px-6">
						No upcoming fixtures available.
					</p>
					<p v-else class="px-5 py-6 text-sm leading-6 text-stone-500 sm:px-6">
						Loading fixture data.
					</p>
				</div>

				<div class="">
					<div class="border-b border-white/10 px-5 pb-5 pt-5 sm:px-6">
						<p class="text-[0.62rem] font-semibold uppercase tracking-[0.34em] text-stone-400">
							Recent form
						</p>
						<h2 class="mt-2 text-3xl font-black leading-none tracking-tight text-white sm:text-5xl">
							Recent Matches
						</h2>
						<p class="mt-3 max-w-xl text-sm leading-6 text-stone-300">
							The latest games, reversed for faster scanning from newest to oldest.
						</p>
					</div>

					<div v-if="player && recentHistory.length" class="mt-3 grid max-h-[340px] grid-cols-1 gap-2 overflow-auto p-4 sm:p-6 snap-y scroll-smooth snap-mandatory">
						<PlayerHistoryCard
							v-for="history in recentHistory"
							:key="history.fixture"
							:history="history"
							:bootstrap="bootstrap"
						/>
					</div>
					<p v-else-if="player" class="px-5 py-6 text-sm leading-6 text-stone-500 sm:px-6">
						No recent match data available.
					</p>
					<p v-else class="px-5 py-6 text-sm leading-6 text-stone-500 sm:px-6">
						Loading match history.
					</p>
				</div>
			</section>

			<section class="">
				<div class="border-b border-white/10 px-5 pb-5 pt-5 sm:px-6">
					<p class="text-[0.62rem] font-semibold uppercase tracking-[0.34em] text-stone-400">
						Season archive
					</p>
					<h2 class="mt-2 text-3xl font-black leading-none tracking-tight text-white sm:text-5xl">
						Previous Seasons
					</h2>
					<p class="mt-3 max-w-xl text-sm leading-6 text-stone-300">
						Longer-term history for context when current form only tells part of the story.
					</p>
				</div>

				<div v-if="player && pastSeasons.length" class="mt-3 grid max-h-[340px] grid-cols-1 gap-2 overflow-auto p-4 sm:p-6 snap-y scroll-smooth snap-mandatory">
					<PlayerSeasonCard
						v-for="season in pastSeasons"
						:key="season.season_name"
						:season="season"
					/>
				</div>
				<p v-else-if="player" class="px-5 py-6 text-sm leading-6 text-stone-500 sm:px-6">
					No past season data available.
				</p>
				<p v-else class="px-5 py-6 text-sm leading-6 text-stone-500 sm:px-6">
					Loading season history.
				</p>
			</section>
		</div>
	</div>
</template>

<script setup>
	import { getPlayerIdFromRouteParam } from "~/composables/usePlayerRoute";

	const route = useRoute();
	const playerId = computed(() => getPlayerIdFromRouteParam(route.params.id));
	const playersStore = usePlayersStore();
	const { bootstrap } = storeToRefs(playersStore);
	const canonicalUrl = useCanonicalUrl();

	useHead({
		link: [{ rel: "canonical", href: canonicalUrl }],
	});

	const { data: player } = useFetch(() => `/api/players/${playerId.value}`);
	await useAsyncData("bootstrap", () => playersStore.fetchPlayers());
	// const { data: fixtures } = useLazyFetch("/api/fixtures");

	const playerData = computed(() => {
		if (bootstrap.value?.elements) {
			const foundPlayer = bootstrap.value.elements.find((item) => item.id == playerId.value);

			if (!foundPlayer) {
				return null;
			}

			return {
				...foundPlayer,
				teamData: bootstrap.value.teams?.find((team) => team.id == foundPlayer.team) || null,
			};
		}

		return null;
	});

	const elementTypeMap = {
		1: "Goalkeeper",
		2: "Defender",
		3: "Midfielder",
		4: "Forward",
	};

	const playerName = computed(() => {
		if (!playerData.value) return "Loading player...";

		return (
			`${playerData.value.first_name || ""} ${playerData.value.second_name || ""}`.trim() ||
			playerData.value.web_name ||
			"Unknown Player"
		);
	});

	const playerTeam = computed(() => playerData.value?.teamData?.name || "Loading team...");

	const playerRole = computed(() => elementTypeMap[playerData.value?.element_type] || "Loading role...");

	const playerSummary = computed(() => {
		if (!playerData.value) {
			return "Pulling the latest data so the page can show form, fixtures, and history in one place.";
		}

		return `See ${playerData.value.web_name || playerName.value}'s Fantasy Premier League stats, fixtures, ownership, form, and history in one place to plan your next move.`;
	});

	const playerMetaName = computed(() => playerData.value?.web_name || playerName.value);

	useSeoMeta({
		title: computed(() => `${playerName.value} FPL Stats, Fixtures & Ownership`),
		description: computed(() => playerSummary.value),
		ogTitle: computed(() => `${playerName.value} FPL Stats, Fixtures & Ownership | FPL Insights`),
		ogDescription: computed(() =>
			`See ${playerMetaName.value}'s Fantasy Premier League stats, fixtures, ownership, and form with FPL Insights.`
		),
		twitterTitle: computed(() => `${playerName.value} FPL Stats, Fixtures & Ownership | FPL Insights`),
		twitterDescription: computed(() =>
			`Track ${playerMetaName.value}'s FPL stats, fixtures, ownership, and form in one place.`
		),
	});

	const formatCompact = (value) => {
		const number = Number(value || 0);

		return new Intl.NumberFormat("en", {
			notation: "compact",
			maximumFractionDigits: 1,
		}).format(number);
	};

	const formatPercent = (value) => {
		const number = Number(value || 0);

		return number % 1 === 0 ? `${number.toFixed(0)}%` : `${number.toFixed(1)}%`;
	};

	const formatCost = (value) => {
		const cost = Number(value || 0) / 10;

		return `${cost.toFixed(cost % 1 === 0 ? 0 : 1)}m`;
	};

	const playerForm = computed(() => (playerData.value ? String(playerData.value.form ?? "—") : "—"));
	const playerMinutes = computed(() => (playerData.value ? formatCompact(playerData.value.minutes) : "—"));
	const playerPoints = computed(() => (playerData.value ? formatCompact(playerData.value.total_points ?? playerData.value.event_points) : "—"));
	const playerIctRank = computed(() => {
		if (!playerData.value || playerData.value.ict_index_rank == null) return "—";

		return `#${formatCompact(playerData.value.ict_index_rank)}`;
	});
	const playerSelectedBy = computed(() => (playerData.value ? formatPercent(playerData.value.selected_by_percent) : "—"));
	const playerPrice = computed(() => (playerData.value ? formatCost(playerData.value.now_cost) : "—"));

	const upcomingFixtures = computed(() => player.value?.fixtures || []);
	const recentHistory = computed(() => [...(player.value?.history || [])].reverse());
	const pastSeasons = computed(() => [...(player.value?.history_past || [])].reverse());

	const fixtureCount = computed(() => upcomingFixtures.value.length);
</script>
