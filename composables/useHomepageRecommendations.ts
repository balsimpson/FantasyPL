import { useNearViewport } from "./useNearViewport";

export function useHomepageRecommendations() {
  const target = ref<HTMLElement | null>(null);
  const visible = useNearViewport(target);
  const options = { server: false, immediate: false };
  // This full catalogue is also reused by the public search when it is opened.
  const catalog = useLazyAsyncData("homepage-bootstrap",
    () => $fetch<Record<string, any>>("/api/homepage-bootstrap", { retry: 0 }), options);
  const fixtures = useLazyAsyncData("homepage-fixtures",
    () => $fetch<Record<string, any>>("/api/homepage-fixtures", { retry: 0 }), options);
  const trades = useLazyAsyncData("homepage-trade-recommendations",
    () => $fetch<Record<string, any>>("/api/homepage-trades", { retry: 0 }), options);
  const buys = useLazyAsyncData("homepage-buy-recommendations",
    () => $fetch<Record<string, any>>("/api/homepage-buys", { retry: 0 }), options);
  const pending = (request: typeof catalog) => computed(() => ["idle", "pending"].includes(request.status.value));
  const hasCatalog = computed(() => Array.isArray(catalog.data.value?.elements));
  const catalogPending = pending(catalog);
  const ensureCatalog = () => hasCatalog.value ? Promise.resolve() : catalog.refresh();

  watch(visible, (ready) => {
    if (ready) void Promise.all([ensureCatalog(), fixtures.refresh(), trades.refresh(), buys.refresh()]);
  });

  return {
    target,
    recommendationPlayers: computed(() => catalog.data.value?.elements || []),
    catalogPending,
    catalogFailed: computed(() => !catalogPending.value && !hasCatalog.value),
    fixtureData: fixtures.data,
    fixturesStatus: fixtures.status,
    fixturesRequestError: fixtures.error,
    refreshFixtures: fixtures.refresh,
    tradeRecommendationData: trades.data,
    tradeRecommendationError: trades.error,
    tradesPending: pending(trades),
    retryTradeRecommendations: () => Promise.all([ensureCatalog(), trades.refresh()]),
    buyRecommendationData: buys.data,
    buyRecommendationError: buys.error,
    buysPending: pending(buys),
    retryBuyRecommendations: () => Promise.all([ensureCatalog(), buys.refresh()]),
  };
}
