import { getPlayerInfoDetails } from "~~/composables/usePremiereLeague";

export default defineEventHandler(async (event) => {
	try {
        const id = event.context.params?.id
        // @ts-ignore
		const player = await getPlayerInfoDetails(id);        
		return player;
	} catch (error) {
		console.log("getPlayerInfoDetails error: ", error);
		return {
			message: "getPlayerInfoDetails-Error: " + error,
		};
	}
});