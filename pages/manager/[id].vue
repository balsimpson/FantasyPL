<template>
	<main class="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
		<section v-if="error" class="grid min-h-[60vh] place-items-center">
			<UCard
				:ui="{ body: 'p-6 sm:p-8', root: 'ring-0 overflow-hidden' }"
				class="w-full max-w-2xl border border-error/20 bg-gradient-to-br from-error/15 via-white/[0.04] to-transparent text-stone-50"
			>
				<div class="mb-6 flex justify-center">
					<div class="rounded-full border border-error/20 bg-error/10 p-4 text-error">
						<UIcon name="i-lucide-user-x" class="size-9" />
					</div>
				</div>

				<UAlert
					color="error"
					variant="soft"
					title="Manager not found"
					:description="managerErrorDescription"
				/>

				<div class="mt-6 flex justify-center">
					<UButton to="/" icon="i-lucide-arrow-left" color="neutral" variant="soft">
						Go back home
					</UButton>
				</div>
			</UCard>
		</section>

		<section v-else-if="managerData" class="space-y-8">
			<UCard
				:ui="{ body: 'p-6 sm:p-8 lg:p-10', root: 'ring-0 overflow-hidden' }"
				class="border border-white/10 bg-gradient-to-br from-primary/15 via-white/[0.04] to-transparent text-stone-50"
			>
				<div class="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
					<div class="max-w-2xl space-y-6">
						<div class="flex flex-wrap items-center justify-between gap-4">
							<div class="flex items-center gap-4">
								<UAvatar
									:text="managerInitials"
									size="3xl"
									class="border border-white/15 bg-white/10 text-white shadow-xl shadow-black/20"
								/>
								<div class="space-y-2">
									<UBadge color="primary" variant="soft" size="lg">
										Manager profile
									</UBadge>
									<div class="flex flex-wrap gap-2">
										<UBadge color="neutral" variant="subtle">ID {{ id }}</UBadge>
										<UBadge color="neutral" variant="subtle">Gameweek {{ managerData.current_event }}</UBadge>
									</div>
								</div>
							</div>
							<UButton to="/" icon="i-lucide-house" color="neutral" variant="soft" size="sm">
								Home
							</UButton>
						</div>

						<div>
							<h1 class="text-4xl font-black tracking-tight text-white sm:text-6xl">
								{{ managerDisplayName }}
							</h1>
							<p class="mt-3 text-base leading-7 text-stone-300">
								{{ managerData.name }}
							</p>
						</div>

						<div class="flex flex-wrap gap-2">
							<UBadge icon="i-lucide-calendar-days" color="primary" variant="soft">
								Active {{ managerData.years_active }} years
							</UBadge>
							<UBadge icon="i-lucide-shirt" color="neutral" variant="soft">
								{{ formatNumber(classicLeagues.length) }} classic leagues
							</UBadge>
						</div>
					</div>

					<div class="grid w-full gap-3 sm:grid-cols-2 lg:max-w-xl">
						<div
							v-for="stat in managerStats"
							:key="stat.label"
							class="rounded-3xl border border-white/10 bg-zinc-950/25 p-4 shadow-lg shadow-black/10"
						>
							<div class="flex items-start justify-between gap-3">
								<dl>
									<dt class="text-[0.58rem] font-semibold uppercase tracking-[0.28em] text-stone-400">
										{{ stat.label }}
									</dt>
									<dd class="mt-2 text-2xl font-black tracking-tight text-white">
										{{ stat.value }}
									</dd>
								</dl>
								<div class="rounded-2xl bg-white/10 p-2 text-primary">
									<UIcon :name="stat.icon" class="size-5" />
								</div>
							</div>
						</div>
					</div>
				</div>
			</UCard>

			<section class="space-y-5">
				<div class="flex flex-wrap items-end justify-between gap-4">
					<div class="max-w-2xl">
						<UBadge color="neutral" variant="soft" size="lg">
							Classic leagues
						</UBadge>
						<h2 class="mt-3 text-3xl font-black leading-none tracking-tight text-white sm:text-5xl">
							League standings
						</h2>
						<p class="mt-3 text-sm leading-6 text-stone-300">
							Tracked league positions for this manager.
						</p>
					</div>
					<UBadge icon="i-lucide-list-ordered" color="primary" variant="soft" size="lg">
						{{ formatNumber(classicLeagues.length) }} leagues
					</UBadge>
				</div>
				<!-- <USeparator /> -->

				<AppCarousel v-if="classicLeagues.length" class="px-0 py-2">
					<UCard
						v-for="league in decoratedClassicLeagues"
						:key="league.id"
						:ui="{ body: 'p-5', root: 'ring-0 overflow-hidden' }"
						class="w-full max-w-sm shrink-0 snap-start border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.025] text-stone-50"
					>
						<div class="flex items-start justify-between gap-4">
							<div class="min-w-0">
								<p class="text-[0.58rem] font-semibold uppercase tracking-[0.3em] text-stone-400">
									League
								</p>
								<h3 class="mt-2 line-clamp-2 text-xl font-bold leading-tight text-white">
									{{ league.name }}
								</h3>
							</div>
							<UBadge color="neutral" variant="subtle">#{{ formatNumber(league.id) }}</UBadge>
						</div>

						<div class="mt-5 rounded-3xl border border-white/10 bg-zinc-950/25 p-4">
							<div class="flex items-center justify-between gap-4">
								<div>
									<p class="text-[0.58rem] font-semibold uppercase tracking-[0.28em] text-stone-400">
										Current rank
									</p>
									<p class="mt-2 text-4xl font-black tracking-tight text-white">
										{{ formatNumber(league.entry_rank) }}
									</p>
								</div>
								<UBadge :color="league.rankMovement.color" variant="soft" size="lg">
									<UIcon :name="league.rankMovement.icon" class="mr-1 size-4" />
									{{ league.rankMovement.label }}
								</UBadge>
							</div>
						</div>

						<dl class="mt-5 grid grid-cols-2 gap-3">
							<div class="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
								<dt class="text-[0.54rem] font-semibold uppercase tracking-[0.28em] text-stone-400">
									Last rank
								</dt>
								<dd class="mt-2 text-lg font-black tracking-tight text-white">
									{{ formatNumber(league.entry_last_rank) }}
								</dd>
							</div>
							<div class="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-right">
								<dt class="text-[0.54rem] font-semibold uppercase tracking-[0.28em] text-stone-400">
									Movement
								</dt>
								<dd class="mt-2 text-lg font-black tracking-tight text-white">
									{{ league.rankMovement.detail }}
								</dd>
							</div>
							<div class="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
								<dt class="text-[0.54rem] font-semibold uppercase tracking-[0.28em] text-stone-400">
									Participants
								</dt>
								<dd class="mt-2 text-lg font-black tracking-tight text-white">
									{{ formatNumber(league.rank_count) }}
								</dd>
							</div>
							<div class="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-right">
								<dt class="text-[0.54rem] font-semibold uppercase tracking-[0.28em] text-stone-400">
									Percentile
								</dt>
								<dd class="mt-2 text-lg font-black tracking-tight text-white">
									{{ league.entry_percentile_rank }}%
								</dd>
							</div>
						</dl>
					</UCard>
				</AppCarousel>

				<UCard
					v-else
					:ui="{ body: 'p-6 sm:p-8', root: 'ring-0' }"
					class="border border-white/10 bg-white/[0.04] text-stone-50"
				>
					<UAlert
						icon="i-lucide-list-x"
						color="neutral"
						variant="soft"
						title="No classic leagues"
						description="This manager does not currently belong to any classic leagues."
					/>
				</UCard>
			</section>

			<section v-if="hasPicks" class="space-y-5">
				<div class="flex flex-wrap items-end justify-between gap-4">
					<div class="max-w-2xl">
						<UBadge color="neutral" variant="soft" size="lg">
							Squad overview
						</UBadge>
						<h2 class="mt-3 text-3xl font-black leading-none tracking-tight text-white sm:text-5xl">
							Starting XI and bench
						</h2>
						<p class="mt-3 text-sm leading-6 text-stone-300">
							Current gameweek squad with team value and projected points.
						</p>
					</div>
					<UBadge icon="i-lucide-users" color="primary" variant="soft" size="lg">
						{{ formatNumber(squadState?.picks?.length ?? 0) }} players
					</UBadge>
				</div>
				<!-- <USeparator /> -->

				<UCard
					:ui="{ body: 'p-0 sm:p-0', root: 'ring-0 overflow-hidden' }"
					class="bg-transparent text-stone-50"
				>
					<div class="grid gap-3 grid-cols-2 xl:grid-cols-4">
						<div
							v-for="stat in squadStats"
							:key="stat.label"
							class="rounded-3xl border border-white/10 bg-zinc-950/25 p-4"
						>
							<div class="flex items-start justify-between gap-3">
								<dl>
									<dt class="text-[0.58rem] font-semibold uppercase tracking-[0.28em] text-stone-400">
										{{ stat.label }}
									</dt>
									<dd class="mt-2 text-2xl font-black tracking-tight text-white">
										{{ stat.value }}
									</dd>
								</dl>
								<div class="rounded-2xl bg-white/10 p-2 text-primary">
									<UIcon :name="stat.icon" class="size-5" />
								</div>
							</div>
						</div>
					</div>

					<div class="mt-8 space-y-5 border-t border-white/10 pt-8">
						<div
							v-for="section in lineupSections"
							:key="section.key"
							:class="['space-y-4 rounded-3xl border bg-zinc-950/20 p-4 sm:p-5', section.accentClass]"
						>
							<div class="flex items-center justify-between gap-3">
								<div class="flex items-center gap-3">
									<UIcon :name="section.icon" class="size-5" :class="[section.iconClass]"/>
									<!-- <div :class="['rounded-2xl p-2', section.iconClass]">
									</div> -->
									<h3 class="text-sm font-black uppercase tracking-[0.24em] text-white">
										{{ section.label }}
									</h3>
								</div>
								<UBadge color="neutral" variant="soft">{{ section.items.length }}</UBadge>
							</div>
							<div
								v-if="section.items.length"
								class="flex flex-wrap items-start justify-center gap-4 lg:justify-start"
							>
								<PlayerCardPick
									v-for="pick in section.items"
									:key="pick.element?.id ?? `${section.key}-${pick.element?.code}`"
									:pick="pick"
								/>
							</div>
							<UAlert
								v-else
								icon="i-lucide-user-round-x"
								color="neutral"
								variant="soft"
								title="No players"
								description="No players available for this section."
							/>
						</div>
					</div>
				</UCard>
			</section>

			<UCard
				v-else-if="isSquadLoading"
				:ui="{ body: 'p-6 sm:p-8', root: 'ring-0' }"
				class="border border-white/10 bg-white/[0.04] text-stone-50"
			>
				<div class="space-y-5">
					<div class="flex items-center gap-3">
						<USkeleton class="size-12 rounded-full" />
						<div class="space-y-2">
							<USkeleton class="h-4 w-40" />
							<USkeleton class="h-3 w-64" />
						</div>
					</div>
					<div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
						<USkeleton v-for="item in 4" :key="item" class="h-24 rounded-3xl" />
					</div>
				</div>
			</UCard>

			<UCard
				v-else
				:ui="{ body: 'p-6 sm:p-8', root: 'ring-0' }"
				class="border border-white/10 bg-white/[0.04] text-stone-50"
			>
				<UAlert
					icon="i-lucide-users-x"
					color="neutral"
					variant="soft"
					title="No squad data"
					description="The squad for this manager is not available yet."
				/>
			</UCard>
		</section>

		<section v-else class="grid min-h-[60vh] place-items-center">
			<UCard
				:ui="{ body: 'p-6 sm:p-8', root: 'ring-0 overflow-hidden' }"
				class="w-full max-w-2xl border border-white/10 bg-gradient-to-br from-primary/15 via-white/[0.04] to-transparent text-stone-50"
			>
				<div class="space-y-6">
					<div class="flex items-center gap-4">
						<USkeleton class="size-16 rounded-full" />
						<div class="space-y-3">
							<USkeleton class="h-5 w-36" />
							<USkeleton class="h-10 w-64" />
						</div>
					</div>
					<USkeleton class="h-4 w-full max-w-lg" />
					<div class="grid gap-3 sm:grid-cols-2">
						<USkeleton v-for="item in 4" :key="item" class="h-24 rounded-3xl" />
					</div>
				</div>
			</UCard>
		</section>
	</main>
