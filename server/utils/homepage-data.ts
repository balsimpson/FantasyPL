import { getShortlistGameweeks } from "../../utils/homepage-shortlist";
import type { H3Event } from "h3";

const playerFields = [
  "id", "code", "first_name", "second_name", "web_name", "birth_date", "team", "element_type", "now_cost",
  "selected_by_percent", "transfers_in_event", "transfers_out_event", "form", "total_points",
  "points_per_game", "ep_next", "goals_scored", "assists", "clean_sheets", "minutes", "starts", "status",
  "yellow_cards", "red_cards", "chance_of_playing_next_round", "can_select", "can_transact",
  "expected_goals_conceded_per_90", "saves_per_90", "expected_goals_per_90", "expected_assists_per_90",
];
const eventFields = ["id", "name", "deadline_time", "finished", "is_current", "is_next", "chip_plays",
  "most_captained", "most_vice_captained", "transfers_made", "average_entry_score", "highest_score"];
const teamFields = ["id", "name", "short_name", "code"];
const fixtureFields = ["id", "event", "team_h", "team_a", "team_h_difficulty", "team_a_difficulty", "kickoff_time"];
const pick = (value: Record<string, any>, fields: string[]) =>
  Object.fromEntries(fields.filter((field) => field in value).map((field) => [field, value[field]]));

export const getHomepageBootstrap = defineCachedFunction(async (_event?: H3Event) => {
  const data = await $fetch<Record<string, any>>("https://fantasy.premierleague.com/api/bootstrap-static/", { timeout: 10_000, retry: 0 }).catch(() => null);
  if (!data || !Array.isArray(data.elements) || !Array.isArray(data.events) || !Array.isArray(data.teams)) {
    throw createError({ statusCode: 502, statusMessage: "Current FPL data is unavailable" });
  }
  return {
    elements: data.elements.map((player: Record<string, any>) => pick(player, playerFields)),
    events: data.events.map((event: Record<string, any>) => pick(event, eventFields)),
    teams: data.teams.map((team: Record<string, any>) => pick(team, teamFields)),
    fetchedAt: new Date().toISOString(),
  };
}, {
  name: "homepage-bootstrap-v3",
  getKey: () => "homepage",
  maxAge: 600,
  swr: true,
  validate: (entry) => {
    const data = entry.value;
    if (!Array.isArray(data?.events) || !Array.isArray(data?.elements) || !Array.isArray(data?.teams)) return false;
    const next = data.events.find((event) => event.is_next);
    return Date.now() - Date.parse(data.fetchedAt) < 1_200_000
      && (!next || Date.parse(next.deadline_time) > Date.now());
  },
});

export const getHomepageFixtures = defineCachedFunction(async () => {
  const [data, fixtures] = await Promise.all([
    getHomepageBootstrap(),
    $fetch<unknown>("https://fantasy.premierleague.com/api/fixtures/", { timeout: 10_000, retry: 0 }),
  ]);
  if (!Array.isArray(fixtures)) {
    throw createError({ statusCode: 502, statusMessage: "Current FPL fixtures are unavailable" });
  }
  const gameweeks = getShortlistGameweeks(data.events);
  return {
    fixtures: fixtures.filter((fixture) => gameweeks.includes(fixture.event))
      .map((fixture) => pick(fixture, fixtureFields)),
    fixturesFetchedAt: new Date().toISOString(),
  };
}, {
  name: "homepage-fixtures-v1",
  maxAge: 600,
  swr: false,
  validate: (entry) => Array.isArray(entry.value?.fixtures),
});

// Preserve the combined response for existing API consumers.
export const getHomepageData = async () => {
  const [data, fixtures] = await Promise.all([
    getHomepageBootstrap(),
    getHomepageFixtures().catch(() => ({ fixtures: null, fixturesFetchedAt: null })),
  ]);
  return { ...data, ...fixtures };
};
