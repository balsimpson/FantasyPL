import { getPlayerPredictions } from "~/composables/usePremiereLeague";

export default defineEventHandler(async (event) => {
	try {
		// @ts-ignore
		const picks: any = await getPlayerPredictions();
		return picks;
	} catch (error) {
		console.log("getPlayerPredictions error: ", error);
		return {
			message: "getPlayerPredictions-Error: " + error,
		};
	}
});