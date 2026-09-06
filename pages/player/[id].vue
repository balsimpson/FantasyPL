<template>
	<div class="relative min-h-screen overflow-hidden text-stone-50">


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
							<h1 class="text-xl font-semibold tracking-tight text-white sm:text-2xl">
								Loading player details
							</h1>
						</div>
					</div>
				</UCard>
			</section>
		</div>

		<div v-else class="relative mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
      <UBreadcrumb :items="breadcrumbLinks" class="min-w-0" :ui="{ link: 'text-stone-300 hover:text-white', linkLabel: 'truncate' }" />
      <section v-if="playerData">
        <PlayerPerformanceCard :player="playerData" :bootstrap="bootstrap" />
        <div class="mt-3 flex justify-end">
          <PlayerWatchlistButton :player="playerData" />
        </div>
      </section>

			<section class="grid gap-6 lg:grid-cols-2">
				<div class="">
					<div class="border-b border-white/10 pb-4">
						<h2 class="text-xl font-semibold tracking-tight text-white sm:text-2xl">
							Next fixtures
						</h2>
					</div>

					<div v-if="player && fixtureCount" aria-label="Upcoming fixtures" class="mt-1 max-h-[420px] divide-y divide-white/10 overflow-y-auto pr-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lime-200" tabindex="0" role="region">
						<PlayerFixtureCard
							v-for="fixture in upcomingFixtures"
							:key="fixture.id"
							:fixture="fixture"
							:bootstrap="bootstrap"
						/>
					</div>
					<p v-else-if="player" class="px-5 py-6 text-sm leading-6 text-stone-400 sm:px-6">
						No upcoming fixtures available.
					</p>
					<p v-else class="px-5 py-6 text-sm leading-6 text-stone-400 sm:px-6">
						Loading fixture data.
					</p>
				</div>

				<div class="">
					<div class="border-b border-white/10 pb-4">
						<h2 class="text-xl font-semibold tracking-tight text-white sm:text-2xl">
							Recent matches
						</h2>
					</div>

					<div v-if="player && recentHistory.length" aria-label="Recent matches" class="mt-1 max-h-[420px] divide-y divide-white/10 overflow-y-auto pr-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lime-200" tabindex="0" role="region">
						<PlayerHistoryCard
							v-for="history in recentHistory"
							:key="history.fixture"
							:history="history"
							:bootstrap="bootstrap"
						/>
					</div>
					<p v-else-if="player" class="px-5 py-6 text-sm leading-6 text-stone-400 sm:px-6">
						No recent match data available.
					</p>
					<p v-else class="px-5 py-6 text-sm leading-6 text-stone-400 sm:px-6">
						Loading match history.
					</p>
				</div>
			</section>

			<section class="">
				<div class="border-b border-white/10 pb-4">
					<h2 class="text-xl font-semibold tracking-tight text-white sm:text-2xl">
						Previous seasons
					</h2>
				</div>

				<div v-if="player && pastSeasons.length" aria-label="Previous seasons" class="mt-1 max-h-[420px] divide-y divide-white/10 overflow-y-auto pr-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lime-200" tabindex="0" role="region">
					<PlayerSeasonCard
						v-for="season in pastSeasons"
						:key="season.season_name"
						:season="season"
					/>
				</div>
				<p v-else-if="player" class="px-5 py-6 text-sm leading-6 text-stone-400 sm:px-6">
					No past season data available.
				</p>
				<p v-else class="px-5 py-6 text-sm leading-6 text-stone-400 sm:px-6">
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
