import { createHash } from "node:crypto";
import { getManagerHistory, getManagerPicks, getManagerTransfers } from "~~/composables/usePremiereLeague";
import { buildManagerSellingPrices, buildManagerTransferOptions, rankManagerTransferSuggestions } from "../../../utils/manager-recommendations";

const recommendationCache = new Map<number, { fingerprint: string; response: Record<string, any> }>();
const inFlightRequests = new Map<string, Promise<Record<string, any>>>();

const scoreCriteria = [
	"Clearly worse than keeping the current player.",
	"Weak or marginal evidence of an improvement.",
	"Mixed evidence or roughly equivalent options.",
	"A credible improvement supported by the supplied data.",
	"A strong improvement across multiple supplied measures.",
];

const modelPlayer = (player: Record<string, any>) => ({
	name: player.name,
	club: player.team,
	position: player.position,
	price: player.price,
	minutes: player.minutes,
	totalPoints: player.totalPoints,
	pointsPerGame: player.pointsPerGame,
	form: player.form,
	availability: player.availability,
	chanceOfPlaying: player.chanceOfPlaying,
	expectedPoints: player.expectedPoints,
});

export default defineEventHandler(async (event) => {
	setResponseHeader(event, "Cache-Control", "no-store");
	const rawId = String(getRouterParam(event, "id") ?? "");
	const managerId = Number(rawId);
	if (!/^\d+$/.test(rawId) || !Number.isSafeInteger(managerId) || managerId < 1) {
		throw createError({ statusCode: 400, statusMessage: "Invalid Manager ID." });
	}

	const apiKey = useRuntimeConfig(event).JEV_API_KEY || process.env.JEV_API_KEY;
	if (!apiKey) {
		throw createError({ statusCode: 503, statusMessage: "Recommendations are not configured." });
	}

	const [manager, bootstrap] = await Promise.all([
		$fetch<Record<string, any>>(`/api/managers/${managerId}`, { retry: 0 }),
		$fetch<Record<string, any>>("/api/bootstrap-static", { retry: 0 }),
	]);
	const currentGameweek = Number(manager.current_event);
	if (!Number.isSafeInteger(currentGameweek) || currentGameweek < 1 || currentGameweek > 38) {
		throw createError({ statusCode: 503, statusMessage: "The current manager gameweek is unavailable." });
	}

	let selection: Record<string, any>;
	let transferHistory: Record<string, any>[];
	let managerHistory: Record<string, any>;
	try {
		[selection, transferHistory, managerHistory] = await Promise.all([
			getManagerPicks(managerId, currentGameweek),
			getManagerTransfers(managerId),
			getManagerHistory(managerId),
		]);
	} catch (error) {
		const status = Number((error as any)?.response?.status ?? (error as any)?.statusCode);
		throw createError({
			statusCode: status === 404 ? 404 : 503,
			statusMessage: status === 404 ? "The manager squad was not found." : "Current squad and transfer history are temporarily unavailable.",
		});
	}

	if (!Array.isArray(selection?.picks) || !Array.isArray(transferHistory) || !Array.isArray(managerHistory?.chips) || !Array.isArray(bootstrap?.elements) || !Array.isArray(bootstrap?.teams) || !Array.isArray(bootstrap?.events)) {
		throw createError({ statusCode: 503, statusMessage: "Current FPL player data is temporarily unavailable." });
	}
	const playerIds = new Set(bootstrap.elements.map((player: Record<string, any>) => Number(player.id)));
	const hasCompletePicks = selection.picks.length > 0 && selection.picks.every((pick: Record<string, any>) => {
		const playerId = Number(pick.element);
		return Number.isSafeInteger(playerId) && playerIds.has(playerId);
	});
	if (!hasCompletePicks) {
		throw createError({ statusCode: 503, statusMessage: "The manager's squad data is temporarily unavailable." });
	}
	if (selection.active_chip === "freehit") {
		return {
			currentGameweek,
			nextGameweek: Number(bootstrap.events.find((entry: Record<string, any>) => entry.is_next)?.id) || null,
			suggestions: [],
			message: "Recommendations are unavailable during a Free Hit because this squad is temporary.",
		};
	}
	const rawBank = selection.entry_history?.bank;
	const bank = Number(rawBank);
	if (rawBank === null || rawBank === undefined || rawBank === "" || !Number.isFinite(bank) || bank < 0) {
		throw createError({ statusCode: 503, statusMessage: "The manager's available budget is temporarily unavailable." });
	}
	const freeHitGameweeks = new Set<number>(managerHistory.chips
		.filter((chip: Record<string, any>) => chip.name === "freehit")
		.map((chip: Record<string, any>) => Number(chip.event))
		.filter((gameweek: number) => Number.isSafeInteger(gameweek) && gameweek > 0));
	const sellingPrices = buildManagerSellingPrices(selection.picks, bootstrap.elements, transferHistory, freeHitGameweeks, managerId);
	if (sellingPrices.size !== selection.picks.length) {
		throw createError({ statusCode: 503, statusMessage: "Sale values could not be verified for the full manager squad." });
	}

	const nextGameweek = Number(bootstrap.events.find((entry: Record<string, any>) => entry.is_next)?.id) || null;
	if (!nextGameweek) {
		return {
			currentGameweek,
			nextGameweek: null,
			suggestions: [],
			message: "There is no upcoming gameweek in the current FPL data.",
		};
	}

	const options = buildManagerTransferOptions(
		selection.picks,
		bootstrap.elements,
		bootstrap.teams,
		sellingPrices,
		bank,
		currentGameweek,
		nextGameweek,
	);
	if (!options.length) {
		return {
			currentGameweek,
			nextGameweek,
			suggestions: [],
			message: "No affordable, available same-position player passed the performance and squad checks.",
		};
	}

	const state = {
		currentGameweek,
		targetGameweek: nextGameweek,
		bank: roundToTenth(bank / 10),
		priceUnit: "Prices are in £m. Points per game, form, minutes, and the next-gameweek FPL estimate use the current official feed.",
		constraints: "Each option is a single same-position transfer. The server has checked budget, availability, a 90-minute minimum sample, and the three-player club limit. It is no worse on available form, points per game, and next-gameweek FPL estimate, and improves at least one. Budget is a feasibility constraint, not a ranking goal.",
		options: options.map(({ questionId, outgoing, incoming, netCost, bankAfter }) => ({
			id: questionId,
			outgoing: modelPlayer(outgoing),
			incoming: modelPlayer(incoming),
			netCost,
			bankAfter,
		})),
	};
	const questions = Object.fromEntries(options.map((option) => [option.questionId, {
		type: "score",
		instructions: `Compare the replacement with the current player for FPL Gameweek ${nextGameweek}. Every option already passed a server-side performance gate: it is no worse on available form, points per game, and FPL next-gameweek estimate, and improves at least one. Prioritize those performance signals, minutes, and availability over cost. The price is already feasible; do not reward saving money by itself. Treat the FPL estimate as uncertain, do not infer injuries or lineups, and do not describe this score as projected points.`,
		criteria: scoreCriteria,
	}]));
	const requestBody = { model: "jev-latest", state, questions };
	const fingerprint = createHash("sha256")
		.update(JSON.stringify({ requestBody, options }))
		.digest("hex");
	const cachedFingerprint = getQuery(event).cachedFingerprint;
	if (typeof cachedFingerprint === "string" && cachedFingerprint === fingerprint) {
		return { unchanged: true, fingerprint };
	}
	const cached = recommendationCache.get(managerId);
	if (cached?.fingerprint === fingerprint) return cached.response;

	let result: Record<string, any>;
	try {
		let request = inFlightRequests.get(fingerprint);
		if (!request) {
			request = $fetch<Record<string, any>>("https://api.typesafe.ai/v1/systemone", {
				method: "POST",
				headers: { Authorization: `Bearer ${apiKey}` },
				timeout: 15_000,
				retry: 0,
				body: requestBody,
			});
			inFlightRequests.set(fingerprint, request);
		}
		result = await request;
	} catch (error) {
		const status = Number((error as any)?.response?.status ?? (error as any)?.statusCode);
		console.error("TypeSafe System One recommendation request failed", { status });
		throw createError({
			statusCode: status === 429 ? 503 : 502,
			statusMessage: status === 429 ? "Recommendations are busy. Try again shortly." : "Recommendations are temporarily unavailable.",
		});
	} finally {
		inFlightRequests.delete(fingerprint);
	}

	if (!result?.answers || typeof result.answers !== "object" || Object.keys(result.answers).length === 0) {
		throw createError({ statusCode: 502, statusMessage: "The recommendation service returned an incomplete response." });
	}
	const hasValidScore = options.some((option) => {
		const answer = result.answers[option.questionId];
		return answer?.type === "score" && answer.score !== null && answer.score !== undefined && Number.isFinite(Number(answer.score));
	});
	if (!hasValidScore) {
		throw createError({ statusCode: 502, statusMessage: "The recommendation service returned an incomplete response." });
	}

	const suggestions = rankManagerTransferSuggestions(options, result.answers).map((suggestion) => {
		const publicSuggestion = { ...suggestion };
		delete publicSuggestion.questionId;
		delete publicSuggestion.score;
		delete publicSuggestion.confidence;
		return publicSuggestion;
	});
	const response = {
		fingerprint,
		currentGameweek,
		nextGameweek,
		suggestions,
		message: suggestions.length ? null : "No clear evidence-backed upgrade was found among the affordable options.",
	};
	recommendationCache.set(managerId, { fingerprint, response });
	return response;
});

function roundToTenth(value: number) {
	return Math.round(value * 10) / 10;
}
