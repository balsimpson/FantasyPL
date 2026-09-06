import { getPlayerInfoDetails } from "~~/composables/usePremiereLeague";

export default defineCachedEventHandler(async (event) => {
	const rawId = String(event.context.params?.id ?? "").trim();

	if (!/^[1-9]\d*$/.test(rawId)) {
		throw createError({
			statusCode: 404,
			statusMessage: "Invalid player URL",
		});
	}

	try {
		const player = await getPlayerInfoDetails(Number(rawId));

		if (!player || typeof player !== "object" || Array.isArray(player)) {
			throw new Error("Player detail response was empty or malformed");
		}

		return player;
	} catch (error) {
		const statusCode = Number(
			(error as { statusCode?: number; status?: number; response?: { status?: number } })?.response?.status ??
			(error as { statusCode?: number })?.statusCode ??
			(error as { status?: number })?.status
		);

		if (statusCode === 404) {
			throw createError({
				statusCode: 404,
				statusMessage: "Player not found",
			});
		}

		console.error("getPlayerInfoDetails error:", error);
		throw createError({
			statusCode: 502,
			statusMessage: "Player data is temporarily unavailable",
		});
	}
}, {
	maxAge: 60 * 10,
	swr: true,
	getKey: (event) => `player-${event.context.params?.id ?? 'unknown'}`,
});
