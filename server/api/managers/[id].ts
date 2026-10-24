import { getManagerDetails } from "~~/composables/usePremiereLeague";

export default defineCachedEventHandler(async (event) => {
	const rawId = event.context.params?.id ?? "";
	const id = Number(rawId);

	if (!/^\d+$/.test(rawId) || !Number.isSafeInteger(id) || id < 1) {
		throw createError({ statusCode: 400, statusMessage: "Invalid Manager ID." });
	}

	try {
		const manager = await getManagerDetails(id);

		if (!manager || Number(manager.id) !== id) {
			throw createError({ statusCode: 502, statusMessage: "FPL returned unexpected manager data." });
		}

		return manager;
	} catch (error) {
		const upstreamStatus = Number(
			(error as any)?.statusCode ??
				(error as any)?.status ??
				(error as any)?.response?.status ??
				(error as any)?.data?.statusCode
		);

		if (upstreamStatus === 404) {
			throw createError({ statusCode: 404, statusMessage: "Manager not found." });
		}

		throw createError({
			statusCode: upstreamStatus === 429 || upstreamStatus >= 500 ? 503 : 502,
			statusMessage: "FPL manager data is temporarily unavailable.",
		});
	}
}, {
	name: "manager-details-v1",
	maxAge: 60,
	swr: false,
});
