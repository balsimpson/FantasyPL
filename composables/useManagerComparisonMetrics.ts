import { computed, type MaybeRefOrGetter, toValue } from 'vue';
type Row = Record<string, any>;

const numeric = (value: unknown) => value === null || value === undefined || value === '' || !Number.isFinite(Number(value)) ? null : Number(value);
const format = (value: unknown, decimals = 0) => numeric(value) === null ? '—' : new Intl.NumberFormat('en-GB', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(Number(value));
const statuses: Record<string, string> = { a: 'Available', d: 'Doubtful', i: 'Injured', s: 'Suspended', u: 'Unavailable', n: 'Unavailable' };

export function useManagerComparisonMetrics(pair: MaybeRefOrGetter<Row | null>) {
  return computed(() => {
    const players = toValue(pair);
    if (!players) return [];
    const current = players.outgoing.element;
    const suggested = players.incoming.element;
    const rows = [
      { label: 'Form', field: 'form', decimals: 1 }, { label: 'Points per game', field: 'points_per_game', decimals: 1 },
      { label: 'Season points', field: 'total_points' }, { label: 'Minutes played', field: 'minutes' },
      { label: 'Goals', field: 'goals_scored' }, { label: 'Assists', field: 'assists' },
      { label: 'Current price', field: 'now_cost', decimals: 1, scale: 0.1, lowerBetter: true, money: true },
    ].map((row) => {
      const a = numeric(current[row.field]);
      const b = numeric(suggested[row.field]);
      const scale = row.scale ?? 1;
      const delta = a === null || b === null ? null : Number(((b - a) * scale).toFixed(row.decimals ?? 0));
      const good = delta !== null && delta !== 0 && (row.lowerBetter ? delta < 0 : delta > 0);
      const decorate = (value: number | null) => value === null ? '—' : row.money ? `£${format(value * scale, row.decimals)}m` : format(value * scale, row.decimals);
      return {
        label: row.label, current: decorate(a), suggested: decorate(b), delta,
        deltaLabel: delta === null ? '—' : `${delta > 0 ? '+' : delta < 0 ? '−' : ''}${row.money ? '£' : ''}${format(Math.abs(delta), row.decimals)}${row.money ? 'm' : ''}`,
        icon: delta === null || delta === 0 ? null : delta > 0 ? 'i-lucide-arrow-up' : 'i-lucide-arrow-down',
        tone: delta === null || delta === 0 ? 'text-stone-400' : good ? 'text-lime-300' : 'text-rose-300',
        changeLabel: delta === null ? 'Unavailable' : delta === 0 ? 'No change' : row.money ? good ? 'Lower cost' : 'Higher cost' : good ? 'Increase' : 'Decrease',
      };
    });
    const becameAvailable = Boolean(current.status && current.status !== 'a' && suggested.status === 'a');
    const becameFlagged = current.status === 'a' && suggested.status && suggested.status !== 'a';
    rows.push({
      label: 'Availability', current: statuses[current.status] ?? 'Not supplied', suggested: statuses[suggested.status] ?? 'Not supplied',
      delta: null, deltaLabel: becameAvailable ? 'Available' : becameFlagged ? 'Flagged' : '—',
      icon: becameAvailable ? 'i-lucide-arrow-up' : becameFlagged ? 'i-lucide-arrow-down' : null,
      tone: becameAvailable ? 'text-lime-300' : becameFlagged ? 'text-rose-300' : 'text-stone-400',
      changeLabel: becameAvailable ? 'Available' : becameFlagged ? 'Availability flagged' : 'No status gain or loss',
    });
    return rows;
  });
}
