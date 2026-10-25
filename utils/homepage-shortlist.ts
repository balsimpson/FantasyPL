export type ShortlistPlayer = Record<string, any>;
export type ShortlistFixture = Record<string, any>;
import { buildHomepageTradeOptions, selectHomepageTradeIdeas, type TradeFormByPlayer } from "~/shared/homepage-trades";
export { MIN_TRADE_OUTGOING_OWNERSHIP_PERCENT } from "~/shared/homepage-trades";

export const SHORTLIST_SORTS = [
  { label: "Form", value: "form" },
  { label: "Season points", value: "total_points" },
  { label: "Most selected", value: "selected_by_percent" },
  { label: "Most bought (GW)", value: "transfers_in_event" },
  { label: "Most sold (GW)", value: "transfers_out_event" },
];

export const SHORTLIST_PRICE_LIMITS = [
  { label: "Any price", value: 0 },
  { label: "Up to £3.0m", value: 30 },
  { label: "Up to £3.5m", value: 35 },
  { label: "Up to £4.0m", value: 40 },
  { label: "Up to £4.5m", value: 45 },
  { label: "Up to £5.0m", value: 50 },
  { label: "Up to £5.5m", value: 55 },
  { label: "Up to £6.0m", value: 60 },
  { label: "Up to £6.5m", value: 65 },
  { label: "Up to £7.0m", value: 70 },
  { label: "Up to £7.5m", value: 75 },
  { label: "Up to £8.0m", value: 80 },
  { label: "Up to £8.5m", value: 85 },
  { label: "Up to £9.0m", value: 90 },
  { label: "Up to £9.5m", value: 95 },
  { label: "Up to £10.0m", value: 100 },
  { label: "Up to £12.0m", value: 120 },
  { label: "Up to £15.0m", value: 150 },
  { label: "Up to £20.0m", value: 200 },
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
    .filter((player) => hasNumber(player.selected_by_percent) &&
      stat(player, "selected_by_percent") > 0 && stat(player, "selected_by_percent") <= 10 &&
      stat(player, "minutes") > 0 && stat(player, "form") > 0)
    .sort((a, b) => tieBreak(a, b))
    .slice(0, limit);

  return {
    differentials,
    mostSold: rankTransfers("transfers_out_event"),
    mostBought: rankTransfers("transfers_in_event"),
  };
}

export function getHomepageCaptainPicks(players: ShortlistPlayer[], limit = 4) {
  const eligible = players
    .filter((player) => Number.isFinite(Number(player.ep_next)) && Number(player.ep_next) > 0 && !["i", "s", "u", "n"].includes(player.status))
    .sort((a, b) => Number(b.ep_next) - Number(a.ep_next) || Number(b.form || 0) - Number(a.form || 0) || a.id - b.id);
  const captains = eligible.slice(0, limit);
  const captainIds = new Set(captains.map((player) => player.id));
  const viceCaptains = eligible.filter((player) => !captainIds.has(player.id)).slice(0, limit);
  const differentials = getHomepagePlayerTrendSections(players, limit).differentials;

  return { captains, viceCaptains, differentials };
}

export function getHomepageTransferTargets(
  players: ShortlistPlayer[],
  fixtures: ShortlistFixture[],
  gameweeks: number[],
  limit = 5,
) {
  const upcomingWeeks = new Set(gameweeks);
  const fixtureDifficulty = new Map<number, number[]>();
  for (const fixture of fixtures) {
    if (!upcomingWeeks.has(Number(fixture.event))) continue;
    for (const [teamId, key] of [[fixture.team_h, "team_h_difficulty"], [fixture.team_a, "team_a_difficulty"]] as const) {
      const difficulty = Number(fixture[key]);
      if (!Number.isFinite(difficulty) || difficulty < 1 || difficulty > 5) continue;
      const values = fixtureDifficulty.get(Number(teamId)) ?? [];
      values.push(difficulty);
      fixtureDifficulty.set(Number(teamId), values);
    }
  }

  const averageDifficulty = (teamId: number) => {
    const values = fixtureDifficulty.get(teamId) ?? [];
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : Number.POSITIVE_INFINITY;
  };

  return players
    .filter((player) => player.status === "a" && Number(player.minutes) >= 90 &&
      Number.isFinite(Number(player.ep_next)) && Number(player.ep_next) > 0 &&
      Number.isFinite(Number(player.now_cost)) && Number(player.now_cost) > 0)
    .sort((a, b) => Number(b.ep_next) - Number(a.ep_next) ||
      averageDifficulty(Number(a.team)) - averageDifficulty(Number(b.team)) ||
      Number(b.form || 0) - Number(a.form || 0) || Number(a.id) - Number(b.id))
    .slice(0, limit);
}

export function getHomepageTradeIdeas(
  players: ShortlistPlayer[],
  fixtures: ShortlistFixture[],
  gameweeks: number[],
  limit = 20,
  recentForm: TradeFormByPlayer = {},
) {
  return selectHomepageTradeIdeas(buildHomepageTradeOptions(players, fixtures, gameweeks, recentForm), limit);
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
          opponentShortName: opponent?.short_name || null,
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
