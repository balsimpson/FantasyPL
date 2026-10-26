import { buildManagerWeekPlan, getPlannerFixtureRun, getPlannerGameweeks, summarizePlannerRun } from '~/utils/manager-planner';

export function useManagerPlanner(squad: Ref<Record<string, any> | null>) {
  const request = useFetch<Record<string, any>>('/api/managers/fixtures', { lazy: true, timeout: 15_000, retry: 0 });
  const selectedGameweek = ref<number | null>(null);
  const preview = ref(true);
  const gameweeks = computed(() => getPlannerGameweeks(squad.value?.events ?? []));
  const ready = computed(() => Boolean(Array.isArray(request.data.value?.fixtures) &&
    gameweeks.value.every((week) => request.data.value!.gameweeks?.includes(week))));
  const plans = computed(() => ready.value && squad.value
    ? gameweeks.value.map((week) => buildManagerWeekPlan(squad.value!, request.data.value!.fixtures, week)) : []);
  const selectedPlan = computed(() => plans.value.find((plan) => plan.gameweek === selectedGameweek.value) ?? plans.value[0] ?? null);
  const rows = computed(() => !ready.value || !squad.value ? [] : squad.value.picks.map((pick: Record<string, any>) => {
    const run = getPlannerFixtureRun(Number(pick.element.team), request.data.value!.fixtures, squad.value!.teams, gameweeks.value);
    return { pick, run, summary: summarizePlannerRun(run) };
  }));
  const previewActive = computed(() => Boolean(preview.value && selectedPlan.value?.canPreview));
  const displaySquad = computed(() => previewActive.value ? selectedPlan.value!.squad : squad.value);
  watch(squad, () => { selectedGameweek.value = null; preview.value = true; });
  const selectGameweek = (week: number) => { selectedGameweek.value = week; preview.value = true; };
  return {
    gameweeks, plans, rows, selectedPlan, previewActive, displaySquad, selectGameweek,
    showPublished: () => { preview.value = false; },
    showPreview: () => { preview.value = true; },
    pending: request.pending, error: computed(() => request.error.value || (request.status.value === 'success' && !ready.value)),
    refresh: request.refresh, fetchedAt: computed(() => request.data.value?.fetchedAt ?? null),
  };
}
