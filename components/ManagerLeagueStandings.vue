<template>
	<div class="min-w-0">
		<header class="mb-3 flex items-center justify-between gap-2">
			<h2 class="text-lg font-bold tracking-tight text-white">Classic leagues</h2>
			<span class="text-xs tabular-nums text-stone-400">{{ leagues.length }}</span>
		</header>
		<ul v-if="leagues.length" class="divide-y divide-white/10 border-t border-white/10">
			<li v-for="league in sortedLeagues" :key="league.id" class="py-1">
				<details class="group">
					<summary class="-mx-2 cursor-pointer list-none rounded-lg px-2 py-3 transition-colors hover:bg-lime-300/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300 motion-reduce:transition-none [&::-webkit-details-marker]:hidden">
						<span class="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
							<span class="text-sm font-semibold leading-5 text-stone-200 group-hover:text-lime-200 [overflow-wrap:anywhere]">{{ league.name }}</span>
							<span class="flex items-center gap-1.5"><span class="sr-only">Current rank </span><span class="font-sans text-lg font-bold leading-6 tabular-nums text-white">#{{ number(league.entry_rank) }}</span><UIcon name="i-lucide-chevron-down" class="size-3 shrink-0 text-stone-500 transition-transform group-open:rotate-180" aria-hidden="true" /></span>
						</span>
						<span class="mt-1 flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-xs">
							<span class="inline-flex items-center gap-1 tabular-nums" :class="movementClass(league)"><UIcon :name="league.rankMovement.icon" class="size-3.5" aria-hidden="true" />{{ hasRank(league.entry_rank) && hasRank(league.entry_last_rank) ? league.rankMovement.label : 'Movement unavailable' }}</span>
							<span class="text-stone-400">{{ hasRank(league.rank_count) ? `of ${number(league.rank_count)} teams` : 'League size unavailable' }}</span>
						</span>
						<span v-if="rankPosition(league.entry_rank, league.rank_count) !== null" class="mt-2 block" role="img" :aria-label="`Rank ${number(league.entry_rank)} of ${number(league.rank_count)}. Solid dot: current rank. Hollow dot: previous rank when available.`">
							<span class="relative block h-0.5 rounded-full bg-white/10" aria-hidden="true">
								<span v-if="rankPosition(league.entry_last_rank, league.rank_count) !== null" class="absolute top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-stone-400 bg-[#101216]" :style="{ left: `${rankPosition(league.entry_last_rank, league.rank_count)}%` }" />
								<span class="absolute top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-lime-300" :style="{ left: `${rankPosition(league.entry_rank, league.rank_count)}%` }" />
							</span>
							<span class="mt-1 flex justify-between text-[0.6rem] leading-3 text-stone-500" aria-hidden="true"><span>1st</span><span>Last</span></span>
						</span>
					</summary>
					<dl class="mt-3 grid grid-cols-2 gap-3 border-t border-white/10 pt-3 text-xs">
						<div><dt class="text-xs font-medium leading-4 text-stone-400">Previous rank</dt><dd class="mt-1 font-sans text-lg font-bold leading-6 tabular-nums text-white">{{ number(league.entry_last_rank) }}</dd></div>
						<div><dt class="text-xs font-medium leading-4 text-stone-400">Percentile</dt><dd class="mt-1 font-sans text-lg font-bold leading-6 tabular-nums text-white">{{ league.entry_percentile_rank == null ? 'Unavailable' : `${league.entry_percentile_rank}%` }}</dd></div>
					</dl>
				</details>
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
