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
				</div>
				<div class="flex items-center gap-3">
					<span class="inline-flex rounded-full border border-lime-300/40 px-2.5 py-1 text-[11px] font-medium uppercase leading-none tracking-[0.08em] text-lime-300">GW {{ managerData.current_event }}</span>
					<UButton to="/" icon="i-lucide-arrow-left" color="neutral" variant="ghost" size="sm" class="size-9 justify-center rounded-full border border-white/10 bg-white/[0.04] p-0 text-stone-300 hover:border-primary/40 hover:bg-white/[0.08] hover:text-white" aria-label="Back to home" />
				</div>
			</header>

			<div class="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
				<aside aria-label="Manager summary" class="min-w-0 space-y-6 lg:col-start-2 lg:row-start-1">
					<section aria-label="Season summary" class="rounded-2xl border border-white/10 bg-[#101216] p-5">
						<div class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 lg:grid-cols-1">
							<div class="flex min-w-0 items-center gap-3">
								<UAvatar :text="managerInitials" size="md" class="shrink-0 bg-primary/10 text-primary" />
								<div class="min-w-0">
									<p class="font-semibold text-white [overflow-wrap:anywhere]">{{ managerDisplayName }}</p>
									<p class="text-xs text-stone-400">{{ managerData.years_active }} years in FPL</p>
								</div>
							</div>
							<dl class="text-right lg:text-left">
								<dt class="text-xs text-stone-300 lg:text-sm">Season points</dt>
								<dd class="mt-1 text-4xl font-black tracking-tight tabular-nums text-primary lg:text-6xl">{{ formatNumber(managerData.summary_overall_points) }}</dd>
							</dl>
						</div>
						<dl class="mt-4 grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
							<div><dt class="text-xs text-stone-400">Overall rank</dt><dd class="mt-1 text-xl font-bold tabular-nums text-white">{{ formatNumber(managerData.summary_overall_rank) }}</dd></div>
							<div><dt class="text-xs text-stone-400">Gameweek rank</dt><dd class="mt-1 text-xl font-bold tabular-nums text-white">{{ formatNumber(managerData.summary_event_rank) }}</dd></div>
						</dl>
					</section>

					<section aria-label="Classic leagues" class="hidden lg:block">
						<ManagerLeagueStandings :leagues="decoratedClassicLeagues" />
					</section>
				</aside>

				<ManagerSquadBoard v-if="hasPicks" :key="id" :squad="squadState" class="lg:col-start-1 lg:row-start-1" />
				<section v-else-if="isSquadLoading" class="space-y-4 lg:col-start-1 lg:row-start-1" role="status" aria-label="Loading squad">
					<USkeleton class="h-10 w-48" /><USkeleton class="h-[36rem] w-full rounded-2xl" />
				</section>
				<section v-else class="space-y-2 py-4 lg:col-start-1 lg:row-start-1">
					<h2 class="text-xl font-bold text-white">Squad unavailable</h2>
					<p class="text-sm text-stone-400">{{ squadError ? 'The squad could not load. Try again shortly.' : 'The squad for this manager is not available yet.' }}</p>
					<UButton v-if="squadError" icon="i-lucide-refresh-cw" color="primary" variant="soft" @click="refreshSquad">Try again</UButton>
				</section>
			</div>
			<section class="lg:hidden" aria-label="Classic leagues">
				<ManagerLeagueStandings :leagues="decoratedClassicLeagues" />
			</section>
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

const managerInitials = computed(() => {
	return managerDisplayName.value
		.split(" ")
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part.charAt(0).toUpperCase())
		.join("") || "M";
});

const decoratedClassicLeagues = computed(() => {
	return classicLeagues.value.map((league) => ({
		...league,
		rankMovement: getRankMovement(league),
	}));
});

</script>
