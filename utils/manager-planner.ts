type Row = Record<string, any>;

export const plannerPlayerName = (player: Row) =>
  [player.first_name, player.second_name].filter(Boolean).join(' ') || player.web_name || 'Unknown player';

export const getManagerDifficultyLabel = (difficulty: number | null) =>
  ({ 1: 'Very easy', 2: 'Easy', 3: 'Moderate', 4: 'Difficult', 5: 'Tough' } as Record<number, string>)[Number(difficulty)] ?? 'Unrated';

const number = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  return Number.isFinite(Number(value)) ? Number(value) : null;
};

export function getPlannerGameweeks(events: Row[]): number[] {
  const next = events.find((event) => event.is_next)?.id;
  return events.filter((event) => next ? event.id >= next : !event.finished && !event.is_current)
    .map((event) => Number(event.id)).filter((id) => Number.isInteger(id) && id > 0)
    .sort((a, b) => a - b).slice(0, 5);
}

export function getPlannerFixtureRun(teamId: number, fixtures: Row[], teams: Row[], gameweeks: number[]) {
  return gameweeks.map((gameweek) => {
    const matches = fixtures.filter((fixture) => fixture.event === gameweek && (fixture.team_h === teamId || fixture.team_a === teamId))
      .sort((a, b) => String(a.kickoff_time ?? '9999').localeCompare(String(b.kickoff_time ?? '9999')))
      .map((fixture) => {
        const home = fixture.team_h === teamId;
        const opponent = teams.find((team) => team.id === (home ? fixture.team_a : fixture.team_h));
        const rawDifficulty = number(home ? fixture.team_h_difficulty : fixture.team_a_difficulty);
        return {
          id: fixture.id,
          opponent: opponent?.name ?? 'Opponent TBC',
          opponentCode: opponent?.code ?? null,
          shortName: opponent?.short_name ?? opponent?.name ?? 'TBC',
          venue: home ? 'Home' : 'Away',
          difficulty: rawDifficulty !== null && rawDifficulty >= 1 && rawDifficulty <= 5 ? rawDifficulty : null,
        };
      });
    return { gameweek, matches };
  });
}

export function summarizePlannerRun(run: ReturnType<typeof getPlannerFixtureRun>) {
  const matches = run.flatMap((week) => week.matches);
  const rated = matches.filter((match) => match.difficulty !== null);
  return {
    matches: matches.length,
    blanks: run.filter((week) => !week.matches.length).length,
    averageDifficulty: matches.length && rated.length === matches.length
      ? Math.round(rated.reduce((total, match) => total + match.difficulty!, 0) / matches.length * 10) / 10 : null,
  };
}

