import Configuration from "openai";
import OpenAIApi from "openai";

export const getAssistance = async (prompt: string) => {
	const openai = initializeOpenAI();
	const thread = await openai.beta.threads.create();

	const message = await openai.beta.threads.messages.create(thread.id, {
		role: "user",
		//@ts-ignore
		content: prompt,
	});

	const run = await openai.beta.threads.runs.createAndPoll(thread.id, {
		assistant_id: "asst_Xgzwwhu9LTp7I7QOWFjApJ8X",
	});

	if (run.status === "completed") {
		const messages = await openai.beta.threads.messages.list(run.thread_id);
		//console.log("messages", messages)
		for (const message of messages.data) {
			if (message.role == "assistant") {
				//@ts-ignore
				return message.content[0].text.value;
			}
		}
	} else {
		console.log("run.status", run.status);
		return run.status;
	}
};

export const initializeOpenAI = () => {
	const runtimeConfig = useRuntimeConfig();
	const OPENAI_KEY = runtimeConfig.public.OPENAI_KEY;
	const configuration = new Configuration({
		// @ts-ignore
		apiKey: OPENAI_KEY,
	});
	// @ts-ignore
	return new OpenAIApi(configuration);
};
