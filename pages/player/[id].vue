<template>
	<main id="main-content" class="relative min-h-screen text-stone-50">


		<div
			v-if="pageState === 'error'"
			class="site-content-rail relative flex min-h-[70vh] items-center py-10"
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
			class="site-content-rail relative flex min-h-[70vh] items-center py-10"
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

		<div v-else class="site-content-rail relative flex w-full flex-col gap-8 py-5 sm:py-7">
      <UBreadcrumb :items="breadcrumbLinks" class="min-w-0" :ui="{ link: 'text-stone-300 hover:text-white', linkLabel: 'whitespace-normal [overflow-wrap:anywhere]' }" />
      <p v-if="bootstrap?.fetchedAt" class="text-xs text-stone-400">
        FPL data updated <time :datetime="bootstrap.fetchedAt">{{ new Date(bootstrap.fetchedAt).toUTCString() }}</time>
      </p>
      <PlayerPerformanceCard v-if="playerData" :player="playerData" :bootstrap="bootstrap" />
      <PlayerProfileHistory
        :player-id="playerId"
        :details="player"
        :bootstrap="bootstrap"
        :loading="!player && (playerStatus === 'idle' || playerStatus === 'pending')"
        :error="Boolean(playerError) && !player"
        @retry="refreshPlayer()"
      />
    </div>
	</main>
</template>

<script setup>
	import { getPlayerIdFromRouteParam, getPlayerRoute } from "~/composables/usePlayerRoute";

	const route = useRoute();
	const playerId = computed(() => getPlayerIdFromRouteParam(route.params.id));
	const playersStore = usePlayersStore();
	const { bootstrap, loading: bootstrapLoading } = storeToRefs(playersStore);

	const bootstrapRequest = useAsyncData("player-bootstrap", () => playersStore.fetchPlayers());
	const {
		data: player,
		status: playerStatus,
		error: playerError,
		refresh: refreshPlayer,
	} = useLazyFetch(() => `/api/players/${playerId.value}`, { server: false, retry: 0 });
	const { pending: bootstrapPending } = await bootstrapRequest;
	const bootstrapRecovering = ref(!Array.isArray(bootstrap.value?.elements));
	onMounted(async () => {
		if (!bootstrapRecovering.value) return;
		try { await playersStore.fetchPlayers(true); }
		finally { bootstrapRecovering.value = false; }
	});

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
	const bootstrapRequestPending = computed(() => bootstrapPending.value || bootstrapLoading.value || bootstrapRecovering.value);
	const bootstrapFailed = computed(() => !bootstrapRequestPending.value && !hasBootstrapCatalog.value);
	const isMalformedPlayerRoute = computed(() => !/^[1-9]\d*$/.test(String(playerId.value).trim()));
	const isPlayerNotFound = computed(() => {
		if (isMalformedPlayerRoute.value) return true;
		return hasBootstrapCatalog.value && !playerData.value;
	});

	const isTemporaryFailure = computed(() => !isPlayerNotFound.value && bootstrapFailed.value);

	const pageState = computed(() => {
		if (isPlayerNotFound.value || isTemporaryFailure.value) return "error";
		if (bootstrapRequestPending.value) return "loading";

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

</script>
