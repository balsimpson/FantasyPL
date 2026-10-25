import { getCachedFplBootstrap } from "../utils/fpl-bootstrap";

export default defineEventHandler(async (event) => {
	const { data, fetchedAt } = await getCachedFplBootstrap(event);
	return { ...data, fetchedAt };
});
