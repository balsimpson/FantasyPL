<template>
	<div class="h-full snap-start">
		<UCard
			:ui="{ body: 'p-0', root: 'ring-0' }"
			class="group relative h-full w-full overflow-hidden rounded-[20px] border border-white/10 bg-neutral-950 text-stone-50 transition duration-300 hover:-translate-y-0.5"
		>
			<div
				class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(200,255,61,0.08),transparent_30%),radial-gradient(circle_at_110%_18%,rgba(72,214,255,0.06),transparent_24%),linear-gradient(135deg,#111317_0%,#090a0d_100%)]"
			/>
			<div
				class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-size[5px_5px] opacity-8"
			/>

			<div class="relative z-10 flex items-center gap-3 px-3 py-2.5 sm:px-4">
				<div class="shrink-0 text-center">
					<div class="text-[0.52rem] font-semibold uppercase tracking-[0.26em] text-stone-500">
						#{{ history.fixture }}
					</div>
					<div class="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] font-serif text-sm font-black text-white">
						{{ history.total_points }}
					</div>
				</div>

				<div class="min-w-0 flex-1 space-y-1">
					<div class="flex min-w-0 items-center gap-2">
						<img
							:src="opponentTeam ? `https://resources.premierleague.com/premierleague/badges/t${opponentTeam.code}.png` : '/fallback.png'"
							:alt="opponentTeam?.name || 'Team logo'"
							class="h-4 w-4 shrink-0 object-contain opacity-90"
						/>
						<span class="truncate text-[0.78rem] font-semibold text-stone-200">
							{{ opponentTeam?.name || 'Unknown Team' }}
						</span>
						<span class="shrink-0 text-stone-500">•</span>
						<span class="shrink-0 text-[0.68rem] uppercase tracking-[0.24em] text-stone-400">
							{{ formatDate(history.kickoff_time) }}
						</span>
					</div>
					<div class="flex flex-wrap items-center gap-2 text-[0.58rem] font-semibold uppercase tracking-[0.24em] text-stone-400">
						<span class="rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5">Minutes {{ history.minutes }}</span>
						<span class="rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5">Points {{ history.total_points }}</span>
					</div>
				</div>
			</div>
		</UCard>
	</div>
</template>

<script setup>
const props = defineProps({
	history: {
		type: Object,
		required: true,
	},
	bootstrap: {
		type: Object,
		required: true,
	},
});

const getTeamInfo = (teamId) => props.bootstrap?.teams?.find((team) => team.id === teamId) || null;

const opponentTeam = computed(() => getTeamInfo(props.history.opponent_team));

const formatDate = (value) => {
	if (!value) return 'TBD';

	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return 'TBD';

	return new Intl.DateTimeFormat('en-GB', {
		day: '2-digit',
		month: 'short',
		hour: '2-digit',
		minute: '2-digit',
	}).format(date);
};
</script>
