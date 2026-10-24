type SavedManager = {
  id: string;
  teamName: string;
  managerName: string;
};

const STORAGE_KEY = "savedManagers";

function normalizeManagers(value: unknown): SavedManager[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const id = String(item.id ?? "");
    if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id)) || seen.has(id)) return [];
    if (typeof item.teamName !== "string" || !item.teamName.trim()) return [];
    seen.add(id);
    return [{ id, teamName: item.teamName.trim(), managerName: typeof item.managerName === "string" ? item.managerName.trim() : "" }];
  });
}

export function useSavedManagers() {
  const savedManagers = useState<SavedManager[]>("saved-managers", () => []);

  const load = () => {
    try {
      savedManagers.value = normalizeManagers(JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]"));
    } catch {
      // Retain teams opened in this session if browser storage is unavailable.
    }
  };

  const remember = (manager: SavedManager) => {
    if (!import.meta.client) return;
    const [validManager] = normalizeManagers([manager]);
    if (!validManager) return;

    savedManagers.value = [validManager, ...savedManagers.value.filter((item) => item.id !== validManager.id)];
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(savedManagers.value));
      window.localStorage.setItem("savedManagerId", validManager.id);
    } catch {
      // Keep resolved teams available for this session when storage is blocked.
    }
  };

  const sync = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) load();
  };

  onMounted(() => {
    load();
    window.addEventListener("storage", sync);
  });
  onBeforeUnmount(() => {
    if (import.meta.client) window.removeEventListener("storage", sync);
  });

  return { savedManagers, remember };
}
