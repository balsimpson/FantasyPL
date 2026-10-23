export type ShortlistPlayer = Record<string, any>;
export type ShortlistFixture = Record<string, any>;

export const SHORTLIST_SORTS = [
  { label: "Form", value: "form" },
  { label: "Season points", value: "total_points" },
  { label: "Ownership", value: "selected_by_percent" },
  { label: "GW transfers in", value: "transfers_in_event" },
  { label: "GW transfers out", value: "transfers_out_event" },
];

export const SHORTLIST_POSITIONS = [
  { label: "All positions", value: 0 },
  { label: "Goalkeepers", value: 1 },
  { label: "Defenders", value: 2 },
  { label: "Midfielders", value: 3 },
  { label: "Forwards", value: 4 },
];

const fixtureClubNames: Record<string, string> = {
  "AFC Bournemouth": "Bournemouth",
  "Brighton and Hove Albion": "Brighton",
  "Brighton & Hove Albion": "Brighton",
  "Burnley FC": "Burnley",
  "Chelsea FC": "Chelsea",
  "Crystal Palace FC": "Crystal Palace",
  "Everton FC": "Everton",
  "Fulham FC": "Fulham",
  "Ipswich Town": "Ipswich",
  "Leeds United": "Leeds",
  "Leicester City": "Leicester",
  "Luton Town": "Luton",
  "Manchester City": "Man City",
  "Manchester United": "Man United",
  "Newcastle United FC": "Newcastle",
  "Newcastle United": "Newcastle",
  "Nottingham Forest": "Nott'm Forest",
  "Sheffield United": "Sheff Utd",
  "Southampton FC": "Southampton",
  "Sunderland AFC": "Sunderland",
  "Tottenham Hotspur": "Spurs",
  "West Ham United": "West Ham",
  "West Ham United FC": "West Ham",
  "Wolverhampton Wanderers": "Wolves",
  "Wolverhampton Wanderers FC": "Wolves",
};

export function getFixtureClubName(team?: Record<string, any>) {
  if (!team) return "Opponent TBC";
  const name = team.name;
  if (!name) return "Opponent TBC";
  return fixtureClubNames[name] || name.replace(/^Manchester /, "Man ").replace(/ (United|City|Town|FC|AFC)$/, "");
}

export function filterShortlistPlayers(players: ShortlistPlayer[], position = 0, budget = 0) {
  return players.filter((player) =>
    Number.isInteger(player.id) && Number.isFinite(Number(player.now_cost)) && Number(player.now_cost) > 0 &&
    (!position || player.element_type === position) &&
    (!budget || Number(player.now_cost) <= budget),
  );
}

export function rankShortlistPlayers(players: ShortlistPlayer[], sort = "form") {
  const key = SHORTLIST_SORTS.some((item) => item.value === sort) ? sort : "form";
  return [...players].sort((a, b) =>
    (Number(b[key]) || 0) - (Number(a[key]) || 0) ||
    (Number(b.total_points) || 0) - (Number(a.total_points) || 0) || a.id - b.id,
  );
}

export function getHomepagePlayerTrendSections(players: ShortlistPlayer[], limit = 6) {
  const hasNumber = (value: unknown) => value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value));
  const stat = (player: ShortlistPlayer, key: string) => Number(player[key]) || 0;
  const tieBreak = (a: ShortlistPlayer, b: ShortlistPlayer) =>
    stat(b, "form") - stat(a, "form") || stat(b, "total_points") - stat(a, "total_points") || a.id - b.id;
  const rankTransfers = (key: "transfers_in_event" | "transfers_out_event") => players
    .filter((player) => hasNumber(player[key]) && Number(player[key]) > 0)
    .sort((a, b) => stat(b, key) - stat(a, key) || stat(b, "total_points") - stat(a, "total_points") || a.id - b.id)
    .slice(0, limit);
  const differentials = players
    .filter((player) => hasNumber(player.selected_by_percent))
    .sort((a, b) => stat(a, "selected_by_percent") - stat(b, "selected_by_percent") || tieBreak(a, b))
    .slice(0, limit);

  return {
    differentials,
    mostSold: rankTransfers("transfers_out_event"),
    mostBought: rankTransfers("transfers_in_event"),
  };
}

export function getShortlistGameweeks(events: Record<string, any>[]) {
  const start = events.find((event) => event.is_next)?.id;
  return events.filter((event) => start ? event.id >= start : !event.finished)
    .sort((a, b) => a.id - b.id).slice(0, 3).map((event) => event.id as number);
}

export function getTeamFixtureRun(teamId: number, fixtures: ShortlistFixture[], teams: Record<string, any>[], gameweeks: number[]) {
  return gameweeks.map((gameweek) => ({
    gameweek,
    matches: fixtures.filter((fixture) => fixture.event === gameweek &&
      (fixture.team_h === teamId || fixture.team_a === teamId))
      .sort((a, b) => String(a.kickoff_time || "9999").localeCompare(String(b.kickoff_time || "9999")))
      .map((fixture) => {
        const home = fixture.team_h === teamId;
        const homeTeam = teams.find((team) => team.id === fixture.team_h);
        const awayTeam = teams.find((team) => team.id === fixture.team_a);
        const opponent = home ? awayTeam : homeTeam;
        const difficulty = Number(home ? fixture.team_h_difficulty : fixture.team_a_difficulty);
        return {
          id: fixture.id,
          opponent: getFixtureClubName(opponent),
          opponentCode: opponent?.code ?? null,
          homeTeam: getFixtureClubName(homeTeam),
          homeCode: homeTeam?.code ?? null,
          awayTeam: getFixtureClubName(awayTeam),
          awayCode: awayTeam?.code ?? null,
          venue: home ? "H" : "A",
          difficulty: difficulty >= 1 && difficulty <= 5 ? difficulty : null,
          kickoff: fixture.kickoff_time || null,
        };
      }),
  }));
}

export function getGameweekMatchups(gameweek: number, fixtures: ShortlistFixture[], teams: Record<string, any>[]) {
  return fixtures.filter((fixture) => fixture.event === gameweek)
    .sort((a, b) => String(a.kickoff_time || "9999").localeCompare(String(b.kickoff_time || "9999")))
    .map((fixture) => {
      const homeTeam = teams.find((team) => team.id === fixture.team_h);
      const awayTeam = teams.find((team) => team.id === fixture.team_a);
      const homeDifficulty = Number(fixture.team_h_difficulty);
      const awayDifficulty = Number(fixture.team_a_difficulty);
      return {
        id: fixture.id,
        homeTeam: getFixtureClubName(homeTeam), homeCode: homeTeam?.code ?? null,
        awayTeam: getFixtureClubName(awayTeam), awayCode: awayTeam?.code ?? null,
        homeDifficulty: homeDifficulty >= 1 && homeDifficulty <= 5 ? homeDifficulty : null,
        awayDifficulty: awayDifficulty >= 1 && awayDifficulty <= 5 ? awayDifficulty : null,
        kickoff: fixture.kickoff_time || null,
      };
    });
}

export function getUpcomingFixtureMatches(gameweeks: number[], fixtures: ShortlistFixture[], teams: Record<string, any>[], limit = 6) {
  return [...gameweeks]
    .sort((a, b) => a - b)
    .flatMap((gameweek) => getGameweekMatchups(gameweek, fixtures, teams)
      .map((match) => ({ ...match, gameweek })))
    .slice(0, limit);
}
