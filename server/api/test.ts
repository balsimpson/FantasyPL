import { getSubscriberCount } from "~~/composables/useUtils";

export default defineEventHandler(async (event) => {
	try {
		// @ts-ignore
		const data = await getSubscriberCount();
		console.log("data", data);
		return data;
	} catch (error) {
		console.log("getTeamOfTheWeek-error", error);
		return {
			message: "getTeamOfTheWeek: Error" + error,
		};
	}
});