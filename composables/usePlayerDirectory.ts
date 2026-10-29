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
  const request = useFetch("/api/player-directory", {
    query: computed(() => ({
      q: String(route.query.q || ""), position: position.value, price: price.value,
      sort: sort.value, page: String(route.query.page || "1"),
    })),
    retry: 0,
  });
  watch(() => route.query.q, (value) => { search.value = String(value || ""); });
  return {
    request, search, position, price, sort,
    submit: () => update({ q: search.value.trim() || undefined }),
    pageLink: (page: number) => ({ path: "/players", query: { ...route.query, page: page > 1 ? String(page) : undefined } }),
  };
}
