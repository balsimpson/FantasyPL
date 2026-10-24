export function useManagerPlayerDetails(
	getPlayerId: () => number,
	target: Ref<HTMLElement | null>,
) {
	const data = ref<Record<string, any> | null>(null);
	const loading = ref(true);
	const error = ref(false);
	let observer: IntersectionObserver | undefined;
	let controller: AbortController | undefined;

	const load = async () => {
		if (controller || data.value) return;
		loading.value = true;
		error.value = false;
		const request = new AbortController();
		controller = request;
		try {
			const result = await $fetch<Record<string, any>>(`/api/players/${getPlayerId()}`, { signal: request.signal });
			if (!result || !Array.isArray(result.history)) throw new Error('Player history unavailable');
			data.value = result;
		} catch {
			if (!request.signal.aborted) error.value = true;
		} finally {
			if (!request.signal.aborted) loading.value = false;
			controller = undefined;
		}
	};

	onMounted(() => {
		if (!target.value || typeof IntersectionObserver === 'undefined') {
			void load();
			return;
		}
		observer = new IntersectionObserver((entries) => {
			if (entries.some((entry) => entry.isIntersecting)) {
				observer?.disconnect();
				void load();
			}
		}, { rootMargin: '200px 0px' });
		observer.observe(target.value);
	});

	onBeforeUnmount(() => {
		observer?.disconnect();
		controller?.abort();
	});

	return { data, loading, error, retry: load };
}
