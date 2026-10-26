<template>
	<main id="main-content" class="site-content-rail flex w-full min-w-0 flex-col gap-8 py-5 text-stone-50 sm:py-7">
		<section v-if="error" class="space-y-4 py-8" aria-live="polite">
			<UAlert color="error" variant="soft" :title="managerErrorTitle" :description="managerErrorDescription" />
			<div class="flex flex-wrap gap-3">
				<UButton v-if="managerLookupUnavailable" icon="i-lucide-refresh-cw" color="primary" :loading="pending" @click="refresh">Try again</UButton>
				<UButton to="/" icon="i-lucide-arrow-left" color="neutral" variant="outline">Go back home</UButton>
			</div>
		</section>

		<template v-else-if="managerData">
			<header class="flex flex-wrap items-center justify-between gap-4">
				<div class="min-w-0">
					<h1 id="manager-title" class="text-3xl font-black tracking-[-0.03em] text-white [overflow-wrap:anywhere] sm:text-4xl">{{ managerData.name }}</h1>
					<p class="mt-1 text-sm text-stone-400">{{ managerDisplayName }} · Manager ID {{ id }}</p>
					<dl class="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-stone-400">
						<div><dt class="inline">Season points </dt><dd class="ml-1 inline font-semibold tabular-nums text-lime-300">{{ formatNumber(managerData.summary_overall_points) }}</dd></div>
						<div><dt class="inline">Overall rank </dt><dd class="ml-1 inline font-semibold tabular-nums text-white">{{ formatNumber(managerData.summary_overall_rank) }}</dd></div>
						<div><dt class="inline">GW rank </dt><dd class="ml-1 inline font-semibold tabular-nums text-white">{{ formatNumber(managerData.summary_event_rank) }}</dd></div>
					</dl>
				</div>
				<div class="flex items-center gap-3">
					<span class="inline-flex rounded-full border border-lime-300/40 px-2.5 py-1 text-[11px] font-medium uppercase leading-none tracking-[0.08em] text-lime-300">GW {{ managerData.current_event }}</span>
					<ManagerShareButton :title="managerData.name" :url="canonicalUrl" />
					<ManagerLeaguesPanel :leagues="decoratedClassicLeagues" :manager-name="managerDisplayName" />
					<UButton to="/" icon="i-lucide-arrow-left" color="neutral" variant="ghost" size="sm" class="size-9 justify-center rounded-full border border-white/10 bg-white/[0.04] p-0 text-stone-300 hover:border-primary/40 hover:bg-white/[0.08] hover:text-white" aria-label="Back to home" />
				</div>
			</header>
			<div class="grid min-w-0 items-start gap-6 xl:grid-cols-[17rem_minmax(0,1fr)]">
			<ManagerGameweekPlanner v-if="hasPicks" :published-gameweek="managerData.current_event"
				:gameweeks="planner.gameweeks.value" :plans="planner.plans.value" :rows="planner.rows.value"
				:selected-plan="planner.selectedPlan.value" :preview-active="planner.previewActive.value"
				:pending="planner.pending.value" :error="planner.error.value"
				@select="planner.selectGameweek" @preview="planner.showPreview" @published="planner.showPublished" @retry="planner.refresh" />

				<ManagerSquadBoard v-if="hasPicks" :key="id" :squad="planner.displaySquad.value"
					:planning-gameweek="planner.previewActive.value ? planner.selectedPlan.value?.gameweek : null"
					:fixture-gameweek="planner.selectedPlan.value?.gameweek" :fixture-rows="planner.rows.value"
					:published-squad="squadState" :plans="planner.plans.value" />
				<section v-else-if="isSquadLoading" class="space-y-4 lg:col-start-1 lg:row-start-1" role="status" aria-label="Loading squad">
					<USkeleton class="h-10 w-48" /><USkeleton class="h-[36rem] w-full rounded-2xl" />
				</section>
				<section v-else class="space-y-2 py-4 lg:col-start-1 lg:row-start-1">
					<h2 class="text-xl font-bold text-white">Squad unavailable</h2>
					<p class="text-sm text-stone-400">{{ squadError ? 'The squad could not load. Try again shortly.' : 'The squad for this manager is not available yet.' }}</p>
					<UButton v-if="squadError" icon="i-lucide-refresh-cw" color="primary" variant="soft" @click="refreshSquad">Try again</UButton>
				</section>
			</div>
			<ManagerTransferRecommendations v-if="hasPicks" :key="id" :manager-id="id" />
		</template>

		<section v-else class="space-y-6 py-4" role="status" aria-label="Loading manager profile">
			<USkeleton class="h-10 w-full max-w-sm" />
			<USkeleton class="h-5 w-48" />
			<div class="grid grid-cols-2 gap-6 sm:grid-cols-4">
				<USkeleton v-for="item in 4" :key="item" class="h-20 rounded-xl" />
			</div>
			<USkeleton class="h-48 w-full rounded-2xl" />
		</section>
	</main>
</template>

<script setup>
	import { useManagerPage } from "~/composables/useManagerPage";
	import ManagerShareButton from "~/components/ManagerShareButton.vue";

	const route = useRoute();
	const id = computed(() => String(route.params.id ?? ""));
	const canonicalUrl = useCanonicalUrl();

	useHead({
		link: [{ rel: "canonical", href: canonicalUrl }],
	});

	const numberFormatter = new Intl.NumberFormat("en-GB");

const formatNumber = (value) => {
	if (value === null || value === undefined || value === "") return "-";

	const numericValue = Number(value);
	return Number.isNaN(numericValue) ? String(value) : numberFormatter.format(numericValue);
};

