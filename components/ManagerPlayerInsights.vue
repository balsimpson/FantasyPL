<template>
	<div ref="root" class="mt-auto min-w-0 pt-1">
		<WatchlistFixtureRun :run="fixtureRun" :available="Array.isArray(data?.fixtures)" :loading="loading" :error="error" />
		<WatchlistPointsChart full-width :player-id="player.id" :history="data?.history || []" :events="events" :loading="loading" :error="error" @retry="retry" />
	</div>
</template>

<script setup>
import { getShortlistGameweeks, getTeamFixtureRun } from '~/utils/homepage-shortlist';
const props = defineProps({
	player: { type: Object, required: true },
	events: { type: Array, default: () => [] },
	teams: { type: Array, default: () => [] },
});
const root = ref(null);
const { data, loading, error, retry } = useManagerPlayerDetails(() => props.player.id, root);
const fixtureRun = computed(() => {
	// The player summary supplies one difficulty for this player's side.
	const fixtures = (data.value?.fixtures || []).filter((fixture) => fixture.finished !== true).map((fixture) => ({
		...fixture,
		team_h_difficulty: fixture.team_h_difficulty ?? (fixture.is_home ? fixture.difficulty : null),
		team_a_difficulty: fixture.team_a_difficulty ?? (fixture.is_home === false ? fixture.difficulty : null),
	}));
	return getTeamFixtureRun(props.player.team, fixtures, props.teams, getShortlistGameweeks(props.events));
});
</script>
