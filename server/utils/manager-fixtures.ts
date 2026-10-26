import { getCachedFplBootstrap } from './fpl-bootstrap';
import { fetchFplJson } from '../../utils/fpl-fetch';
import { getPlannerGameweeks } from '../../utils/manager-planner';

export const getManagerFixtures = defineCachedFunction(async () => {
  const [{ data }, fixtures] = await Promise.all([
    getCachedFplBootstrap(),
    fetchFplJson('https://fantasy.premierleague.com/api/fixtures/', (value): value is Record<string, any>[] =>
      Array.isArray(value) && value.every((row) => Number.isInteger(row?.id) && Number.isInteger(row?.team_h) && Number.isInteger(row?.team_a))),
  ]);
  const gameweeks = getPlannerGameweeks(data.events);
  return {
    gameweeks,
    fixtures: fixtures.filter((fixture) => gameweeks.includes(fixture.event)).map((fixture) => ({
      id: fixture.id, event: fixture.event, team_h: fixture.team_h, team_a: fixture.team_a,
      team_h_difficulty: fixture.team_h_difficulty, team_a_difficulty: fixture.team_a_difficulty,
      kickoff_time: fixture.kickoff_time,
    })),
    deadline: data.events.find((event: Record<string, any>) => event.is_next)?.deadline_time ?? null,
    fetchedAt: new Date().toISOString(),
  };
}, {
  name: 'manager-five-week-fixtures-v1', maxAge: 600, swr: false,
  validate: (entry) => Boolean(Array.isArray(entry.value?.fixtures) &&
    (!entry.value.deadline || Date.parse(entry.value.deadline) > Date.now())),
});
