import { getManagerPicks } from "~~/composables/usePremiereLeague";

export default defineCachedEventHandler(async (event) => {
	const { id, gw } = getQuery(event);
	if (![id, gw].every((value) => /^\d+$/.test(String(value ?? "")) && Number.isSafeInteger(Number(value)) && Number(value) > 0) || Number(gw) > 38) {
		throw createError({ statusCode: 400, statusMessage: "Invalid manager or gameweek." });
	}

	try {
		const picks = await getManagerPicks(Number(id), Number(gw));
		if (!Array.isArray(picks?.picks)) {
			throw new Error("FPL returned unexpected squad data.");
		}
		return picks.picks;
	} catch (error) {
		const status = Number((error as any)?.response?.status ?? (error as any)?.statusCode);
		throw createError({
			statusCode: status === 404 ? 404 : 503,
			statusMessage: status === 404 ? "Squad not found." : "FPL squad data is temporarily unavailable.",
		});
	}
}, {
	name: "manager-picks-v1",
	maxAge: 60,
	swr: false,
});
