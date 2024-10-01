import { getTeamOfTheWeek } from "~~/composables/usePremiereLeague";

export default defineEventHandler(async (event) => {
	try {
		let { gameweek } = getQuery(event);
		console.log("getTeamOfTheWeek", gameweek);
		// @ts-ignore
		const data = await getTeamOfTheWeek(gameweek);
		return data;
	} catch (error) {
		console.log("getTeamOfTheWeek-error", error);
		return {
			message: "getTeamOfTheWeek: Error" + error,
		};
	}
});
