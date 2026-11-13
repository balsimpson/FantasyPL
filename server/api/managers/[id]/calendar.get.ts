import { getPublicSiteOrigin } from "../../../../utils/site-url";
import { getManagerCalendar, readManagerCalendarParams } from "../../../utils/manager-calendar";

export default defineEventHandler(async (event) => {
  const { id, includeStartingXI } = readManagerCalendarParams(getRouterParam(event, "id"), getQuery(event).xi);
  const origin = getPublicSiteOrigin(useRuntimeConfig(event).public.SITE_URL);
  const { name, events, now } = await getManagerCalendar(id, includeStartingXI, origin);
  return {
    name,
    events: events.filter((entry) => Date.parse(entry.start) >= now.getTime()).slice(0, 5)
      .map(({ uid, start, title }) => ({ uid, start, title })),
  };
});
