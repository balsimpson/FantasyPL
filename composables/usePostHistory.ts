interface PostRecord {
  id: number;
  playerName: string;
  timestamp: number;
  type: "single" | "comparison";
  compareWith?: string;
}

export const usePostHistory = () => {
  const STORAGE_KEY = "fpl_post_history";
  const MAX_HISTORY = 50;

  // Use useState for SSR compatibility
  const history = useState<PostRecord[]>("postHistory", () => []);

  // Only run localStorage operations on client-side
  const initializeHistory = () => {
    if (process.client) {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        history.value = JSON.parse(stored);
      }
    }
  };

   const addToHistory = (record: PostRecord) => {
    if (!process.client) return;

    history.value = [record, ...history.value];

    // Keep only last MAX_HISTORY items
    if (history.value.length > MAX_HISTORY) {
      history.value = history.value.slice(0, MAX_HISTORY);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(history.value));
  };

  const getHistory = () => {
    return history.value;
  };

  const clearHistory = () => {
    if (!process.client) return;

    history.value = [];
    localStorage.removeItem(STORAGE_KEY);
  };

  // Initialize on client-side
  onMounted(() => {
    initializeHistory();
  });

  return {
    addToHistory,
    getHistory,
    clearHistory,
  };
};
