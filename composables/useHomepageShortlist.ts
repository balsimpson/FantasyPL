import { filterShortlistPlayers, rankShortlistPlayers, type ShortlistPlayer } from "~/utils/homepage-shortlist";

export function useHomepageShortlist(getPlayers: () => ShortlistPlayer[]) {
  const position = ref(0);
  const price = ref("");
  const sortKey = ref("form");
  const visibleCount = ref(6);
  const budget = computed(() => Math.round(Number(price.value) * 10));
  const priceError = computed(() => {
    if (price.value === "") return "";
    const value = Number(price.value) * 10;
    return !Number.isFinite(value) || value < 30 || value > 200 || Math.abs(value - Math.round(value)) > 0.0001
      ? "Enter £3.0m to £20.0m, in £0.1m steps." : "";
  });
  const filteredPlayers = computed(() => priceError.value ? [] : filterShortlistPlayers(getPlayers(), position.value, budget.value));
  const rankedPlayers = computed(() => rankShortlistPlayers(filteredPlayers.value, sortKey.value));
  const visiblePlayers = computed(() => rankedPlayers.value.slice(0, visibleCount.value));
  watch([position, price, sortKey], () => { visibleCount.value = 6; }, { flush: "sync" });
  return { position, price, priceError, sortKey, visibleCount, filteredPlayers, rankedPlayers, visiblePlayers };
}
