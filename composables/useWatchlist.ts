const WATCHLIST_STORAGE_KEY = "savedWatchlist";
const WATCHLIST_CHANGE_EVENT = "fantasypl:watchlist-change";

export type WatchlistCode = string | number | null | undefined;

export function normalizeWatchlistCode(value: unknown) {
	if (typeof value === "number" && Number.isFinite(value)) {
		return String(value);
	}

	if (typeof value === "string" && value.trim()) {
		return value.trim();
	}

	return null;
}

export function normalizeWatchlistCodes(value: unknown) {
	if (!Array.isArray(value)) {
		return [];
	}

	const seen = new Set<string>();

	return value.reduce<string[]>((codes, item) => {
		const code = normalizeWatchlistCode(item);

		if (code && !seen.has(code)) {
			seen.add(code);
			codes.push(code);
		}

		return codes;
	}, []);
}

function readStoredWatchlist() {
	if (!import.meta.client) {
		return { raw: null, codes: [] };
	}

	let raw: string | null = null;

	try {
		raw = window.localStorage.getItem(WATCHLIST_STORAGE_KEY);

		if (!raw) {
			return { raw, codes: [] };
		}

		return {
			raw,
			codes: normalizeWatchlistCodes(JSON.parse(raw)),
		};
	} catch {
		return { raw, codes: [] };
	}
}

function writeStoredWatchlist(codes: string[]) {
	if (!import.meta.client) {
		return false;
	}

	try {
		window.localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(codes));
		window.dispatchEvent(new CustomEvent(WATCHLIST_CHANGE_EVENT));
		return true;
	} catch {
		return false;
	}
}

export function useWatchlist() {
	const savedCodes = useState<string[]>("fantasypl-watchlist-codes", () => []);
	const hasLoaded = useState("fantasypl-watchlist-loaded", () => false);

	const load = () => {
		if (!import.meta.client) {
			return;
		}

		const { raw, codes } = readStoredWatchlist();
		savedCodes.value = codes;
		hasLoaded.value = true;

		// Migrate the existing numeric-array format and repair malformed values
		// the next time the browser-local list is read.
		if (raw !== null && raw !== JSON.stringify(codes)) {
			writeStoredWatchlist(codes);
		}
	};

	const persist = (codes: string[]) => {
		savedCodes.value = codes;
		hasLoaded.value = true;
		writeStoredWatchlist(codes);
	};

	const isSaved = (value: WatchlistCode) => {
		const code = normalizeWatchlistCode(value);

		return code ? savedCodes.value.includes(code) : false;
	};

	const add = (value: WatchlistCode) => {
		const code = normalizeWatchlistCode(value);

		if (!code || savedCodes.value.includes(code)) {
			return false;
		}

		persist([...savedCodes.value, code]);
		return true;
	};

	const remove = (value: WatchlistCode) => {
		const code = normalizeWatchlistCode(value);

		if (!code || !savedCodes.value.includes(code)) {
			return false;
		}

		persist(savedCodes.value.filter((savedCode) => savedCode !== code));
		return true;
	};

	const toggle = (value: WatchlistCode) => {
		return isSaved(value) ? remove(value) : add(value);
	};

	const syncFromStorage = () => {
		load();
	};

	if (import.meta.client) {
		onMounted(() => {
			load();
			window.addEventListener("storage", syncFromStorage);
			window.addEventListener(WATCHLIST_CHANGE_EVENT, syncFromStorage);
		});

		onBeforeUnmount(() => {
			window.removeEventListener("storage", syncFromStorage);
			window.removeEventListener(WATCHLIST_CHANGE_EVENT, syncFromStorage);
		});
	}

	return {
		savedCodes,
		hasLoaded,
		load,
		isSaved,
		add,
		remove,
		toggle,
	};
}
