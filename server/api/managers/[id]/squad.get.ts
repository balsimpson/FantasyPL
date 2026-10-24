import { buildManagerSquad } from "../../../utils/manager-squad";

export default defineEventHandler(async (event) => {
	const id = String(getRouterParam(event, "id") ?? "");
	if (!/^\d+$/.test(id) || !Number.isSafeInteger(Number(id)) || Number(id) < 1) {
		throw createError({ statusCode: 400, statusMessage: "Invalid Manager ID." });
	}

	// Start the catalogue and manager lookup together. Picks need only the manager's gameweek.
	const managerRequest = $fetch<Record<string, any>>(`/api/managers/${id}`, { retry: 0 });
	const [bootstrap, selection] = await Promise.all([
		$fetch<Record<string, any>>("/api/bootstrap-static", { retry: 0 }),
		managerRequest.then(async (manager) => ({
			manager,
			picks: manager.current_event
				? await $fetch<Record<string, any>[]>("/api/managers/picks", {
					query: { id: manager.id, gw: manager.current_event }, retry: 0,
				})
				: [],
		})),
	]);

	if (!Array.isArray(bootstrap?.elements) || !Array.isArray(bootstrap?.teams) || !Array.isArray(bootstrap?.events)) {
		throw createError({ statusCode: 503, statusMessage: "Current player data is temporarily unavailable." });
	}
	return {
		managerId: selection.manager.id,
		gameweek: selection.manager.current_event,
		squad: buildManagerSquad(selection.picks, bootstrap),
	};
});
