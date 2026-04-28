import { getPlayerInfoDetails } from "~~/composables/usePremiereLeague";

export default defineCachedEventHandler(async (event) => {
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
}, {
	maxAge: 60 * 10,
	swr: true,
	getKey: (event) => `player-${event.context.params?.id ?? 'unknown'}`,
});
