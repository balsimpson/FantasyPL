import { getManagerDetails } from "~~/composables/usePremiereLeague";

export default defineEventHandler(async (event) => {
	try {
        const id = event.context.params?.id
        // @ts-ignore
		const player = await getManagerDetails(id);        
		return player;
	} catch (error) {
		console.log("getManagerDetails error: ", error);
		return {
			message: "getManagerDetails-Error: " + error,
		};
	}
});