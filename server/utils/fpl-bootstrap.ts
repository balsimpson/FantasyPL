import type { H3Event } from "h3";
import { fetchFplJson, isFplBootstrap } from "../../utils/fpl-fetch";

// Both public bootstrap endpoints share valid data and in-flight requests.
export const getCachedFplBootstrap = defineCachedFunction(async (_event?: H3Event) => {
  try {
    const data = await fetchFplJson("https://fantasy.premierleague.com/api/bootstrap-static/", isFplBootstrap);
    return { data, fetchedAt: new Date().toISOString() };
  } catch {
    throw createError({ statusCode: 502, statusMessage: "Current FPL data is temporarily unavailable" });
  }
}, {
  name: "fpl-bootstrap-v1",
  getKey: () => "current-season",
  maxAge: 600,
  swr: true,
  validate: (entry) => {
    const snapshot = entry.value;
    if (!isFplBootstrap(snapshot?.data)) return false;
    const age = Date.now() - Date.parse(snapshot.fetchedAt);
    const next = snapshot.data.events.find((event: Record<string, any>) => event.is_next);
    // Do not serve an old deadline or allow an outage to keep data indefinitely.
    return age >= 0 && age < 1_200_000 && (!next || Date.parse(next.deadline_time) > Date.now());
  },
});
