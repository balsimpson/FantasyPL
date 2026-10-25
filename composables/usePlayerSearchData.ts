import { getShortlistGameweeks } from "~/utils/homepage-shortlist";

export function usePlayerSearchData() {
  const { isOpen } = usePlayerSearchSurface();
  const { data: homepage } = useNuxtData<Record<string, any>>("homepage-bootstrap");
  const { data: watchlist } = useNuxtData<Record<string, any>>("watchlist-bootstrap");
  const { data: homepageFixtures } = useNuxtData<Record<string, any>>("homepage-fixtures");
  const bootstrapRequest = useLazyAsyncData("public-player-search-bootstrap",
    () => $fetch<Record<string, any>>("/api/homepage-bootstrap", { retry: 0 }),
    { server: false, immediate: false });
  const fixtureRequest = useLazyAsyncData("public-player-search-fixtures",
    () => $fetch<Record<string, any>>("/api/homepage-fixtures", { retry: 0 }),
    { server: false, immediate: false });

  const bootstrap = computed(() => [homepage.value, watchlist.value, bootstrapRequest.data.value]
    .find((data) => Array.isArray(data?.elements)));
  const fixtures = computed(() => [homepageFixtures.value, fixtureRequest.data.value]
    .find((data) => Array.isArray(data?.fixtures)));
  const hasCatalog = computed(() => Array.isArray(bootstrap.value?.elements));
  const hasFixtures = computed(() => Array.isArray(fixtures.value?.fixtures));
  const pending = computed(() => !hasCatalog.value && ["idle", "pending"].includes(bootstrapRequest.status.value));
  const fixturesPending = computed(() => !hasFixtures.value && ["idle", "pending"].includes(fixtureRequest.status.value));
  const retry = () => Promise.all([
    hasCatalog.value ? Promise.resolve() : bootstrapRequest.refresh(),
    hasFixtures.value ? Promise.resolve() : fixtureRequest.refresh(),
  ]);

  watch(isOpen, (open) => {
    if (!open) return;
    if (!hasCatalog.value && bootstrapRequest.status.value !== "pending") bootstrapRequest.refresh();
    if (!hasFixtures.value && fixtureRequest.status.value !== "pending") fixtureRequest.refresh();
  }, { immediate: true });

  return {
    bootstrap,
    fixtures: computed(() => fixtures.value?.fixtures || []),
    gameweeks: computed(() => getShortlistGameweeks(bootstrap.value?.events || [])),
    hasFixtures,
    pending,
    fixturesPending,
    failed: computed(() => !hasCatalog.value && !pending.value),
    retry,
  };
}
