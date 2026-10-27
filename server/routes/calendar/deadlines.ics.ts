import { getBootstrapStatic } from "~~/composables/usePremiereLeague";
import { getPublicSiteOrigin } from "~/utils/site-url";
import { createDeadlineCalendarFeed } from "~/utils/deadline-calendar.js";

export default defineCachedEventHandler(async (event) => {
  const bootstrap = await getBootstrapStatic();
  const events = bootstrap?.events;

  if (!Array.isArray(events)) {
    throw createError({
      statusCode: 503,
      statusMessage: "FPL deadline data is temporarily unavailable.",
    });
  }

  const { public: { SITE_URL } } = useRuntimeConfig(event);
  const origin = getPublicSiteOrigin(SITE_URL);
  const calendar = createDeadlineCalendarFeed(events, origin);

  if (!calendar) {
    throw createError({
      statusCode: 503,
      statusMessage: "No published FPL deadlines are available.",
    });
  }

  setHeader(event, "content-type", "text/calendar; charset=utf-8");
  return calendar;
}, {
  name: "fpl-deadlines-calendar-v2",
  maxAge: 5 * 60,
  swr: true,
});
