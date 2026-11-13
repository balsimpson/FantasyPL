<template>
	<div class="min-w-0">
		<header class="mb-2 flex items-center justify-between gap-2">
			<h2 class="text-sm font-semibold text-white">Classic leagues</h2>
			<span class="text-xs tabular-nums text-stone-400">{{ leagues.length }}</span>
		</header>
		<ul v-if="leagues.length" class="divide-y divide-white/10 border-t border-white/10">
			<li v-for="league in sortedLeagues" :key="league.id" class="py-2">
				<div class="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
					<span class="text-sm font-semibold leading-5 text-stone-200 [overflow-wrap:anywhere]">{{ league.name }}</span>
					<span class="text-sm font-bold leading-5 tabular-nums text-white"><span class="sr-only">Current rank </span>#{{ number(league.entry_rank) }}</span>
				</div>
				<dl class="mt-1.5 grid grid-cols-4 gap-2 text-xs leading-4 tabular-nums">
					<div>
						<dt class="text-stone-400">Teams</dt>
						<dd class="break-words text-stone-200">{{ hasRank(league.rank_count) ? number(league.rank_count) : '—' }}</dd>
					</div>
					<div>
						<dt class="text-stone-400">Movement</dt>
						<dd class="flex items-start gap-1" :class="movementClass(league)">
							<template v-if="hasRank(league.entry_rank) && hasRank(league.entry_last_rank)">
								<UIcon :name="league.rankMovement.icon" class="mt-px size-3.5 shrink-0" aria-hidden="true" />
								<span class="min-w-0 break-words">{{ league.rankMovement.label }}</span>
							</template>
							<span v-else>—</span>
						</dd>
					</div>
					<div>
						<dt class="text-stone-400">Previous</dt>
						<dd class="break-words text-stone-200">{{ hasRank(league.entry_last_rank) ? `#${number(league.entry_last_rank)}` : '—' }}</dd>
					</div>
					<div class="text-right">
						<dt class="text-stone-400">Percentile</dt>
						<dd class="text-stone-200">{{ league.entry_percentile_rank == null ? '—' : `${league.entry_percentile_rank}%` }}</dd>
					</div>
				</dl>
				<div v-if="rankPosition(league.entry_rank, league.rank_count) !== null" class="relative mt-1.5 h-0.5 rounded-full bg-white/10" role="img" :aria-label="`Rank ${number(league.entry_rank)} of ${number(league.rank_count)}. Solid dot: current rank. Hollow dot: previous rank when available.`">
					<span v-if="rankPosition(league.entry_last_rank, league.rank_count) !== null" class="absolute top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-stone-400 bg-[#101216]" :style="{ left: `${rankPosition(league.entry_last_rank, league.rank_count)}%` }" aria-hidden="true" />
					<span class="absolute top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-lime-300" :style="{ left: `${rankPosition(league.entry_rank, league.rank_count)}%` }" aria-hidden="true" />
				</div>
			</li>
		</ul>
		<p v-if="!leagues.length" class="py-3 text-sm text-stone-400">No classic leagues for this manager.</p>
	</div>
</template>

<script setup>
const props = defineProps({ leagues: { type: Array, default: () => [] } });
const sortedLeagues = computed(() => [...props.leagues].sort((left, right) => {
	const leftGain = relativeGain(left);
	const rightGain = relativeGain(right);
	if (leftGain === null) return rightGain === null ? 0 : 1;
	if (rightGain === null) return -1;
	return rightGain - leftGain;
}));
const number = (value) => value == null || value === '' ? '—' : new Intl.NumberFormat('en-GB').format(value);
const hasRank = (value) => Number.isInteger(Number(value)) && Number(value) > 0;
const rankPosition = (rank, count) => {
	if (!hasRank(rank) || !hasRank(count) || Number(rank) > Number(count)) return null;
	return Number(count) === 1 ? 0 : ((Number(rank) - 1) / (Number(count) - 1)) * 100;
};
const relativeGain = (league) => {
	if (rankPosition(league.entry_rank, league.rank_count) === null || rankPosition(league.entry_last_rank, league.rank_count) === null) return null;
	return ((Number(league.entry_last_rank) - Number(league.entry_rank)) / Number(league.rank_count)) * 100;
};
const movementClass = (league) => !hasRank(league.entry_rank) || !hasRank(league.entry_last_rank)
	? 'text-stone-400'
	: league.rankMovement.color === 'success' ? 'text-lime-300' : league.rankMovement.color === 'error' ? 'text-rose-300' : 'text-stone-400';
</script>
