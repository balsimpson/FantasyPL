import { computed, type MaybeRefOrGetter, toValue } from 'vue';

type Row = Record<string, any>;

function lineupChanges(published: Row, plan: Row) {
  const { squad: suggested, transfers = [] } = plan;
  const publishedIds = new Set(published.startingXI.map((pick: Row) => pick.element.id));
  const suggestedIds = new Set(suggested.startingXI.map((pick: Row) => pick.element.id));
  const incomingIds = new Set(transfers.map((move: Row) => move.incomingId));
  const outgoingIds = new Set(transfers.map((move: Row) => move.outgoingId));
  const changes = transfers.flatMap(({ incomingId, outgoingId }: Row) => {
    const incoming = suggested.picks.find((pick: Row) => pick.element.id === incomingId);
    const outgoing = published.picks.find((pick: Row) => pick.element.id === outgoingId);
    return incoming && outgoing ? [{ incoming, outgoing, transfer: true }] : [];
  });
  const dropped = published.startingXI.filter((pick: Row) => !suggestedIds.has(pick.element.id) && !outgoingIds.has(pick.element.id));
  for (const incoming of suggested.startingXI) {
    if (publishedIds.has(incoming.element.id) || incomingIds.has(incoming.element.id) || !dropped.length) continue;
    const samePosition = dropped.findIndex((pick: Row) => pick.element.element_type === incoming.element.element_type);
    const [outgoing] = dropped.splice(samePosition >= 0 ? samePosition : 0, 1);
    changes.push({ incoming, outgoing, transfer: false });
  }
  return changes;
}

export function useManagerPlannerDisplay(published: MaybeRefOrGetter<Row>, plans: MaybeRefOrGetter<Row[]>) {
  // Every variant remains in the same grid track so all weeks reserve the same space.
  const variants = computed(() => [
    ...(toValue(plans).length ? toValue(plans) : [{ gameweek: null }]).map((plan) => ({
      key: `published-${plan.gameweek ?? 'current'}`, gameweek: plan.gameweek, squad: toValue(published), changes: [],
    })),
    ...toValue(plans).filter((plan) => plan.canPreview).map((plan) => ({
      key: String(plan.gameweek), gameweek: plan.gameweek, squad: plan.squad,
      changes: lineupChanges(toValue(published), plan),
    })),
  ]);
  return { variants };
}
