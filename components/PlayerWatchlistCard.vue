<template>
	<article
		ref="cardRoot"
		class="relative flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#101216] text-white shadow-[0_18px_48px_-32px_rgba(0,0,0,0.9)]"
		:style="cardStyle"
	>
		<div class="relative">
			<NuxtLink
				:to="playerRoute"
				:aria-label="`Open ${playerName} profile`"
				class="group relative block aspect-[16/10] overflow-hidden bg-[linear-gradient(145deg,var(--club-wash),#101216_72%)] focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[var(--club-light)]"
			>
				<div aria-hidden="true" class="absolute inset-0 opacity-35" :style="pitchStyle">
					<div class="absolute inset-x-[12%] top-[12%] bottom-0 rounded-t-[50%] border border-white/15" />
					<div class="absolute inset-x-[12%] top-[12%] bottom-0 scale-x-75 rounded-t-[50%] border border-white/10" />
				</div>
				<img
					:src="playerImageSrc"
					:alt="playerName"
					width="440"
					height="560"
					loading="lazy"
					decoding="async"
					class="absolute inset-0 h-full w-full object-contain object-bottom drop-shadow-[0_18px_24px_rgba(0,0,0,0.5)] transition-transform duration-300 motion-safe:group-hover:scale-[1.025]"
					@error="showImage = false"
				/>
				<div aria-hidden="true" class="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,7,10,0.64),transparent_25%,transparent_54%,rgba(5,7,10,0.88))]" />
				<header class="absolute inset-x-4 top-4 z-10 flex items-start justify-between gap-3">
					<span class="max-w-[75%] rounded-full border border-white/15 bg-black/35 px-3 py-1.5 text-[0.62rem] font-bold uppercase tracking-[0.15em] text-[var(--club-light)]">
						{{ elementType }}
					</span>
					<img
						v-if="team?.code"
						:src="`https://resources.premierleague.com/premierleague/badges/t${team.code}.png`"
						:alt="team.name"
						width="44"
						height="44"
						loading="lazy"
						decoding="async"
						class="size-11 rounded-full bg-white/95 p-1.5 object-contain shadow-lg"
					/>
				</header>
				<PlayerDisciplineBadges :yellow-cards="player.yellow_cards" :red-cards="player.red_cards" class="absolute left-4 top-16 z-10" />
				<div class="absolute inset-x-4 bottom-4 z-10 flex items-end justify-between gap-2">
					<div class="min-w-0">
          <p class="text-xs font-semibold text-white/75 [overflow-wrap:anywhere]">{{ teamName }}</p>
						<div class="mt-1 flex flex-wrap items-center gap-2"><h3 class="text-xl font-black leading-tight tracking-tight text-white [overflow-wrap:anywhere] sm:text-2xl">
							{{ playerName }}
						</h3><PlayerAge :player="player" class="text-white/80" /></div>
					</div>
					<span class="shrink-0 rounded-lg border border-white/15 bg-black/55 px-2.5 py-2 font-serif text-lg font-bold tabular-nums text-white">
						{{ playerPrice }}
					</span>
				</div>
			</NuxtLink>
		</div>

		<div class="flex flex-1 flex-col px-4 pb-4">
			<div class="grid min-h-[6.5rem] shrink-0 grid-cols-[minmax(0,1fr)_auto] items-end gap-3 border-b border-white/10 py-3">
				<div class="min-w-0">
					<p class="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-stone-400">{{ leadStat.label }}</p>
					<p class="mt-1 font-serif text-[2.25rem] font-bold leading-none tracking-tight tabular-nums text-[var(--club-light)]">
						{{ leadStat.value }}
					</p>
				</div>
				<div class="flex min-w-0 flex-col items-end gap-1.5">
					<p v-if="player.status && player.status !== 'a'" class="max-w-32 text-right text-xs leading-4 text-amber-200">
						{{ availabilityLabel }}
					</p>
					<PlayerWatchlistButton :player="player" />
				</div>
			</div>

			<dl class="grid min-h-[5rem] shrink-0 min-w-0 grid-cols-3 items-center divide-x divide-white/10 border-b border-white/10 py-2.5 text-center">
				<div v-for="stat in secondaryStats" :key="stat.key" class="min-w-0 px-1">
					<dt class="text-[0.58rem] font-semibold uppercase tracking-[0.1em] text-stone-400">{{ stat.label }}</dt>
					<dd class="mt-1 font-serif text-lg font-bold tabular-nums text-white">{{ stat.value }}</dd>
				</div>
			</dl>

			<WatchlistFixtureRun
				:run="fixtureRun"
				:available="hasFixtureData"
				:loading="detailLoading"
				:error="detailError"
			/>
			<WatchlistPointsChart
				:player-id="player.id"
				:events="bootstrapData?.events || []"
				:history="playerDetails?.history || []"
				:loading="detailLoading"
				:error="detailError"
				@retry="retryPlayerDetails"
			/>
		</div>
	</article>
