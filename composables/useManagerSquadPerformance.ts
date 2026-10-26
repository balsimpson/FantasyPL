import { computed, type MaybeRefOrGetter, toValue } from 'vue';
type Row = Record<string, any>;
const numeric = (value: unknown) => value === null || value === undefined || value === '' || !Number.isFinite(Number(value)) ? null : Number(value);
const rounded = (value: number) => Number(value.toFixed(1));

function summarize(picks: Row[], rows: Row[], gameweek: number | null, expected: boolean) {
  if (picks.length !== 11) return { points: null, form: null, difficulty: null, tough: null };
  const points = picks.map((pick) => numeric(expected ? pick.expectedPoints : pick.element.points_per_game));
  const form = picks.map((pick) => numeric(pick.element.form));
  const runs = picks.map((pick) => rows.find((row) => row.pick.element.id === pick.element.id)?.run.find((week: Row) => week.gameweek === gameweek)?.matches);
  const matches = runs.every(Array.isArray) ? runs.flat() : null;
  const rated = matches?.length && matches.every((match: Row) => numeric(match.difficulty) !== null && match.difficulty >= 1 && match.difficulty <= 5);
  return {
    points: points.every((value) => value !== null) && (!expected || picks.every((pick) => Number(pick.expectedPointsGameweek) === gameweek)) && picks.filter((pick) => pick.is_captain).length === 1
      ? rounded(points.reduce<number>((total, value, index) => total + value! * (picks[index]!.is_captain ? 2 : 1), 0)) : null,
    form: form.every((value) => value !== null) ? rounded(form.reduce<number>((total, value) => total + value!, 0) / 11) : null,
    difficulty: rated ? rounded(matches!.reduce((total: number, match: Row) => total + Number(match.difficulty), 0) / matches!.length) : null,
    tough: matches !== null && matches.every((match: Row) => numeric(match.difficulty) !== null)
      ? runs.filter((run: Row[]) => run.length && run.every((match) => match.difficulty >= 4)).length : null,
  };
}

export function useManagerSquadPerformance(
  squad: MaybeRefOrGetter<Row>, published: MaybeRefOrGetter<Row>, rows: MaybeRefOrGetter<Row[]>, gameweek: MaybeRefOrGetter<number | null>,
) {
  return computed(() => {
    const selected = toValue(squad).startingXI ?? [];
    const original = toValue(published).startingXI ?? [];
    const week = toValue(gameweek);
    const estimateWeek = original[0]?.expectedPointsGameweek;
    const expected = estimateWeek != null && week === Number(estimateWeek);
    const current = summarize(selected, toValue(rows), week, expected);
    const baseline = summarize(original, toValue(rows), week, expected);
    return [
      { key: 'points', label: expected ? `FPL estimate · GW ${week}` : 'Recent pts/game', decimals: 1, title: expected ? 'Combined FPL next-gameweek estimate for the XI, including the captain.' : 'Combined historical points per game for the XI, including the captain.' },
      { key: 'form', label: 'Average form', decimals: 1, title: 'Average current FPL form across the starting XI.' },
      { key: 'difficulty', label: 'Fixture difficulty', decimals: 1, suffix: '/5', lowerBetter: true, title: 'Average official difficulty across the XI’s scheduled matches.' },
      { key: 'tough', label: 'Tough matchups', decimals: 0, lowerBetter: true, title: 'Starters whose scheduled opponents are all rated 4 or 5.' },
    ].map((metric) => {
      const value = current[metric.key as keyof typeof current];
      const previous = baseline[metric.key as keyof typeof baseline];
      const delta = value === null || previous === null ? null : rounded(value - previous);
      const good = delta !== null && (metric.lowerBetter ? delta < 0 : delta > 0);
      return {
        ...metric,
        value: value === null ? '—' : `${value.toFixed(metric.decimals)}${metric.suffix ?? ''}`,
        delta: delta === null ? '—' : `${delta > 0 ? '+' : delta < 0 ? '−' : ''}${Math.abs(delta).toFixed(metric.decimals)}`,
        icon: delta === null || delta === 0 ? null : delta > 0 ? 'i-lucide-arrow-up' : 'i-lucide-arrow-down',
        tone: delta === null || delta === 0 ? 'text-stone-400' : good ? 'text-lime-300' : 'text-rose-300',
      };
    });
  });
}
