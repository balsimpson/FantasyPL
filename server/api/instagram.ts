import { getAssistance } from "~/composables/useAssitant";

export default defineEventHandler(async (event) => {
	try {
		const body = await readBody(event);

		const reply = await getAssistance(body.prompt);
		console.log("reply", reply);
		return {
			message: reply,
		};
	} catch (error) {
		console.log("error", error);
		return {
			message: "Error: " + error,
		};
	}
});