<template>
  <div class="flex items-center gap-3 py-4">
    <img v-if="opponentTeam" :src="`https://resources.premierleague.com/premierleague/badges/t${opponentTeam.code}.png`"
      :alt="opponentTeam.name" width="28" height="28" loading="lazy" class="size-7 shrink-0 object-contain" />
    <div class="min-w-0 flex-1">
      <p class="text-sm font-semibold text-white">{{ opponentTeam?.name || 'Unknown team' }}</p>
      <p class="mt-1 text-sm text-stone-400">{{ fixture.event_name || (fixture.event ? `Gameweek ${fixture.event}` : 'Gameweek TBC') }} · {{ fixture.is_home ? 'Home' : 'Away' }}</p>
      <p class="mt-1 text-xs text-stone-400">{{ formatDate(fixture.kickoff_time) }}</p>
    </div>
    <dl class="shrink-0 text-right tabular-nums">
      <dt class="text-xs text-stone-400">Difficulty</dt>
      <dd class="mt-1 text-lg font-semibold" :class="getColorClass(fixture.difficulty)">{{ fixture.difficulty || 'TBC' }}<span v-if="fixture.difficulty" class="text-xs font-normal text-stone-400"> / 5</span></dd>
    </dl>
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
			return 'text-lime-200';
		case 2:
			return 'text-lime-200';
		case 3:
			return 'text-amber-200';
		case 4:
			return 'text-orange-200';
		case 5:
			return 'text-rose-200';
		default:
			return 'text-stone-300';
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
