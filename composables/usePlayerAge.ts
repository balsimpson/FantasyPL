import { getPlayerAge } from "~/utils/player-age";

export function usePlayerAge(getBirthDate: () => unknown) {
  const asOf = useState("player-age-as-of", () => new Date().toISOString().slice(0, 10));
  return computed(() => getPlayerAge(getBirthDate(), asOf.value));
}
