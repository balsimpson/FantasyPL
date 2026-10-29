import { getCachedFplBootstrap } from "../../../utils/fpl-bootstrap";

export default defineEventHandler(async (event) => {
  const rawId = String(event.context.params?.id ?? "");
  if (!/^[1-9]\d*$/.test(rawId)) {
    throw createError({ statusCode: 404, statusMessage: "Invalid player URL" });
  }
  const { data, fetchedAt } = await getCachedFplBootstrap(event);
  const player = data.elements.find((item: Record<string, any>) => item.id === Number(rawId));
  if (!player) throw createError({ statusCode: 404, statusMessage: "Player not found" });

  return {
    elements: [player],
    teams: data.teams.map(({ id, code, name, short_name }: Record<string, any>) => ({ id, code, name, short_name })),
    events: data.events.filter((item: Record<string, any>) => item.is_current)
      .map(({ id, is_current }: Record<string, any>) => ({ id, is_current })),
    fetchedAt,
  };
});
