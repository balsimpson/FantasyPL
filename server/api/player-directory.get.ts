import { getHomepageBootstrap } from "../utils/homepage-data";
import { filterShortlistPlayers, rankShortlistPlayers, SHORTLIST_POSITIONS, SHORTLIST_PRICE_LIMITS } from "../../utils/homepage-shortlist";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const search = String(query.q || "").trim().toLowerCase().slice(0, 100);
  const position = SHORTLIST_POSITIONS.some((item) => item.value === Number(query.position)) ? Number(query.position) : 0;
  const price = SHORTLIST_PRICE_LIMITS.some((item) => item.value === Number(query.price)) ? Number(query.price) : 0;
  const requestedPage = Number.isSafeInteger(Number(query.page)) && Number(query.page) > 0 ? Number(query.page) : 1;
  const data = await getHomepageBootstrap(event);
  const teams = new Map(data.teams.map((team: Record<string, any>) => [team.id, team]));
  const terms = search.split(/\s+/).filter(Boolean);
  const players = filterShortlistPlayers(data.elements, position, price).filter((player) => {
    const team = teams.get(player.team) as Record<string, any> | undefined;
    const names = [player.first_name, player.second_name, player.web_name, team?.name, team?.short_name,
      team?.name?.replace(/\bMan\b/g, "Manchester").replace(/\bUtd\b/g, "United")].join(" ").toLowerCase();
    return terms.every((term) => names.includes(term));
  });
  const ranked = rankShortlistPlayers(players, String(query.sort || "form"));
  const pageSize = 24;
  const pages = Math.max(1, Math.ceil(ranked.length / pageSize));
  const page = Math.min(requestedPage, pages);
  return {
    elements: ranked.slice((page - 1) * pageSize, page * pageSize),
    teams: data.teams,
    total: ranked.length,
    page,
    pages,
    pageSize,
    fetchedAt: data.fetchedAt,
  };
});