</template>

<script setup lang="ts">
import { getPlayerRoute } from "~/composables/usePlayerRoute";
import { getFixtureClubName, getShortlistGameweeks } from "~/utils/homepage-shortlist";
import { getInstagramClubTheme } from "~/utils/instagram-designs";

const props = defineProps<{
	player: Record<string, any>;
	bootstrap?: Record<string, any> | null;
	sortKey: string;
}>();

const elementTypeMap: Record<number, string> = {
	1: "Goalkeeper",
	2: "Defender",
	3: "Midfielder",
	4: "Forward",
};
const availabilityLabels: Record<string, string> = {
	d: "Flagged doubtful by FPL",
	i: "Flagged injured by FPL",
	s: "Flagged suspended by FPL",
	u: "Flagged unavailable by FPL",
	n: "Not available in FPL",
};

const cardRoot = ref<HTMLElement | null>(null);
const playerDetails = ref<Record<string, any> | null>(null);
const detailLoading = ref(true);
const detailError = ref(false);
const showImage = ref(true);
const bootstrapData = computed(() => props.bootstrap?.value ?? props.bootstrap);
const playerRoute = computed(() => getPlayerRoute(props.player));
const playerName = computed(() => {
	const fullName = `${props.player.first_name || ""} ${props.player.second_name || ""}`.trim();
	return fullName || props.player.web_name || "Unknown player";
});
const team = computed(() => bootstrapData.value?.teams?.find((item: any) => Number(item.id) === Number(props.player.team)) || null);
const teamName = computed(() => team.value?.name || "Team unavailable");
const elementType = computed(() => elementTypeMap[Number(props.player.element_type)] || "Player");
const playerPrice = computed(() => {
	const cost = Number(props.player.now_cost);
	return Number.isFinite(cost) && cost > 0 ? `£${(cost / 10).toFixed(1)}m` : "Price unavailable";
});
const clubTheme = computed(() => getInstagramClubTheme(Number(team.value?.code)));
const cardStyle = computed(() => ({ "--club-wash": `${clubTheme.value.primary}55`, "--club-light": clubTheme.value.light }));
const pitchStyle = computed(() => ({
	backgroundImage: "linear-gradient(90deg, transparent 49.7%, rgba(255,255,255,.12) 50%, transparent 50.3%), linear-gradient(0deg, transparent 49.7%, rgba(255,255,255,.12) 50%, transparent 50.3%)",
}));
const playerImageSrc = computed(() => showImage.value && props.player.code
	? `https://resources.premierleague.com/premierleague25/photos/players/110x140/${props.player.code}.png`
	: "/fallback.png");
const primaryStatKey = computed(() => props.sortKey === "total_points" || props.sortKey === "selected_by_percent"
	? props.sortKey
	: "form");
