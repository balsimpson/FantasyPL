import { getShortlistGameweeks } from "../../utils/homepage-shortlist";

const playerFields = [
  "id", "code", "first_name", "second_name", "web_name", "birth_date", "team", "element_type", "now_cost",
  "selected_by_percent", "transfers_in_event", "transfers_out_event", "form", "total_points",
  "points_per_game", "goals_scored", "assists", "clean_sheets", "minutes", "starts", "status",
  "yellow_cards", "red_cards",
  "expected_goals_conceded_per_90", "saves_per_90", "expected_goals_per_90", "expected_assists_per_90",
];
const eventFields = ["id", "name", "deadline_time", "finished", "is_current", "is_next", "chip_plays",
  "most_captained", "most_vice_captained", "transfers_made", "average_entry_score", "highest_score"];
const teamFields = ["id", "name", "short_name", "code"];
const fixtureFields = ["id", "event", "team_h", "team_a", "team_h_difficulty", "team_a_difficulty", "kickoff_time"];
const pick = (value: Record<string, any>, fields: string[]) =>
  Object.fromEntries(fields.filter((field) => field in value).map((field) => [field, value[field]]));

export const getHomepageData = defineCachedFunction(async () => {
  const [data, fixtureResult] = await Promise.all([
    $fetch<Record<string, any>>("https://fantasy.premierleague.com/api/bootstrap-static/", { timeout: 10_000, retry: 0 }).catch(() => null),
    $fetch<unknown>("https://fantasy.premierleague.com/api/fixtures/", { timeout: 10_000, retry: 0 })
      .then((fixtures) => ({ fixtures, fetchedAt: new Date().toISOString() })).catch(() => null),
  ]);
  if (!data || !Array.isArray(data.elements) || !Array.isArray(data.events) || !Array.isArray(data.teams)) {
    throw createError({ statusCode: 502, statusMessage: "Current FPL data is unavailable" });
  }
  const gameweeks = getShortlistGameweeks(data.events);
  const hasFixtures = Array.isArray(fixtureResult?.fixtures);
  return {
    elements: data.elements.map((player: Record<string, any>) => pick(player, playerFields)),
    events: data.events.map((event: Record<string, any>) => pick(event, eventFields)),
    teams: data.teams.map((team: Record<string, any>) => pick(team, teamFields)),
    fixtures: hasFixtures ? (fixtureResult!.fixtures as Record<string, any>[])
      .filter((fixture) => gameweeks.includes(fixture.event)).map((fixture) => pick(fixture, fixtureFields)) : null,
    fetchedAt: new Date().toISOString(),
    fixturesFetchedAt: hasFixtures ? fixtureResult!.fetchedAt : null,
  };
}, {
  name: "homepage-data-v6",
  maxAge: 600,
  swr: false,
  validate: (entry) => Array.isArray(entry.value?.fixtures),
});
