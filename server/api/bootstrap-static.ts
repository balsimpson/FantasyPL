import { getBootstrapStatic } from "~~/composables/usePremiereLeague";

export default defineEventHandler(async (event) => {
	try {
		const data = await getBootstrapStatic();
		return data;
	} catch (error) {
		console.log("getBootstrapStatic-error", error);
		return {
			message: "getBootstrapStatic: Error" + error,
		};
	}
});