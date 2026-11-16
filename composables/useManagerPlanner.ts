import { buildManagerWeekPlan, getPlannerFixtureRun, getPlannerGameweeks, summarizePlannerRun } from '~/utils/manager-planner';

export function useManagerPlanner(squad: Ref<Record<string, any> | null>, recommendations: Ref<Record<string, any> | null>) {
  const request = useFetch<Record<string, any>>('/api/managers/fixtures', { lazy: true, timeout: 15_000, retry: 0 });
  const deadline = computed(() => request.data.value?.deadline ?? null);
  const deadlineGameweek = computed(() => deadline.value ? request.data.value?.gameweeks?.[0] ?? null : null);
  const selectedGameweek = ref<number | null>(null);
  const preview = ref(true);
  const gameweeks = computed(() => getPlannerGameweeks(squad.value?.events ?? []));
  const ready = computed(() => Boolean(Array.isArray(request.data.value?.fixtures) &&
    gameweeks.value.every((week) => request.data.value!.gameweeks?.includes(week))));
  const plans = computed(() => ready.value && squad.value
    ? gameweeks.value.map((week) => buildManagerWeekPlan(squad.value!, request.data.value!.fixtures, week)) : []);
  const selectedPlan = computed(() => plans.value.find((plan) => plan.gameweek === selectedGameweek.value) ?? plans.value[0] ?? null);
  const transferPreview = computed(() => {
    const result = recommendations.value;
    const transferSquad = result?.transferPreview?.squad;
    const week = selectedPlan.value?.gameweek;
    if (!week || !transferSquad || result?.targetGameweek !== week) return null;
    const plan = buildManagerWeekPlan(transferSquad, request.data.value!.fixtures, week);
    if (!plan.canPreview) return null;
    const publishedIds = new Set(squad.value!.startingXI.map((pick: Record<string, any>) => pick.element.id));
    const rotations = plan.squad.startingXI.filter((pick: Record<string, any>) => !publishedIds.has(pick.element.id)).length;
    return {
      plan: { ...plan, rotations, hardFixtures: selectedPlan.value!.hardFixtures, transfers: result.transferPreview.transfers },
      transfers: result.transferPreview.transfers,
    };
  });
  const displayPlan = computed(() => transferPreview.value?.plan ?? selectedPlan.value);
  const displayPlans = computed(() => plans.value.map((plan) =>
    transferPreview.value?.plan.gameweek === plan.gameweek ? transferPreview.value.plan : plan));
  const fixtureRow = (pick: Record<string, any>) => {
    const run = getPlannerFixtureRun(Number(pick.element.team), request.data.value!.fixtures, squad.value!.teams, gameweeks.value);
    return { pick, run, summary: summarizePlannerRun(run) };
  };
  const rows = computed(() => !ready.value || !squad.value ? [] : squad.value.picks.map(fixtureRow));
  const displayRows = computed(() => {
    if (!transferPreview.value) return rows.value;
    const owned = new Set(rows.value.map((row: ReturnType<typeof fixtureRow>) => row.pick.element.id));
    const newRows = transferPreview.value.plan.squad.picks.filter((pick: Record<string, any>) => !owned.has(pick.element.id));
    return [...rows.value, ...newRows.map(fixtureRow)];
  });
  const previewActive = computed(() => Boolean(preview.value && displayPlan.value?.canPreview));
  const displaySquad = computed(() => previewActive.value ? displayPlan.value!.squad : squad.value);
  watch(squad, () => { selectedGameweek.value = null; preview.value = true; });
  const selectGameweek = (week: number) => { selectedGameweek.value = week; preview.value = true; };
  return {
    deadline, deadlineGameweek, gameweeks, rows, displayPlan, previewActive, displaySquad, displayPlans, displayRows, transferPreview, selectGameweek,
    showPublished: () => { preview.value = false; },
    showPreview: () => { preview.value = true; },
    pending: request.pending, error: computed(() => request.error.value || (request.status.value === 'success' && !ready.value)),
    refresh: request.refresh, fetchedAt: computed(() => request.data.value?.fetchedAt ?? null),
  };
}
