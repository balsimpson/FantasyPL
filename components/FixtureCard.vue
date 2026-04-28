<template>
	<div class="h-full">
		<UCard :ui="{ body: 'p-3', root: 'ring-0 max-w-sm' }"
			class="h-full w-full rounded-[24px] bg-zinc-950 text-stone-50">
			<div class="flex h-full flex-col gap-3">

				<div class="flex items-center justify-between gap-3">

					<div class="flex items-center gap-3 ">
						<img :src="homeBadgeSrc" :alt="teamName(homeTeam)"
							class="h-10 w-10 shrink-0 object-contain drop-shadow-[0_10px_18px_rgba(0,0,0,0.45)]" />
						<div class="min-w-0 flex-1">
							<p class="text-[0.55rem] font-semibold uppercase tracking-[0.24em] text-stone-400">
								Home
							</p>
							<p class="truncate text-sm font-bold text-white">
								{{ teamName(homeTeam) }}
							</p>
							<p class="text-[0.55rem] font-semibold uppercase tracking-[0.22em] text-stone-300">
								{{ teamShortName(homeTeam) }}
							</p>
						</div>
						<!-- <span v-if="homeDifficulty !== null" class="inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-[0.58rem] font-black uppercase tracking-[0.22em]" :class="difficultyClass(homeDifficulty)">
							{{ homeDifficulty }}
						</span> -->
					</div>
	
					<div class="flex justify-center py-1 sm:py-0">
						<span
							class="inline-flex items-center text-[0.58rem] font-bold uppercase tracking-[0.28em] text-stone-300">
							VS
						</span>
					</div>
	
					<div class="flex items-center gap-3  sm:justify-end">
						<div class="min-w-0 flex-1 text-right sm:flex-none">
							<p class="text-[0.55rem] font-semibold uppercase tracking-[0.24em] text-stone-400">
								Away
							</p>
							<p class="truncate text-sm font-bold text-white">
								{{ teamName(awayTeam) }}
							</p>
							<p class="text-[0.55rem] font-semibold uppercase tracking-[0.22em] text-stone-300">
								{{ teamShortName(awayTeam) }}
							</p>
						</div>
						<!-- <span v-if="awayDifficulty !== null" class="inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-[0.58rem] font-black uppercase tracking-[0.22em]" :class="difficultyClass(awayDifficulty)">
							{{ awayDifficulty }}
						</span> -->
						<img :src="awayBadgeSrc" :alt="teamName(awayTeam)"
							class="h-10 w-10 shrink-0 object-contain drop-shadow-[0_10px_18px_rgba(0,0,0,0.45)]" />
					</div>
				</div>

				<section
					class="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center border-b border-white/10 pb-3 ">
				</section>

			</div>

			<div class="flex items-center justify-between pt-3">
				<div>
					<div class="text-[0.55rem] font-semibold uppercase tracking-[0.28em] text-stone-400">
						Kickoff
					</div>
					<div class="text-[0.55rem] font-semibold uppercase tracking-[0.28em] text-stone-400">
						Local time
					</div>

				</div>

				<div>

					<div class=" font-serif text-[1.1rem] font-black leading-none text-white">
						{{ kickoffTime }}
					</div>
					<div class="mt-1 text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-stone-300">
						{{ kickoffDate }}
					</div>
				</div>

			</div>


			<div class="shrink-0 ">
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

const teamFor = (teamId) => {
	return props.bootstrap?.teams?.find((team) => team.id === teamId) || {};
};

const teamName = (team) => team?.name || 'TBD';
const teamShortName = (team) => team?.short_name || team?.name || 'TBD';
const teamBadgeSrc = (team) =>
	team?.code
		? `https://resources.premierleague.com/premierleague/badges/t${team.code}.png`
		: '/fallback.png';

const homeTeam = computed(() => teamFor(props.fixture.team_h));
const awayTeam = computed(() => teamFor(props.fixture.team_a));

const homeBadgeSrc = computed(() => teamBadgeSrc(homeTeam.value));

const awayBadgeSrc = computed(() => teamBadgeSrc(awayTeam.value));

const kickoffDateValue = computed(() => {
	if (!props.fixture.kickoff_time) return null;

	const date = new Date(props.fixture.kickoff_time);
	return Number.isNaN(date.getTime()) ? null : date;
});

const kickoffTime = computed(() => {
	if (!kickoffDateValue.value) return 'TBD';

	return kickoffDateValue.value.toLocaleTimeString(undefined, {
		hour: 'numeric',
		minute: '2-digit',
		// timeZoneName: 'short',
	});
});

const kickoffDate = computed(() => {
	if (!kickoffDateValue.value) return '-';

	return kickoffDateValue.value.toLocaleDateString(undefined, {
		weekday: 'short',
		month: 'short',
		day: 'numeric',
	});
});

const homeDifficulty = computed(() => {
	const difficulty = Number(props.fixture.team_h_difficulty);
	return Number.isFinite(difficulty) && difficulty > 0 ? difficulty : null;
});

const awayDifficulty = computed(() => {
	const difficulty = Number(props.fixture.team_a_difficulty);
	return Number.isFinite(difficulty) && difficulty > 0 ? difficulty : null;
});

const difficultyClass = (difficulty) => {
	switch (Number(difficulty)) {
		case 1:
			return 'border-lime-300/30 bg-lime-300/10 text-lime-100';
		case 2:
			return 'border-lime-200/25 bg-lime-200/10 text-lime-50';
		case 3:
			return 'border-amber-300/30 bg-amber-300/10 text-amber-100';
		case 4:
			return 'border-orange-300/30 bg-orange-300/10 text-orange-100';
		case 5:
			return 'border-rose-300/30 bg-rose-300/10 text-rose-100';
		default:
			return 'border-white/10 bg-white/[0.05] text-stone-200';
	}
};
</script>
