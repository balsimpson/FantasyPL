type Pick = Record<string, any>;

const numeric = (value: unknown) =>
  value === null || value === undefined || value === '' || !Number.isFinite(Number(value)) ? null : Number(value);

function total(picks: Pick[], value: (pick: Pick) => unknown, average = false) {
  const values = picks.map(pick => numeric(value(pick)));
  if (!values.length || values.some(value => value === null)) return null;
  return values.reduce<number>((sum, value) => sum + value!, 0) / (average ? picks.length : 1);
}

export function getManagerLineupDeltas(current: Pick[], published: Pick[], gameweek: number | null) {
  const estimates = gameweek !== null && [...current, ...published].every(pick => Number(pick.expectedPointsGameweek) === gameweek);
  const points = (picks: Pick[]) => total(picks, pick => estimates ? pick.expectedPoints : pick.element.points_per_game);
  const form = (picks: Pick[]) => total(picks, pick => pick.element.form, true);
  return [
    { label: estimates ? 'Est. pts' : 'Pts/game', title: estimates ? `FPL estimate for GW ${gameweek}` : 'Season points per game', value: points(current), previous: points(published) },
    { label: current.length > 1 ? 'Avg form' : 'Form', title: 'Current FPL form', value: form(current), previous: form(published) },
  ].map(metric => {
    const delta = metric.value === null || metric.previous === null ? null : Number((metric.value - metric.previous).toFixed(1));
    return {
      ...metric,
      value: metric.value?.toFixed(1) ?? '—',
      delta: delta === null ? '—' : `${delta > 0 ? '+' : delta < 0 ? '−' : ''}${Math.abs(delta).toFixed(1)}`,
      tone: delta === null || delta === 0 ? 'text-stone-300' : delta > 0 ? 'text-lime-300' : 'text-rose-300',
    };
  });
}
