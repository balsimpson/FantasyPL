import { computed, type MaybeRefOrGetter, toValue } from 'vue';

type Row = Record<string, any>;

function lineupChanges(published: Row[], suggested: Row[]) {
  const publishedIds = new Set(published.map((pick) => pick.element.id));
  const suggestedIds = new Set(suggested.map((pick) => pick.element.id));
  const outgoing = published.filter((pick) => !suggestedIds.has(pick.element.id));
  return suggested.filter((pick) => !publishedIds.has(pick.element.id)).map((incoming) => {
    const samePosition = outgoing.findIndex((pick) => pick.element.element_type === incoming.element.element_type);
    const [previous] = outgoing.splice(samePosition >= 0 ? samePosition : 0, 1);
    return { incoming, outgoing: previous };
  });
}

export function useManagerPlannerDisplay(published: MaybeRefOrGetter<Row>, plans: MaybeRefOrGetter<Row[]>) {
  // Every variant remains in the same grid track so all weeks reserve the same space.
  const variants = computed(() => [
    ...(toValue(plans).length ? toValue(plans) : [{ gameweek: null }]).map((plan) => ({
      key: `published-${plan.gameweek ?? 'current'}`, gameweek: plan.gameweek, squad: toValue(published), changes: [],
    })),
    ...toValue(plans).filter((plan) => plan.canPreview).map((plan) => ({
      key: String(plan.gameweek), gameweek: plan.gameweek, squad: plan.squad,
      changes: lineupChanges(toValue(published).startingXI, plan.squad.startingXI),
    })),
  ]);
  return { variants };
}
