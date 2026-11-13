import { serializeCalendarFeed } from "~~/utils/deadline-calendar.js";
import { getPublicSiteOrigin } from "../../../../../utils/site-url";
import { getManagerCalendar, readManagerCalendarId } from "../../../../utils/manager-calendar";

export default defineEventHandler(async (event) => {
  const id = readManagerCalendarId(getRouterParam(event, "id"));
  const origin = getPublicSiteOrigin(useRuntimeConfig(event).public.SITE_URL);
  const { name, events, now } = await getManagerCalendar(id, origin);
  setHeader(event, "content-type", "text/calendar; charset=utf-8");
  setHeader(event, "x-robots-tag", "noindex");
  return serializeCalendarFeed(name, events, now);
});