export function buildManagerWeekPlan(squad: Row, fixtures: Row[], gameweek: number) {
  const ranked = squad.picks.map((pick: Row) => {
    const player = pick.element;
    const week = getPlannerFixtureRun(Number(player.team), fixtures, squad.teams, [gameweek])[0]!;
    const chance = number(player.chance_of_playing_next_round);
    const flagged = Boolean(player.status && player.status !== 'a') || (chance !== null && chance < 100);
    const unavailable = ['i', 's', 'u', 'n'].includes(player.status) || chance === 0;
    const ppg = number(player.points_per_game);
    const form = number(player.form);
    const complete = week.matches.every((match) => match.difficulty !== null) && (ppg !== null || form !== null);
    // A relative selection score, never a points forecast. Each scheduled match contributes.
    const score = complete && week.matches.length && !unavailable
      ? Math.max(0, ((ppg ?? form!) + (form ?? ppg!)) / 2)
        * week.matches.reduce((total, match) => total + 1 + (3 - match.difficulty!) * 0.15, 0)
        * (flagged ? 0.5 : 1) : null;
    return { pick, week, score, flagged, unavailable };
  });
  const byPosition = (position: number) => ranked.filter((row: Row) => Number(row.pick.element.element_type) === position && row.score !== null)
    .sort((a: Row, b: Row) => b.score - a.score || Number(a.pick.position) - Number(b.pick.position));
  const publishedIds = new Set(squad.startingXI.map((pick: Row) => Number(pick.element.id)));
  let best: typeof ranked = [];
  let bestScore = -Infinity;
  let fewestChanges = Infinity;
  for (let defenders = 3; defenders <= 5; defenders++) {
    for (let midfielders = 2; midfielders <= 5; midfielders++) {
      const forwards = 10 - defenders - midfielders;
      if (forwards < 1 || forwards > 3) continue;
      const groups = [[1, 1], [2, defenders], [3, midfielders], [4, forwards]];
      const selection = groups.flatMap(([position, count]) => byPosition(position!).slice(0, count));
      if (selection.length !== 11) continue;
      const score = selection.reduce((total: number, row: Row) => total + row.score, 0);
      const changes = selection.filter((row: Row) => !publishedIds.has(Number(row.pick.element.id))).length;
      if (score > bestScore + 1e-9 || (Math.abs(score - bestScore) <= 1e-9 && changes < fewestChanges)) {
        best = selection; bestScore = score; fewestChanges = changes;
      }
    }
  }
  const selectedIds = new Set(best.map((row: Row) => Number(row.pick.element.id)));
  const rotations = best.filter((row: Row) => !publishedIds.has(Number(row.pick.element.id)));
  const dropped = squad.startingXI.filter((pick: Row) => !selectedIds.has(Number(pick.element.id)));
  const blanks = ranked.filter((row: Row) => publishedIds.has(Number(row.pick.element.id)) && !row.week.matches.length).length;
  const flagged = ranked.filter((row: Row) => row.flagged).length;
  const hardFixtures = ranked.filter((row: Row) => publishedIds.has(Number(row.pick.element.id)) && row.week.matches.length && row.week.matches.every((match: Row) => match.difficulty !== null && match.difficulty >= 4)).length;
  const captainChoices = [...best].filter((row: Row) => !row.flagged).sort((a: Row, b: Row) => b.score - a.score || Number(a.pick.element.id) - Number(b.pick.element.id));
  const captain = captainChoices[0]?.pick ?? null;
  const viceCaptain = captainChoices[1]?.pick ?? null;
  const headline = !best.length ? 'Review squad cover' : rotations.length ? 'Rotate your bench' : hardFixtures >= 4 ? 'Review the fixture run' : 'Keep your core XI';
  const reason = !best.length
    ? 'A full suggested XI is unavailable. Check players without fixtures, availability flags, and missing data before considering a transfer.'
    : rotations.length
      ? `${rotations.map((row: Row) => plannerPlayerName(row.pick.element)).join(', ')} rank above ${dropped.map((pick: Row) => plannerPlayerName(pick.element)).join(', ')} on form, points per game, and this week’s fixtures.`
      : hardFixtures >= 4
        ? `${hardFixtures} published starters face only opponents rated 4 or 5. Compare transfer options across the full run before making a move.`
        : 'The published XI ranks highest among your current players on form, points per game, and this week’s fixtures. Check availability before saving a transfer.';
  const clonePick = (pick: Row, position: number) => ({
    ...pick, position,
    is_captain: Boolean(captain && pick.element.id === captain.element.id),
    is_vice_captain: Boolean(viceCaptain && pick.element.id === viceCaptain.element.id),
    multiplier: position > 11 ? 0 : captain && pick.element.id === captain.element.id ? 2 : 1,
  });
  const startingXI = best.map((row: Row, index: number) => clonePick(row.pick, index + 1));
  const bench = ranked.filter((row: Row) => !selectedIds.has(Number(row.pick.element.id)))
    .sort((a: Row, b: Row) => Number(b.pick.element.element_type === 1) - Number(a.pick.element.element_type === 1) || (b.score ?? -1) - (a.score ?? -1))
    .map((row: Row, index: number) => clonePick(row.pick, index + 12));
  const groupedByType: Record<string, Row[]> = {};
  startingXI.forEach((pick: Row) => (groupedByType[pick.element_type] ??= []).push(pick));
  return {
    gameweek, headline, reason, blanks, flagged, hardFixtures, captain, viceCaptain,
    rotations: rotations.length, canPreview: startingXI.length === 11,
    squad: {
      ...squad, picks: [...startingXI, ...bench], startingXI, bench, groupedByType,
      teamCost: startingXI.reduce((total: number, pick: Row) => total + Number(pick.element.now_cost ?? 0), 0),
      teamPoints: startingXI.reduce((total: number, pick: Row) => total + Number(pick.element.total_points ?? 0), 0),
    },
  };
}
