import { getBootstrapStatic } from "~~/composables/usePremiereLeague";

const playerFields = [
  "id",
  "code",
  "first_name",
  "second_name",
  "web_name",
  "team",
  "element_type",
  "now_cost",
  "yellow_cards",
  "red_cards",
  "selected_by_percent",
  "transfers_in_event",
  "transfers_out_event",
  "form",
  "total_points",
  "points_per_game",
  "goals_scored",
  "assists",
  "goals_conceded",
  "clean_sheets",
  "saves",
  "bps",
  "influence",
  "threat",
  "value_form",
  "minutes",
  "clean_sheets_per_90",
  "expected_goals_conceded_per_90",
  "saves_per_90",
  "expected_goals_per_90",
  "expected_assists_per_90",
];

const eventFields = [
  "id",
  "name",
  "deadline_time",
  "finished",
  "is_current",
  "is_next",
  "chip_plays",
  "most_captained",
  "most_vice_captained",
  "transfers_made",
  "average_entry_score",
  "highest_score",
];

const teamFields = ["id", "name", "short_name", "code"];

const pickFields = (value: Record<string, unknown>, fields: string[]) =>
  Object.fromEntries(fields.filter((field) => field in value).map((field) => [field, value[field]]));

export default defineCachedEventHandler(async () => {
  const data = await getBootstrapStatic();

  if (!data || !Array.isArray(data.elements) || !Array.isArray(data.events) || !Array.isArray(data.teams)) {
    throw createError({
      statusCode: 502,
      statusMessage: "Current FPL data is unavailable",
    });
  }

  return {
    elements: data.elements.map((player: Record<string, unknown>) => pickFields(player, playerFields)),
    events: data.events.map((event: Record<string, unknown>) => pickFields(event, eventFields)),
    teams: data.teams.map((team: Record<string, unknown>) => pickFields(team, teamFields)),
  };
}, {
  name: "homepage-data-v3",
  maxAge: 60 * 10,
  swr: true,
});
