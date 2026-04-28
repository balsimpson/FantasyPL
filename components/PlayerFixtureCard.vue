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

			<div class="relative z-10 flex h-full items-center gap-3 px-3 py-2.5 sm:px-4">
				<div class="min-w-0 flex-1 space-y-1">
					<div class="flex items-center gap-2">
						<p class="truncate text-[0.72rem] font-semibold uppercase tracking-[0.26em] text-stone-300">
							{{ fixture.event_name }}
						</p>
						<span class="rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[0.55rem] font-semibold uppercase tracking-[0.22em] text-stone-400">
							{{ fixture.is_home ? 'H' : 'A' }}
						</span>
					</div>
					<div class="flex min-w-0 items-center gap-2 text-[0.78rem] text-stone-200">
						<img
							:src="`https://resources.premierleague.com/premierleague/badges/t${opponentTeam?.code}.png`"
							:alt="opponentTeam?.name || 'Team logo'"
							class="h-4 w-4 shrink-0 object-contain opacity-90"
						/>
						<span class="truncate font-semibold">
							{{ opponentTeam?.name || 'Unknown Team' }}
						</span>
						<span class="shrink-0 text-stone-500">•</span>
						<span class="shrink-0 text-[0.68rem] uppercase tracking-[0.24em] text-stone-400">
							{{ formatDate(fixture.kickoff_time) }}
						</span>
					</div>
				</div>

				<div class="shrink-0 text-right">
					<div class="text-[0.52rem] font-semibold uppercase tracking-[0.26em] text-stone-500">
						Diff
					</div>
					<div
						class="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 font-serif text-sm font-black shadow-[0_12px_24px_rgba(0,0,0,0.35)]"
						:class="fixture.difficulty ? getColorClass(fixture.difficulty) : 'bg-white/[0.06] text-white'"
					>
						{{ fixture.difficulty || '–' }}
					</div>
				</div>
			</div>
		</UCard>
	</div>
</template>

<script setup>
const props = defineProps({
	fixture: {
		type: Object,
		required: true,
	},
	bootstrap: {
		type: Object,
		required: true,
	},
});

const getTeamLogo = (teamId) => props.bootstrap?.teams?.find((team) => team.id === teamId) || null;

const opponentTeam = computed(() => getTeamLogo(props.fixture.is_home ? props.fixture.team_a : props.fixture.team_h));

const getColorClass = (difficulty) => {
	switch (difficulty) {
		case 1:
			return 'bg-lime-300 text-lime-950';
		case 2:
			return 'bg-lime-400/80 text-lime-950';
		case 3:
			return 'bg-amber-300 text-amber-950';
		case 4:
			return 'bg-orange-400 text-orange-950';
		case 5:
			return 'bg-rose-500 text-rose-50';
		default:
			return 'bg-white/[0.06] text-white';
	}
};

const formatDate = (value) => {
	if (!value) return 'TBD';

	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return 'TBD';

	return new Intl.DateTimeFormat('en-GB', {
		weekday: 'short',
		day: '2-digit',
		month: 'short',
		hour: '2-digit',
		minute: '2-digit',
	}).format(date);
};
</script>
