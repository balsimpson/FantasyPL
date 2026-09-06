<template>
  <div class="flex items-center gap-3 py-4">
    <img v-if="opponentTeam" :src="`https://resources.premierleague.com/premierleague/badges/t${opponentTeam.code}.png`"
      :alt="opponentTeam.name" width="28" height="28" loading="lazy" class="size-7 shrink-0 object-contain" />
    <div class="min-w-0 flex-1">
      <p class="text-sm font-semibold text-white">{{ opponentTeam?.name || 'Unknown team' }}</p>
      <p class="mt-1 text-sm text-stone-400">Gameweek {{ history.round }} · {{ history.was_home ? 'Home' : 'Away' }}</p>
      <p class="mt-1 text-xs text-stone-400">{{ formatDate(history.kickoff_time) }} · {{ history.minutes }} min</p>
    </div>
    <dl class="shrink-0 text-right tabular-nums">
      <dt class="text-xs text-stone-400">Points</dt>
      <dd class="mt-1 text-lg font-semibold text-white">{{ history.total_points }}</dd>
    </dl>
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
