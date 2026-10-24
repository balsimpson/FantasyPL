<template>
  <div class="flex items-center gap-3 py-4">
    <img v-if="opponentTeam" :src="`https://resources.premierleague.com/premierleague/badges/t${opponentTeam.code}.png`"
      :alt="opponentTeam.name" width="28" height="28" loading="lazy" class="size-7 shrink-0 self-start object-contain" />
    <div class="min-w-0 flex-1">
      <p class="text-sm font-semibold text-white">{{ opponentTeam?.name || 'Unknown team' }}</p>
      <p class="mt-1 text-sm text-stone-400">{{ fixture.event_name || (fixture.event ? `Gameweek ${fixture.event}` : 'Gameweek TBC') }} · {{ fixture.is_home ? 'Home' : 'Away' }}</p>
      <p class="mt-1 text-xs text-stone-400">{{ formatDate(fixture.kickoff_time) }}</p>
    </div>
    <dl class="shrink-0 text-right tabular-nums">
      <dt class="text-xs text-stone-400">Difficulty</dt>
      <dd class="mt-2 flex items-center justify-end gap-1.5" :aria-label="difficulty === null ? 'Fixture difficulty unavailable' : `Fixture difficulty ${difficulty} out of 5, ${difficultyLabel}`">
        <span class="flex w-12 gap-0.5" aria-hidden="true">
          <span v-for="level in 5" :key="level" class="h-1.5 flex-1 rounded-full" :class="difficulty === null || level > difficulty ? 'bg-white/10' : difficulty <= 2 ? 'bg-lime-300' : difficulty >= 4 ? 'bg-rose-300' : 'bg-amber-200'" />
        </span>
        <span class="text-xs font-semibold" :class="difficulty === null ? 'text-stone-500' : difficulty <= 2 ? 'text-lime-200' : difficulty >= 4 ? 'text-rose-200' : 'text-amber-100'">{{ difficulty === null ? '—' : `${difficulty}/5` }}</span>
      </dd>
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

const difficulty = computed(() => {
  const value = Number(props.fixture.difficulty);
  return Number.isInteger(value) && value >= 1 && value <= 5 ? value : null;
});
const difficultyLabel = computed(() => difficulty.value <= 2 ? 'Easier' : difficulty.value >= 4 ? 'Harder' : 'Medium');

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