const leadStat = computed(() => {
	if (primaryStatKey.value === "total_points") {
		return { label: "Season points", value: formatInteger(props.player.total_points) };
	}
	if (primaryStatKey.value === "selected_by_percent") {
		return { label: "Selected by", value: formatPercent(props.player.selected_by_percent) };
	}
	return { label: "Form", value: formatDecimal(props.player.form) };
});
const secondaryStats = computed(() => [
	{ key: "total_points", label: "Season points", value: formatInteger(props.player.total_points) },
	{ key: "form", label: "Form", value: formatDecimal(props.player.form) },
	{ key: "points_per_game", label: "Points / game", value: formatDecimal(props.player.points_per_game) },
	{ key: "selected_by_percent", label: "Selected by", value: formatPercent(props.player.selected_by_percent) },
	{ key: "minutes", label: "Minutes", value: formatInteger(props.player.minutes) },
].filter((stat) => stat.key !== primaryStatKey.value).slice(0, 3));
const availabilityLabel = computed(() => availabilityLabels[props.player.status] || "Availability unconfirmed");
const gameweeks = computed(() => getShortlistGameweeks(bootstrapData.value?.events || []));
const hasFixtureData = computed(() => Array.isArray(playerDetails.value?.fixtures));
const fixtureRun = computed(() => {
	const fixtures = playerDetails.value?.fixtures;

	const teamId = Number(props.player.team);
	const teams = bootstrapData.value?.teams || [];

	return gameweeks.value.map((gameweek: number) => ({
		gameweek,
		matches: (Array.isArray(fixtures) ? fixtures : [])
			.filter((fixture: Record<string, any>) => Number(fixture.event) === gameweek && fixture.finished !== true)
			.sort((left: Record<string, any>, right: Record<string, any>) =>
				String(left.kickoff_time || "9999").localeCompare(String(right.kickoff_time || "9999")),
			)
			.map((fixture: Record<string, any>) => {
				const isHome = typeof fixture.is_home === "boolean" ? fixture.is_home : Number(fixture.team_h) === teamId;
				const opponentId = Number(fixture.opponent_team ?? (isHome ? fixture.team_a : fixture.team_h));
				const opponentTeam = teams.find((item: any) => Number(item.id) === opponentId);
				const rawDifficulty = Number(fixture.difficulty ?? (isHome ? fixture.team_h_difficulty : fixture.team_a_difficulty));

				return {
					id: fixture.id ?? null,
					opponent: getFixtureClubName(opponentTeam),
					opponentCode: opponentTeam?.code ?? null,
					venue: isHome ? "H" : "A",
					difficulty: Number.isFinite(rawDifficulty) && rawDifficulty >= 1 && rawDifficulty <= 5 ? rawDifficulty : null,
					kickoff: fixture.kickoff_time || null,
				};
			}),
	}));
});

let observer: IntersectionObserver | undefined;
let requestController: AbortController | undefined;
let detailRequested = false;

const loadPlayerDetails = async () => {
	if (detailRequested || playerDetails.value || detailError.value) return;

	detailRequested = true;
	detailLoading.value = true;
	requestController = new AbortController();

	try {
		const data = await $fetch<Record<string, any>>(`/api/players/${props.player.id}`, {
			signal: requestController.signal,
			cache: "no-cache",
		});
		if (!data || !Array.isArray(data.history) || !Array.isArray(data.fixtures)) {
			throw new Error("Player history or fixtures are unavailable");
		}
		playerDetails.value = data;
	} catch {
		if (!requestController.signal.aborted) detailError.value = true;
	} finally {
		detailLoading.value = false;
	}
};

const retryPlayerDetails = () => {
	detailError.value = false;
	detailRequested = false;
	void loadPlayerDetails();
};

onMounted(() => {
	const element = cardRoot.value;
	if (!element) return;

	if (typeof IntersectionObserver === "undefined") {
		void loadPlayerDetails();
		return;
	}

	observer = new IntersectionObserver((entries) => {
		if (entries.some((entry) => entry.isIntersecting)) {
			observer?.disconnect();
			void loadPlayerDetails();
		}
	}, { rootMargin: "280px 0px" });
	observer.observe(element);
});

onBeforeUnmount(() => {
	observer?.disconnect();
	requestController?.abort();
});

function numericValue(value: unknown) {
	if (value === null || value === undefined || value === "") return null;
	const number = Number(value);
	return Number.isFinite(number) ? number : null;
}

function formatInteger(value: unknown) {
	const number = numericValue(value);
	return number === null ? "—" : new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 }).format(number);
}

function formatDecimal(value: unknown) {
	const number = numericValue(value);
	return number === null ? "—" : number.toFixed(1);
}

function formatPercent(value: unknown) {
	const number = numericValue(value);
	return number === null ? "—" : `${number.toFixed(1)}%`;
}
</script>
