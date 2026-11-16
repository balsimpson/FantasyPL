import { buildManagerWeekPlan, getPlannerFixtureRun, getPlannerGameweeks, summarizePlannerRun } from '~/utils/manager-planner';

type Row = Record<string, any>;

export function useManagerPlanner(squad: Ref<Row | null>, fixtureData: Ref<Row | null>, recommendations: Ref<Row[]>) {
  const selectedGameweek = ref<number | null>(null);
  const preview = ref(true);
  const gameweeks = computed(() => getPlannerGameweeks(squad.value?.events ?? []));
  const plans = computed(() => {
    const published = squad.value;
    const fixtures = fixtureData.value?.fixtures;
    if (!published || !fixtures) return [];
    const publishedIds = new Set(published.startingXI.map((pick: Row) => pick.element.id));
    return gameweeks.value.map(week => {
      const base = buildManagerWeekPlan(published, fixtures, week);
      const transfer = recommendations.value.find(result => result.targetGameweek === week)?.transferPreview;
      if (!transfer) return { ...base, transfers: [] };
      const incoming = new Map<number, Row>(transfer.replacements.map((pick: Row) => [pick.element.id, pick]));
      const replacements = new Map<number, number>(transfer.transfers.map((move: Row) => [move.outgoingId, move.incomingId]));
      const replace = (pick: Row) => incoming.get(replacements.get(pick.element.id) ?? -1) ?? pick;
      const plan = buildManagerWeekPlan({ ...published, picks: published.picks.map(replace), startingXI: published.startingXI.map(replace) }, fixtures, week);
      if (!plan.canPreview) return { ...base, transfers: [] };
      const rotations = plan.squad.startingXI.filter((pick: Row) => !publishedIds.has(pick.element.id)).length;
      return { ...plan, rotations, hardFixtures: base.hardFixtures, transfers: transfer.transfers };
    });
  });
  const selectedPlan = computed(() => plans.value.find(plan => plan.gameweek === selectedGameweek.value) ?? plans.value[0] ?? null);
  const selectedRecommendations = computed(() => recommendations.value.find(result => result.targetGameweek === selectedPlan.value?.gameweek) ?? null);
  const fixtureRow = (pick: Row) => {
    const run = getPlannerFixtureRun(Number(pick.element.team), fixtureData.value!.fixtures, squad.value!.teams, gameweeks.value);
    return { pick, run, summary: summarizePlannerRun(run) };
  };
  const rows = computed(() => fixtureData.value && squad.value ? squad.value.picks.map(fixtureRow) : []);
  const displayRows = computed(() => {
    const byPlayer = new Map<number, ReturnType<typeof fixtureRow>>(rows.value.map((row: ReturnType<typeof fixtureRow>) => [row.pick.element.id, row]));
    for (const plan of plans.value) for (const pick of plan.squad.picks) {
      if (!byPlayer.has(pick.element.id)) byPlayer.set(pick.element.id, fixtureRow(pick));
    }
    return [...byPlayer.values()];
  });
  const previewActive = computed(() => Boolean(preview.value && selectedPlan.value?.canPreview));
  const displaySquad = computed(() => previewActive.value ? selectedPlan.value!.squad : squad.value);
  watch(squad, () => { selectedGameweek.value = null; preview.value = true; });
  const selectGameweek = (week: number) => { selectedGameweek.value = week; preview.value = true; };
  return {
    deadline: computed(() => fixtureData.value?.deadline ?? null),
    deadlineGameweek: computed(() => fixtureData.value?.gameweeks[0] ?? null),
    error: computed(() => Boolean(squad.value && gameweeks.value.length && !fixtureData.value)),
    gameweeks, rows, displayRows, plans, selectedPlan, selectedRecommendations, previewActive, displaySquad, selectGameweek,
    showPublished: () => { preview.value = false; },
    showPreview: () => { preview.value = true; },
  };
}
