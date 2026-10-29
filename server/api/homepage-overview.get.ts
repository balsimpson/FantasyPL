import { getHomepageBootstrap } from "../utils/homepage-data";
import { getHomepageCaptainPicks, getHomepagePlayerTrendSections } from "../../utils/homepage-shortlist";

// Rank the full catalogue, but serialize only players shown on the initial page.
export default defineEventHandler(async (event) => {
  const data = await getHomepageBootstrap(event);
  const picks = getHomepageCaptainPicks(data.elements);
  const trends = getHomepagePlayerTrendSections(data.elements);
  const recap = data.events.find((item: Record<string, any>) => item.is_current) || [...data.events].reverse().find((item) => item.finished);
  const ids = new Set([
    ...picks.captains, ...picks.viceCaptains, ...picks.differentials,
    ...trends.mostSold, ...trends.mostBought,
  ].map((player) => player.id));
  if (recap) {
    ids.add(recap.most_captained);
    ids.add(recap.most_vice_captained);
  }
  return { ...data, elements: data.elements.filter((player: Record<string, any>) => ids.has(player.id)) };
});
