<template>
	<article class="group relative flex h-full min-w-0 flex-col text-white" :class="compact ? 'text-center' : 'overflow-hidden rounded-xl border border-white/10 bg-[#101216]'" :style="cardStyle">
		<NuxtLink :to="getPlayerRoute(player)" :aria-label="`Open ${playerName} profile`" class="relative isolate block min-w-0 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
			<div class="relative overflow-hidden" :class="compact ? 'h-20 sm:h-28' : [detailed ? 'aspect-[16/10]' : 'aspect-[4/4.6]', 'bg-[linear-gradient(150deg,var(--club-wash),#101216_85%)]']">
				<PlayerPortrait :player="player" :alt="playerName" :hover="true" class="h-full w-full" />
				<div v-if="!compact" aria-hidden="true" class="absolute inset-0 z-20 bg-gradient-to-t from-[#101216] via-transparent to-transparent" />
				<PlayerDisciplineBadges v-if="!compact" :yellow-cards="player.yellow_cards" :red-cards="player.red_cards" class="absolute left-1 top-1 z-30" />
				<span v-if="pick.is_captain || pick.is_vice_captain" class="absolute top-1 z-30 grid size-6 place-items-center rounded-full text-[0.65rem] font-black sm:size-7 sm:text-xs" :class="[compact ? 'right-1' : 'right-12', pick.is_captain ? 'bg-primary text-inverted' : 'bg-amber-200 text-stone-950']" :aria-label="pick.is_captain ? 'Captain' : 'Vice captain'" :title="pick.is_captain ? 'Captain' : 'Vice captain'">{{ pick.is_captain ? 'C' : 'V' }}</span>
				<div v-if="!compact" class="absolute inset-x-3 bottom-2 z-30">
          <p class="text-[0.65rem] text-stone-300">{{ pick.team?.name || pick.element_type }}</p>
					<h3 class="mt-1 text-base font-bold leading-tight text-white [overflow-wrap:anywhere]">{{ playerName }}</h3><PlayerAge :player="player" compact class="mt-1 text-white/80" />
				</div>
			</div>
			<PlayerDisciplineBadges v-if="compact" :yellow-cards="player.yellow_cards" :red-cards="player.red_cards" compact class="absolute left-1 top-20 z-10 -translate-y-[calc(50%_+_6px)] sm:top-28" />
			<template v-if="compact">
				<p class="relative z-20 rounded-t-md bg-[#0a1c16]/95 px-0.5 py-1 text-[0.6rem] font-semibold leading-tight text-white [overflow-wrap:anywhere] sm:px-1 sm:text-xs">
					{{ playerName }}
				</p>
        <p class="flex flex-wrap items-center justify-center gap-x-1 rounded-b-md bg-[#07140f]/95 px-0.5 py-1 text-[0.6rem] tabular-nums text-emerald-100 sm:text-xs"><span>£{{ costLabel }}</span><span aria-hidden="true">·</span><span class="font-bold text-primary">{{ totalPoints }}<span class="sr-only"> season</span> pts</span></p>
			</template>
		</NuxtLink>
		<PlayerWatchlistButton v-if="!compact" :player="player" class="absolute right-1 top-1 z-10" />
		<div v-if="!compact" class="flex flex-1 flex-col px-3 pb-3 sm:px-4 sm:pb-4">
			<dl class="grid grid-cols-3 items-end gap-2">
				<div><dt class="text-[0.65rem] text-stone-400">Current price</dt><dd class="mt-1 text-sm font-semibold tabular-nums">£{{ costLabel }}</dd></div>
				<div class="text-center"><dt class="text-[0.65rem] text-stone-400">Season pts</dt><dd class="mt-1 text-xl font-bold tabular-nums text-[var(--club-light)]">{{ totalPoints }}</dd></div>
				<div class="text-right"><dt class="text-[0.65rem] text-stone-400">{{ expectedPointsLabel }}</dt><dd class="mt-1 text-xl font-bold tabular-nums text-white" :title="expectedPoints == null ? 'FPL has not supplied expected points for the next gameweek.' : 'FPL expected points for the next gameweek'">{{ expectedPoints == null ? '—' : expectedPoints.toFixed(1) }}</dd></div>
			</dl>
			<dl v-if="detailed" class="mt-3 grid grid-cols-3 gap-x-2 gap-y-3 border-t border-white/10 pt-3 text-center">
				<div v-for="stat in playerStats" :key="stat.label" class="min-w-0">
					<dt class="text-[0.65rem] text-stone-400">{{ stat.label }}</dt>
					<dd class="mt-1 text-base font-bold tabular-nums text-white">{{ stat.value }}</dd>
				</div>
			</dl>
			<p v-if="news" class="mt-3 flex items-start gap-2 border-t border-white/10 pt-3 text-xs leading-5 text-amber-200"><UIcon name="i-lucide-triangle-alert" class="mt-0.5 size-4 shrink-0" aria-hidden="true" />{{ news }}</p>
			<p v-if="multiplier > 1" class="mt-2 text-xs text-primary">Points multiplier ×{{ multiplier }}</p>
			<ManagerPlayerInsights v-if="detailed" :player="player" :events="events" :teams="teams" />
		</div>
	</article>
</template>

<script setup>
import { getPlayerRoute } from '~/composables/usePlayerRoute';
import { getInstagramClubTheme } from '~/utils/instagram-designs';
const props = defineProps({
	pick: { type: Object, required: true },
	compact: { type: Boolean, default: false },
	detailed: { type: Boolean, default: false },
	events: { type: Array, default: () => [] },
	teams: { type: Array, default: () => [] },
});
const player = computed(() => props.pick.element ?? {});
const playerName = computed(() => [player.value.first_name, player.value.second_name].filter(Boolean).join(' ') || player.value.web_name || 'Unknown player');
const totalPoints = computed(() => player.value.total_points ?? '—');
const multiplier = computed(() => Number(props.pick.multiplier ?? 1));
const costLabel = computed(() => player.value.now_cost == null ? '—' : `${(Number(player.value.now_cost) / 10).toFixed(1)}m`);
const news = computed(() => player.value.news || '');
const expectedPoints = computed(() => {
	const value = props.pick.expectedPoints;
	return !props.pick.expectedPointsGameweek || value == null || value === '' || !Number.isFinite(Number(value)) ? null : Number(value);
});
const expectedPointsLabel = computed(() => props.pick.expectedPointsGameweek ? `Expected · GW ${props.pick.expectedPointsGameweek}` : 'Expected points');
const displayStat = (value, decimals = 0, suffix = '') => value == null || value === '' || !Number.isFinite(Number(value)) ? '—' : `${new Intl.NumberFormat('en-GB', { maximumFractionDigits: decimals, minimumFractionDigits: decimals }).format(Number(value))}${suffix}`;
const playerStats = computed(() => [
	{ label: 'Form', value: displayStat(player.value.form, 1) },
	{ label: 'Points / game', value: displayStat(player.value.points_per_game, 1) },
	{ label: 'Selected by', value: displayStat(player.value.selected_by_percent, 1, '%') },
	{ label: 'Minutes', value: displayStat(player.value.minutes) },
	{ label: 'Goals', value: displayStat(player.value.goals_scored) },
	{ label: 'Assists', value: displayStat(player.value.assists) },
]);
const theme = computed(() => getInstagramClubTheme(Number(props.pick.team?.code)));
const cardStyle = computed(() => ({ '--club-wash': `${theme.value.primary}66`, '--club-light': theme.value.light }));
</script>