const getRankMovement = (league) => {
	const currentRank = Number(league?.entry_rank);
	const lastRank = Number(league?.entry_last_rank);

	if (!Number.isFinite(currentRank) || !Number.isFinite(lastRank) || currentRank === 0 || lastRank === 0) {
		return {
			color: "neutral",
			detail: "-",
			icon: "i-lucide-minus",
			label: "No movement",
		};
	}

	const movement = lastRank - currentRank;

	if (movement > 0) {
		return {
			color: "success",
			detail: `+${formatNumber(movement)}`,
			icon: "i-lucide-trending-up",
			label: `Up ${formatNumber(movement)}`,
		};
	}

	if (movement < 0) {
		return {
			color: "error",
			detail: `-${formatNumber(Math.abs(movement))}`,
			icon: "i-lucide-trending-down",
			label: `Down ${formatNumber(Math.abs(movement))}`,
		};
	}

	return {
		color: "neutral",
		detail: "0",
		icon: "i-lucide-minus",
		label: "No movement",
	};
};

const { managerData, squadState, pending, error, isSquadLoading, squadError, refresh, refreshSquad } = useManagerPage(id);
const planner = useManagerPlanner(squadState);
const { remember } = useSavedManagers();

onMounted(() => {
  watch([managerData, pending, error], ([manager, loading, lookupError]) => {
    if (!manager || loading || lookupError) return;
    remember({
      id: String(manager.id),
      teamName: manager.name,
      managerName: `${manager.player_first_name || ""} ${manager.player_last_name || ""}`.trim(),
    });
  }, { immediate: true });
});

const classicLeagues = computed(() => managerData.value?.leagues?.classic ?? []);
const hasPicks = computed(() => (squadState.value?.picks ?? []).length > 0);

const managerErrorStatus = computed(() =>
	Number(error.value?.statusCode ?? error.value?.data?.statusCode ?? error.value?.status ?? 0)
);

const managerLookupUnavailable = computed(() => managerErrorStatus.value < 400 || managerErrorStatus.value >= 500);

const managerErrorTitle = computed(() => {
	if (managerLookupUnavailable.value) return "Manager data temporarily unavailable";
	if (managerErrorStatus.value === 400) return "Invalid Manager ID";
	return "Manager not found";
});

const managerErrorDescription = computed(() => {
	if (managerLookupUnavailable.value) {
		return "The official FPL service could not load this team right now. This does not confirm that the Manager ID is invalid. Try again shortly.";
	}

	if (managerErrorStatus.value === 400) return "Enter a positive numeric Manager ID.";
	return error.value?.statusMessage || error.value?.message || "Sorry, we couldn’t find the manager page you’re looking for.";
});

const managerDisplayName = computed(() => {
	const firstName = managerData.value?.player_first_name ?? "";
	const lastName = managerData.value?.player_last_name ?? "";
	return `${firstName} ${lastName}`.trim() || "Manager";
});

const managerPageTitle = computed(() =>
	managerData.value?.name ? `${managerData.value.name} FPL Team` : `FPL Manager ${id.value} Team`
);

const managerPageDescription = computed(() => {
	const manager = managerData.value;
	if (!manager) {
		return `Explore FPL manager ${id.value}'s team, Gameweek lineup, season points and overall rank.`;
	}

	return `${managerDisplayName.value}'s ${manager.name} FPL team for Gameweek ${manager.current_event}: ${formatNumber(manager.summary_event_points)} gameweek points, ${formatNumber(manager.summary_overall_points)} overall points and overall rank ${formatNumber(manager.summary_overall_rank)}.`;
});

const managerOgPlayers = computed(() =>
	(squadState.value?.startingXI ?? []).map((pick) => ({
		name: pick.element?.web_name ?? "Unknown player",
		position: pick.element_type ?? "Unknown",
		seasonPoints: pick.element?.total_points ?? null,
		isCaptain: Boolean(pick.is_captain),
		isViceCaptain: Boolean(pick.is_vice_captain),
	}))
);

const managerOgFormation = computed(() => {
	if (!managerOgPlayers.value.length) return "Lineup pending";
	return ["Defender", "Midfielder", "Forward"]
		.map((position) => managerOgPlayers.value.filter((player) => player.position === position).length)
		.join("-");
});

useSeoMeta({
	title: managerPageTitle,
	description: managerPageDescription,
	ogTitle: computed(() => `${managerPageTitle.value} | FPL Insights`),
	ogDescription: managerPageDescription,
	ogUrl: canonicalUrl,
	twitterCard: "summary_large_image",
	twitterTitle: computed(() => `${managerPageTitle.value} | FPL Insights`),
	twitterDescription: managerPageDescription,
});

defineOgImageComponent("ManagerTeam", {
	managerId: id,
	managerName: managerDisplayName,
	teamName: computed(() => managerData.value?.name ?? `Manager ${id.value}'s FPL team`),
	currentEvent: computed(() => managerData.value?.current_event ?? null),
	gameweekPoints: computed(() => managerData.value?.summary_event_points ?? null),
	overallPoints: computed(() => managerData.value?.summary_overall_points ?? null),
	overallRank: computed(() => managerData.value?.summary_overall_rank ?? null),
	formation: managerOgFormation,
	players: managerOgPlayers,
	bench: computed(() => (squadState.value?.bench ?? []).map((pick) => ({
		name: pick.element?.web_name ?? "Unknown player",
		position: pick.element_type ?? "Unknown",
		seasonPoints: pick.element?.total_points ?? null,
	}))),
}, {
	width: 1200,
	height: 630,
	extension: "png",
	alt: `Fantasy Premier League starting XI and season stats for manager ${id.value}`,
	cacheMaxAgeSeconds: 60 * 60,
});

const decoratedClassicLeagues = computed(() => {
	return classicLeagues.value.map((league) => ({
		...league,
		rankMovement: getRankMovement(league),
	}));
});

</script>
