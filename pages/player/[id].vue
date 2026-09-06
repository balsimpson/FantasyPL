<template>
	<div class="relative min-h-screen overflow-hidden text-stone-50">
		<!-- <div
			class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(200,255,61,0.08),transparent_30%),radial-gradient(circle_at_100%_20%,rgba(72,214,255,0.06),transparent_24%),linear-gradient(135deg,#111317_0%,#090a0d_100%)]"
		/>
		<div
			class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-size-[5px_5px] opacity-10"
		/> -->

		<div
			v-if="pageState === 'error'"
			class="relative mx-auto flex min-h-[70vh] w-full max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-8"
		>
			<section class="w-full">
				<UCard
					:ui="{ body: 'p-6 sm:p-8', root: 'ring-0 overflow-hidden' }"
					class="mx-auto w-full max-w-2xl border border-white/10 bg-gradient-to-br from-white/[0.07] via-white/[0.03] to-transparent text-stone-50"
				>
					<div class="space-y-5">
						<div>
							<h1 class="text-3xl font-black tracking-tight text-white sm:text-4xl">
								{{ playerErrorTitle }}
							</h1>
							<p class="mt-3 text-sm leading-6 text-stone-300 sm:text-base">
								{{ playerErrorDescription }}
							</p>
					</div>

					<div class="flex flex-col justify-center gap-3 sm:flex-row">
						<UButton to="/" color="primary">
							Search players
						</UButton>
						<UButton
							v-if="isTemporaryFailure"
							color="neutral"
							variant="soft"
							:loading="isRetrying"
							@click="retryPlayer"
						>
							Try again
						</UButton>
					</div>
				</div>
				</UCard>
			</section>
		</div>

		<div
			v-else-if="pageState === 'loading'"
			class="relative mx-auto flex min-h-[70vh] w-full max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-8"
		>
			<section class="w-full">
				<UCard
					:ui="{ body: 'p-6 sm:p-8', root: 'ring-0' }"
					class="mx-auto w-full max-w-2xl border border-white/10 bg-white/[0.03] text-stone-50"
				>
					<div class="flex items-center gap-4">
						<span
							aria-hidden="true"
							class="size-7 shrink-0 animate-spin rounded-full border-2 border-white/15 border-t-primary"
						/>
						<div>
							<h1 class="text-2xl font-black tracking-tight text-white sm:text-3xl">
								Loading player details
							</h1>
						</div>
					</div>
				</UCard>
			</section>
		</div>

		<div v-else class="relative mx-auto flex w-full max-w-6xl flex-col gap-6">
			<section class="overflow-hidden rounded-4xl ">
		<div class="relative z-10 flex flex-col gap-6 p-3 sm:p-6">
			<div class="max-w-2xl px-5 pt-5 sm:px-6">
				<UBreadcrumb
					:items="breadcrumbLinks"
					separator-icon="i-lucide-chevron-right"
					class="pb-4"
					:ui="{
						root: 'max-w-full',
						list: 'flex items-center gap-1.5 text-sm',
						item: 'min-w-0',
						link: 'flex items-center gap-1.5 text-stone-400 transition-colors hover:text-white',
						linkLabel: 'truncate',
						separator: 'flex text-stone-600',
						separatorIcon: 'size-4',
					}"
				/>
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
							<div class="mx-auto mt-4 flex w-full max-w-xl flex-col gap-3 px-1 sm:flex-row sm:items-center sm:justify-between">
								<p class="text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-stone-500">
									Saved on this browser · no account sync
								</p>
								<PlayerWatchlistButton :player="playerData" class="shrink-0" />
							</div>
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
	import { getPlayerIdFromRouteParam, getPlayerRoute } from "~/composables/usePlayerRoute";

	const route = useRoute();
	const playerId = computed(() => getPlayerIdFromRouteParam(route.params.id));
	const playersStore = usePlayersStore();
	const { bootstrap, loading: bootstrapLoading } = storeToRefs(playersStore);

	const playerRequest = useFetch(() => `/api/players/${playerId.value}`);
	const bootstrapRequest = useAsyncData("player-bootstrap", () => playersStore.fetchPlayers());
	const {
		data: player,
		pending: playerPending,
		error: playerError,
		refresh: refreshPlayer,
	} = await playerRequest;
	const { pending: bootstrapPending } = await bootstrapRequest;
	// const { data: fixtures } = useLazyFetch("/api/fixtures");

	const playerData = computed(() => {
		if (Array.isArray(bootstrap.value?.elements)) {
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

	const hasBootstrapCatalog = computed(() => Array.isArray(bootstrap.value?.elements));
	const bootstrapRequestPending = computed(() => bootstrapPending.value || bootstrapLoading.value);
	const bootstrapFailed = computed(() => !bootstrapRequestPending.value && !hasBootstrapCatalog.value);
	const isMalformedPlayerRoute = computed(() => !/^[1-9]\d*$/.test(String(playerId.value).trim()));
	const playerDetailSettled = computed(() => !playerPending.value);
	const allRequestsSettled = computed(() => !playerPending.value && !bootstrapRequestPending.value);

	const getErrorStatusCode = (error) => {
		if (!error || typeof error !== "object") return 0;

		return Number(error.response?.status ?? error.statusCode ?? error.status ?? 0);
	};

	const playerErrorStatus = computed(() => getErrorStatusCode(playerError.value));
	const isPlayerNotFound = computed(() => {
		if (!playerDetailSettled.value) return false;
		if (isMalformedPlayerRoute.value || playerErrorStatus.value === 404) return true;
		if (!allRequestsSettled.value) return false;

		return Boolean(
			hasBootstrapCatalog.value &&
			!bootstrapFailed.value &&
			!playerError.value &&
			player.value &&
			!playerData.value
		);
	});

	const isTemporaryFailure = computed(() => {
		if (!playerDetailSettled.value || isPlayerNotFound.value) return false;
		if (playerError.value && playerErrorStatus.value !== 404) return true;
		if (!allRequestsSettled.value) return false;
		if (bootstrapFailed.value) return true;

		return !player.value || !playerData.value;
	});

	const pageState = computed(() => {
		if (isPlayerNotFound.value || isTemporaryFailure.value) return "error";
		if (!allRequestsSettled.value) return "loading";

		return playerData.value ? "ready" : "error";
	});

	const playerErrorTitle = computed(() => {
		if (isMalformedPlayerRoute.value) return "Invalid player link";
		if (isPlayerNotFound.value) return "Player not found";

		return "Player data is temporarily unavailable";
	});

	const playerErrorDescription = computed(() => {
		if (isMalformedPlayerRoute.value) {
			return "That player link is not valid. Search for a current FPL player to open their profile.";
		}

		if (isPlayerNotFound.value) {
			return "We could not find that player in the current FPL season. Search for another player to continue.";
		}

		return "The latest FPL data is unavailable right now. Try again in a moment.";
	});

	const isRetrying = ref(false);

	const retryPlayer = async () => {
		if (isRetrying.value || !isTemporaryFailure.value) return;

		isRetrying.value = true;

		try {
			const requests = [refreshPlayer()];

			if (bootstrapFailed.value) {
				requests.push(playersStore.fetchPlayers(true));
			}

			await Promise.all(requests);
		} finally {
			isRetrying.value = false;
		}
	};

	if (pageState.value === "error") {
		setResponseStatus(isPlayerNotFound.value ? 404 : 502);
	}

	const preferredPlayerPath = computed(() =>
		playerData.value ? getPlayerRoute(playerData.value) : route.path
	);

	if (playerData.value && route.path !== preferredPlayerPath.value) {
		await navigateTo(preferredPlayerPath.value, { redirectCode: 301, replace: true });
	}

	const canonicalUrl = useCanonicalUrl(preferredPlayerPath);

	useHead({
		link: [{ rel: "canonical", href: canonicalUrl }],
	});

	const elementTypeMap = {
		1: "Goalkeeper",
		2: "Defender",
		3: "Midfielder",
		4: "Forward",
	};

	const playerName = computed(() => {
		if (!playerData.value) {
			if (isMalformedPlayerRoute.value || isPlayerNotFound.value) return "Player not found";
			if (isTemporaryFailure.value) return "Player data unavailable";

			return "Loading player details";
		}

		return (
			`${playerData.value.first_name || ""} ${playerData.value.second_name || ""}`.trim() ||
			playerData.value.web_name ||
			"Unknown Player"
		);
	});

	const breadcrumbLinks = computed(() => [
		{ label: "Home", to: "/" },
		{ label: "Player" },
		{ label: playerName.value },
	]);

	const playerTeam = computed(() => playerData.value?.teamData?.name || "Loading team...");

	const playerRole = computed(() => elementTypeMap[playerData.value?.element_type] || "Loading role...");

	const playerSummary = computed(() => {
		if (!playerData.value) return playerErrorDescription.value;

		return `See ${playerData.value.web_name || playerName.value}'s Fantasy Premier League stats, fixtures, ownership, form, and history in one place to plan your next move.`;
	});

	const playerMetaName = computed(() => playerData.value?.web_name || "this player");
	const playerPageTitle = computed(() => {
		if (playerData.value) return `${playerName.value} FPL Stats, Fixtures & Ownership`;
		if (isMalformedPlayerRoute.value) return "Invalid player link";
		if (isPlayerNotFound.value) return "Player not found";
		if (isTemporaryFailure.value) return "Player data temporarily unavailable";

		return "Loading player details";
	});

	useSeoMeta({
		title: playerPageTitle,
		description: computed(() => playerSummary.value),
		ogTitle: computed(() => `${playerPageTitle.value} | FPL Insights`),
		ogDescription: computed(() =>
			playerData.value
				? `See ${playerMetaName.value}'s Fantasy Premier League stats, fixtures, ownership, and form with FPL Insights.`
				: playerSummary.value
		),
		ogUrl: canonicalUrl,
		twitterTitle: computed(() => `${playerPageTitle.value} | FPL Insights`),
		twitterDescription: computed(() =>
			playerData.value
				? `Track ${playerMetaName.value}'s FPL stats, fixtures, ownership, and form in one place.`
				: playerSummary.value
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
