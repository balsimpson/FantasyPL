import { filterShortlistPlayers, rankShortlistPlayers, SHORTLIST_POSITIONS, SHORTLIST_PRICE_LIMITS, SHORTLIST_SORTS, type ShortlistPlayer } from "~/utils/homepage-shortlist";

export function useHomepageShortlist(getPlayers: () => ShortlistPlayer[], getTeams: () => Record<string, any>[]) {
  const query = useState("homepage-player-query", () => "");
  const position = useState("homepage-player-position", () => 0);
  const maxPrice = useState("homepage-player-price", () => 0);
  const sortKey = useState("homepage-player-sort", () => "form");
  const visibleCount = useState("homepage-player-count", () => 12);
  const preferencesInitialized = useState("homepage-player-preferences-initialized", () => false);
  const preferencesKey = "homepage-player-preferences";
  const lastRankingKey = "homepage-player-last-ranking";
  let preferencesReady = false;

  onMounted(() => {
    if (preferencesInitialized.value) {
      preferencesReady = true;
      return;
    }

    let lastRanking: string | null = null;
    let restored = false;
    try {
      lastRanking = localStorage.getItem(lastRankingKey);
      const saved = JSON.parse(localStorage.getItem(preferencesKey) || "null");
      if (saved && typeof saved.query === "string"
        && SHORTLIST_POSITIONS.some((item) => item.value === saved.position)
        && SHORTLIST_PRICE_LIMITS.some((item) => item.value === saved.maxPrice)
        && SHORTLIST_SORTS.some((item) => item.value === saved.sortKey)) {
        query.value = saved.query;
        position.value = saved.position;
        maxPrice.value = saved.maxPrice;
        sortKey.value = saved.sortKey;
        restored = true;
      }
    } catch {
      // A blocked or malformed store must not prevent player discovery.
    }
    if (!restored) {
      const rankings = SHORTLIST_SORTS.filter((item) => item.value !== lastRanking);
      sortKey.value = rankings[Math.floor(Math.random() * rankings.length)]!.value;
      try {
        localStorage.setItem(lastRankingKey, sortKey.value);
      } catch {
        // Discovery still works when the browser blocks storage.
      }
    }
    preferencesInitialized.value = true;
    preferencesReady = true;
  });

  watch([query, position, maxPrice, sortKey], () => {
    if (!preferencesReady) return;
    try {
      localStorage.setItem(preferencesKey, JSON.stringify({
        query: query.value, position: position.value, maxPrice: maxPrice.value, sortKey: sortKey.value,
      }));
    } catch {
      // Keep the current choices usable even when they cannot be saved.
    }
  }, { flush: "sync" });

  const teamsById = computed(() => new Map(getTeams().map((team) => [team.id, team])));
  const filteredPlayers = computed(() => {
    const players = filterShortlistPlayers(getPlayers(), position.value, maxPrice.value);
    const search = query.value.trim().toLowerCase();
    if (!search) return players;
    const terms = search.split(/\s+/);
    return players.filter((player) => {
      const team = teamsById.value.get(player.team);
      const searchableText = [
        player.first_name, player.second_name, player.web_name,
        team?.name, team?.short_name,
        team?.name?.replace(/\bMan\b/g, "Manchester").replace(/\bUtd\b/g, "United"),
      ].filter(Boolean).join(" ").toLowerCase();
      return terms.every((term) => searchableText.includes(term));
    });
  });
  const rankedPlayers = computed(() => rankShortlistPlayers(filteredPlayers.value, sortKey.value));
  const visiblePlayers = computed(() => rankedPlayers.value.slice(0, visibleCount.value));
  watch([query, position, maxPrice, sortKey], () => { visibleCount.value = 12; }, { flush: "sync" });
  return { query, position, maxPrice, sortKey, visibleCount, filteredPlayers, rankedPlayers, visiblePlayers };
}