</template>

<script setup>
const route = useRoute();
const id = computed(() => String(route.params.id ?? ""));

const numberFormatter = new Intl.NumberFormat("en-GB");

const formatNumber = (value) => {
	if (value === null || value === undefined || value === "") return "-";

	const numericValue = Number(value);
	return Number.isNaN(numericValue) ? String(value) : numberFormatter.format(numericValue);
};

const formatCost = (value) => {
	const numericValue = Number(value ?? 0);
	if (!Number.isFinite(numericValue)) return "-";

	return `${(numericValue / 10).toFixed(1).replace(/\.0$/, "")}m`;
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

const transformPick = (pick, bootstrapData, predictionData) => {
	const element = getPlayerInfo(Number(pick?.element), bootstrapData);

	if (!element) return null;

	return {
		...pick,
		element,
		element_type: getPositionName(element.element_type) ?? "Unknown",
		predictions: Array.isArray(predictionData)
			? getPredictionsOfPlayer(predictionData, element.code)
			: [],
	};
};

const buildSquadState = (picks = []) => {
	const benchStart = Math.max(0, picks.length - 4);
	const startingXI = picks.slice(0, benchStart);
	const bench = picks.slice(benchStart);

	const groupedByType = startingXI.reduce((acc, player) => {
		const type = player.element_type ?? "Unknown";
		if (!acc[type]) acc[type] = [];
		acc[type].push(player);
		return acc;
	}, {});

	const teamCost = startingXI.reduce((total, pick) => {
		return total + Number(pick?.element?.now_cost ?? 0);
	}, 0);

	const teamPoints = startingXI.reduce((total, pick) => {
		return total + Number(pick?.element?.total_points ?? 0);
	}, 0);

	return { picks, startingXI, bench, groupedByType, teamCost, teamPoints };
};

const { data: pageData, pending, error } = await useAsyncData(
	"manager-page",
	async () => {
		if (!id.value) {
			throw createError({ statusCode: 404, statusMessage: "Manager not found" });
		}

		const manager = await $fetch(`/api/managers/${id.value}`);

		if (!manager || manager.message) {
			throw createError({ statusCode: 404, statusMessage: "Manager not found" });
		}

		const [bootstrapResult, predictionsResult] = await Promise.allSettled([
			$fetch("/api/bootstrap-static"),
			$fetch("/api/predictions"),
		]);

		const bootstrap = bootstrapResult.status === "fulfilled" ? bootstrapResult.value : null;
		const predictions = predictionsResult.status === "fulfilled" ? predictionsResult.value : [];

		if (!bootstrap?.elements) {
			return {
				manager,
				classicLeagues: manager?.leagues?.classic ?? [],
				squad: null,
			};
		}

		let picks = [];

		if (manager.current_event && manager.id) {
			try {
				const fetchedPicks = await $fetch("/api/managers/picks", {
					query: {
						gw: manager.current_event,
						id: manager.id,
					},
				});

				picks = Array.isArray(fetchedPicks)
					? fetchedPicks
							.map((pick) => transformPick(pick, bootstrap, predictions))
							.filter(Boolean)
					: [];
			} catch {
				picks = [];
			}
		}

		return {
			manager,
			classicLeagues: manager?.leagues?.classic ?? [],
			squad: buildSquadState(picks),
		};
	},
	{ watch: [id] }
);

const isCurrentManager = computed(() => String(pageData.value?.manager?.id ?? "") === id.value);
const managerData = computed(() => (isCurrentManager.value ? pageData.value?.manager ?? null : null));
const classicLeagues = computed(() => (isCurrentManager.value ? pageData.value?.classicLeagues ?? [] : []));
const squadState = computed(() => (isCurrentManager.value ? pageData.value?.squad ?? null : null));
const isSquadLoading = computed(() => pending.value && !isCurrentManager.value);
const hasPicks = computed(() => (squadState.value?.picks ?? []).length > 0);

const managerErrorDescription = computed(
	() => error.value?.statusMessage || error.value?.message || "Sorry, we couldn’t find the manager page you’re looking for."
);

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

const managerStats = computed(() => {
	if (!managerData.value) return [];

	return [
		{
			icon: "i-lucide-trophy",
			label: "Overall points",
			value: formatNumber(managerData.value.summary_overall_points),
		},
		{
			icon: "i-lucide-chart-no-axes-column-increasing",
			label: "Overall rank",
			value: formatNumber(managerData.value.summary_overall_rank),
		},
		{
			icon: "i-lucide-calendar-range",
			label: "Event rank",
			value: formatNumber(managerData.value.summary_event_rank),
		},
		{
			icon: "i-lucide-list-ordered",
			label: "Leagues",
			value: formatNumber(classicLeagues.value.length),
		},
	];
});

const squadStats = computed(() => {
	const squad = squadState.value;

	return [
		{ icon: "i-lucide-star", label: "Team points", value: formatNumber(squad?.teamPoints ?? 0) },
		{ icon: "i-lucide-badge-pound-sterling", label: "Team cost", value: formatCost(squad?.teamCost ?? 0) },
		{ icon: "i-lucide-users", label: "Starting XI", value: formatNumber(squad?.startingXI?.length ?? 0) },
		{ icon: "i-lucide-armchair", label: "Bench", value: formatNumber(squad?.bench?.length ?? 0) },
	];
});

const lineupSections = computed(() => {
	const squad = squadState.value;

	return [
		{
			accentClass: "border-rose-400/20",
			icon: "i-lucide-crosshair",
			iconClass: "bg-rose-400/60 text-rose-500",
			items: squad?.groupedByType?.Forward ?? [],
			key: "Forward",
			label: "Forwards",
		},
		{
			accentClass: "border-sky-400/20",
			icon: "i-lucide-circle-dot",
			iconClass: "bg-sky-400/60 text-sky-500",
			items: squad?.groupedByType?.Midfielder ?? [],
			key: "Midfielder",
			label: "Midfielders",
		},
		{
			accentClass: "border-emerald-400/20",
			icon: "i-lucide-shield",
			iconClass: "bg-emerald-400/60 text-emerald-500",
			items: squad?.groupedByType?.Defender ?? [],
			key: "Defender",
			label: "Defenders",
		},
		{
			accentClass: "border-amber-400/20",
			icon: "i-lucide-hand",
			iconClass: "bg-amber-400/60 text-amber-500",
			items: squad?.groupedByType?.Goalkeeper ?? [],
			key: "Goalkeeper",
			label: "Goalkeepers",
		},
		{
			accentClass: "border-white/10",
			icon: "i-lucide-armchair",
			iconClass: "bg-white/60 text-stone-200",
			items: squad?.bench ?? [],
			key: "Bench",
			label: "Bench",
		},
	];
});
</script>
