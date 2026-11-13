import { getPublicSiteOrigin } from "../../../../utils/site-url";
import { getManagerCalendar, readManagerCalendarId } from "../../../utils/manager-calendar";

export default defineEventHandler(async (event) => {
  const id = readManagerCalendarId(getRouterParam(event, "id"));
  const origin = getPublicSiteOrigin(useRuntimeConfig(event).public.SITE_URL);
  const { name, events, now } = await getManagerCalendar(id, origin);
  return {
    name,
    events: events.filter((entry) => Date.parse(entry.start) >= now.getTime()).slice(0, 5)
      .map((entry) => ({
        uid: entry.uid,
        start: entry.start,
        title: "matchTitle" in entry ? entry.matchTitle : entry.title,
        players: "playerNames" in entry ? entry.playerNames : undefined,
        location: "location" in entry ? entry.location : undefined,
      })),
  };
});
