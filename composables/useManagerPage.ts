export function useManagerPage(id: Ref<string>) {
	// Lazy navigation opens the page immediately; both requests still render on the server.
	const managerRequest = useFetch<Record<string, any>>(() => `/api/managers/${id.value}`, {
		lazy: true, timeout: 12_000, retry: 0,
	});
	const squadRequest = useFetch<Record<string, any>>(() => `/api/managers/${id.value}/squad`, {
		lazy: true, timeout: 24_000, retry: 0, query: { plan: 'true' },
	});
	const managerData = computed(() => String(managerRequest.data.value?.id ?? "") === id.value ? managerRequest.data.value : null);
	const squadData = computed(() => {
		const data = squadRequest.data.value;
		return managerData.value && data && String(data.managerId ?? "") === id.value && data.gameweek === managerData.value.current_event
			? data : null;
	});
	return {
		managerData,
		squadState: computed(() => squadData.value?.squad ?? null),
		fixtureData: computed(() => squadData.value?.fixtureData ?? null),
		transferPlans: computed(() => squadData.value?.transferPlans ?? []),
		pending: managerRequest.pending,
		error: managerRequest.error,
		isSquadLoading: computed(() => squadRequest.status.value === "pending" || squadRequest.status.value === "idle"),
		squadError: squadRequest.error,
		refresh: () => Promise.all([managerRequest.refresh(), squadRequest.refresh()]),
		refreshSquad: () => squadRequest.refresh(),
	};
}
