import { getBootstrapStatic } from "~~/composables/usePremiereLeague";

export default defineEventHandler(async (event) => {
	try {
		const data = await getBootstrapStatic();

		const gw = data.events.find((e: any) => e.is_current)
		// console.log("gameweek", gw);
        const resp = {
            players: data.elements || [],
            teams: data.teams,
			currentGameweek: data.events.find((e: any) => e.is_current)
        }
		return resp;
	} catch (error) {
		console.log("getPlayers-error", error);
		return {
			message: "getPlayers: Error" + error,
		};
	}
});