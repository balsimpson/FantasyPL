import { getManagerPicks } from "~~/composables/usePremiereLeague";

export default defineEventHandler(async (event) => {
	try {
		const { id, gw } = getQuery(event);
		// @ts-ignore
		const picks: any = await getManagerPicks(id, gw);
		return picks.picks;
	} catch (error) {
		console.log("getManagerPicks error: ", error);
		return {
			message: "getManagerPicks-Error: " + error,
		};
	}
});
