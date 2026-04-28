import { getBootstrapStatic } from "~~/composables/usePremiereLeague";

export default defineCachedEventHandler(async () => {
	try {
		const data = await getBootstrapStatic();
		return data;
	} catch (error) {
		console.log("getBootstrapStatic-error", error);
		return {
			message: "getBootstrapStatic: Error" + error,
		};
	}
}, {
	maxAge: 60 * 10,
	swr: true,
});
