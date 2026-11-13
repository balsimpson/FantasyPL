import { SHORTLIST_POSITIONS, SHORTLIST_PRICE_LIMITS, SHORTLIST_SORTS } from "~/utils/homepage-shortlist";

export function usePlayerDirectory() {
  const route = useRoute();
  const router = useRouter();
  const search = ref(String(route.query.q || ""));
  const update = (changes: Record<string, string | undefined>) => router.push({
    query: { ...route.query, page: undefined, ...changes },
  });
  const filter = (key: string, fallback: string, values: string[]) => computed({
    get: () => values.includes(String(route.query[key])) ? String(route.query[key]) : fallback,
    set: (value: string) => { void update({ [key]: value === fallback ? undefined : value }); },
  });
  const position = filter("position", "0", SHORTLIST_POSITIONS.map((item) => String(item.value)));
  const price = filter("price", "0", SHORTLIST_PRICE_LIMITS.map((item) => String(item.value)));
  const sort = filter("sort", "form", SHORTLIST_SORTS.map((item) => item.value));
  const query = computed(() => ({
    q: String(route.query.q || ""), position: position.value, price: price.value,
    sort: sort.value, page: String(route.query.page || "1"),
  }));
  const request = useFetch("/api/player-directory", { query, retry: 0 });
  type DirectoryPage = NonNullable<typeof request.data.value>;

  const appendedPages = shallowRef<DirectoryPage[]>([]);
  const pendingLoad = shallowRef<AbortController>();
  const loadMoreError = ref(false);
  const players = computed(() => {
    const seen = new Set<number>();
    return [request.data.value, ...appendedPages.value].flatMap((page) => page?.elements ?? []).filter((player) => {
      if (seen.has(player.id)) return false;
      seen.add(player.id);
      return true;
    });
  });
  const teamsById = computed(() => new Map(request.data.value?.teams.map((team) => [team.id, team])));
  const nextPage = computed(() => {
    const lastPage = appendedPages.value.at(-1) ?? request.data.value;
    return lastPage && lastPage.page < lastPage.pages ? lastPage.page + 1 : undefined;
  });
  const loadingMore = computed(() => Boolean(pendingLoad.value));
  const canAutoLoad = computed(() => request.status.value === "success" && !!nextPage.value && !loadingMore.value && !loadMoreError.value);

  async function loadMore() {
    const page = nextPage.value;
    if (!page || !canAutoLoad.value) return;

    const controller = new AbortController();
    pendingLoad.value = controller;
    try {
      const result = await $fetch("/api/player-directory", {
        query: { ...query.value, page }, retry: 0, signal: controller.signal,
      });
      if (!controller.signal.aborted) appendedPages.value = [...appendedPages.value, result];
    } catch {
      if (!controller.signal.aborted) loadMoreError.value = true;
    } finally {
      if (!controller.signal.aborted) pendingLoad.value = undefined;
    }
  }

  watch([query, request.data], () => {
    pendingLoad.value?.abort();
    pendingLoad.value = undefined;
    appendedPages.value = [];
    loadMoreError.value = false;
  }, { flush: "sync" });
  onBeforeUnmount(() => pendingLoad.value?.abort());

  watch(() => route.query.q, (value) => { search.value = String(value || ""); });
  return {
    request, search, position, price, sort,
    players, teamsById, nextPage, loadingMore, loadMoreError, canAutoLoad, loadMore,
    submit: () => update({ q: search.value.trim() || undefined }),
    pageLink: (page: number) => ({ path: "/players", query: { ...route.query, page: page > 1 ? String(page) : undefined } }),
  };
}
