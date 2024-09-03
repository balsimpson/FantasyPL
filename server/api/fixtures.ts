import { getUpcomingFixtures } from "~~/composables/usePremiereLeague";

export default defineEventHandler(async () => {
	try {
		const data = await getUpcomingFixtures();
		return data;
	} catch (error) {
		console.log("getUpcomingFixtures-error", error);
		return {
			message: "getUpcomingFixtures: Error" + error,
		};
	}
});