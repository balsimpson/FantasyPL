import { getPublicSiteOrigin } from "../../../../utils/site-url";
import { getManagerCalendar, readManagerCalendarId } from "../../../utils/manager-calendar";

export default defineEventHandler(async (event) => {
  const id = readManagerCalendarId(getRouterParam(event, "id"));
  const origin = getPublicSiteOrigin(useRuntimeConfig(event).public.SITE_URL);
  const { name, events, now } = await getManagerCalendar(id, origin);
  return {
    name,
    events: events.filter((entry) => "titleValues" in entry && Date.parse(entry.start) >= now.getTime()).slice(0, 1)
      .map((entry) => ({
        uid: entry.uid,
        start: entry.start,
        title: entry.title,
        location: "location" in entry ? entry.location : undefined,
        titleValues: "titleValues" in entry ? entry.titleValues : undefined,
      })),
  };
});
