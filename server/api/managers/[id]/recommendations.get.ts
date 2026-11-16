import { createHash } from "node:crypto";
import { getManagerHistory, getManagerPicks, getManagerTransfers } from "~~/composables/usePremiereLeague";
import { buildManagerSellingPrices, buildManagerTransferOptions, rankManagerTransferSuggestions } from "../../../utils/manager-recommendations";
import { getManagerFixtures } from "../../../utils/manager-fixtures";
import { managerTransferPlans, managerTransferGuidance, type ManagerTransferChip } from "../../../../shared/manager-transfer-plan";
import { isManagerPlayerAvailable } from "../../../../utils/manager-availability";
import { getPlannerFixtureRun, summarizePlannerRun } from "../../../../utils/manager-planner";

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
	news: player.news,
	squadRole: player.squadRole,
	expectedPoints: player.expectedPoints,
	fixtureRun: player.fixtureRun ?? null,
	fixtureSummary: player.fixtureSummary ?? null,
});

export default defineEventHandler(async (event) => {
	setResponseHeader(event, "Cache-Control", "no-store");
	const rawId = String(getRouterParam(event, "id") ?? "");
	const managerId = Number(rawId);
	if (!/^\d+$/.test(rawId) || !Number.isSafeInteger(managerId) || managerId < 1) {
		throw createError({ statusCode: 400, statusMessage: "Invalid Manager ID." });
	}

	const apiKey = useRuntimeConfig(event).JEV_API_KEY || process.env.JEV_API_KEY;
	const query = getQuery(event);
	const chip = String(query.chip ?? 'none') as ManagerTransferChip;
	if (!managerTransferPlans.some((plan) => plan.value === chip)) {
		throw createError({ statusCode: 400, statusMessage: "Unknown chip plan." });
	}

	const [manager, bootstrap, fixtureData] = await Promise.all([
		$fetch<Record<string, any>>(`/api/managers/${managerId}`, { retry: 0 }),
		$fetch<Record<string, any>>("/api/bootstrap-static", { retry: 0 }),
		getManagerFixtures().catch(() => null),
	]);
	const currentGameweek = Number(manager.current_event);
	if (!Number.isSafeInteger(currentGameweek) || currentGameweek < 1 || currentGameweek > 38) {
		throw createError({ statusCode: 503, statusMessage: "The current manager gameweek is unavailable." });
	}

	let selection: Record<string, any>;
	let transferHistory: Record<string, any>[];
	let managerHistory: Record<string, any> | null;
	try {
		[selection, transferHistory, managerHistory] = await Promise.all([
			getManagerPicks(managerId, currentGameweek),
			getManagerTransfers(managerId),
			getManagerHistory(managerId).catch(() => null),
		]);
	} catch (error) {
		const status = Number((error as any)?.response?.status ?? (error as any)?.statusCode);
		throw createError({
			statusCode: status === 404 ? 404 : 503,
			statusMessage: status === 404 ? "The manager squad was not found." : "Current squad and transfer history are temporarily unavailable.",
		});
	}

	if (!Array.isArray(selection?.picks) || !Array.isArray(transferHistory) || !Array.isArray(bootstrap?.elements) || !Array.isArray(bootstrap?.teams) || !Array.isArray(bootstrap?.events)) {
		throw createError({ statusCode: 503, statusMessage: "Current FPL player data is temporarily unavailable." });
	}
	const playerIds = new Set(bootstrap.elements.map((player: Record<string, any>) => Number(player.id)));
	const hasCompletePicks = selection.picks.length === 15 && new Set(selection.picks.map((pick: Record<string, any>) => Number(pick.element))).size === 15 && selection.picks.every((pick: Record<string, any>) => {
		const playerId = Number(pick.element);
		return Number.isSafeInteger(playerId) && playerIds.has(playerId);
	});
	if (!hasCompletePicks) {
		throw createError({ statusCode: 503, statusMessage: "The manager's squad data is temporarily unavailable." });
	}
	const publishedChip = selection.active_chip ?? null;
	let squadGameweek = currentGameweek;
	// The current Free Hit squad expires. Plan transfers from the permanent squad.
	if (publishedChip === 'freehit') {
		if (currentGameweek <= 1) throw createError({ statusCode: 503, statusMessage: "The permanent squad is unavailable." });
		try {
			selection = await getManagerPicks(managerId, currentGameweek - 1);
			squadGameweek = currentGameweek - 1;
		} catch {
			throw createError({ statusCode: 503, statusMessage: "The squad before Free Hit could not load. Try again shortly." });
		}
		if (!Array.isArray(selection?.picks) || selection.picks.length !== 15 || new Set(selection.picks.map((pick: Record<string, any>) => Number(pick.element))).size !== 15 || selection.picks.some((pick: Record<string, any>) => !playerIds.has(Number(pick.element)))) {
			throw createError({ statusCode: 503, statusMessage: "The permanent squad is incomplete." });
		}
	}
	const rawBank = selection.entry_history?.bank;
	const bank = Number(rawBank);
	if (rawBank === null || rawBank === undefined || rawBank === "" || !Number.isFinite(bank) || bank < 0) {
		throw createError({ statusCode: 503, statusMessage: "The manager's available budget is temporarily unavailable." });
	}
	const chipHistory = Array.isArray(managerHistory?.chips) ? managerHistory.chips : null;
	const freeHitGameweeks = new Set<number>((chipHistory ?? [])
		.filter((row: Record<string, any>) => row.name === 'freehit')
		.map((row: Record<string, any>) => Number(row.event)));
	if (publishedChip === 'freehit') freeHitGameweeks.add(currentGameweek);
	const unknownChipGameweeks = new Set<number>();
	// Only published transfers belong to the published squad and budget.
	transferHistory = transferHistory.filter((row) => !Number.isFinite(Number(row.event)) || Number(row.event) <= currentGameweek);
	if (!chipHistory) {
		// Chip history is optional. Event picks can still identify temporary acquisitions.
		const ownedIds = new Set(selection.picks.map((pick: Record<string, any>) => Number(pick.element)));
		const relevantTransfers = transferHistory.filter((row) => ownedIds.has(Number(row.element_in)) || ownedIds.has(Number(row.element_out)));
		const events = [...new Set(relevantTransfers.map((row) => Number(row.event)))].filter((week) => Number.isInteger(week) && week > 0 && week !== currentGameweek);
		await Promise.all(events.map(async (week) => {
			try {
				const picks = await getManagerPicks(managerId, week) as Record<string, any>;
				if (!Object.hasOwn(picks, 'active_chip')) unknownChipGameweeks.add(week);
				else if (picks.active_chip === 'freehit') freeHitGameweeks.add(week);
			} catch { unknownChipGameweeks.add(week); }
		}));
		if (!Object.hasOwn(selection, 'active_chip') && !publishedChip) unknownChipGameweeks.add(currentGameweek);
	}
	const sellingPrices = buildManagerSellingPrices(selection.picks, bootstrap.elements, transferHistory, freeHitGameweeks, managerId, unknownChipGameweeks);

	const nextGameweek = Number(bootstrap.events.find((entry: Record<string, any>) => entry.is_next)?.id) || null;
	if (!nextGameweek) {
		return {
			currentGameweek,
			nextGameweek: null,
			suggestions: [],
			message: "There is no upcoming gameweek in the current FPL data.",
		};
	}

	const availableGameweeks = fixtureData?.gameweeks[0] === nextGameweek ? fixtureData.gameweeks : [nextGameweek];
	const targetGameweek = query.gameweek === undefined ? nextGameweek : Number(query.gameweek);
	if (!Number.isInteger(targetGameweek) || !availableGameweeks.includes(targetGameweek)) {
		throw createError({ statusCode: 400, statusMessage: "Fixtures for the selected gameweek are unavailable. Choose the next gameweek or retry fixtures." });
	}
	const hasFixtures = fixtureData?.gameweeks[0] === nextGameweek;
	const gameweeks = !hasFixtures ? [] : chip === 'freehit' || chip === 'bboost'
		? [targetGameweek] : availableGameweeks.filter((week: number) => week >= targetGameweek);
	const baseOptions = buildManagerTransferOptions(
		selection.picks, bootstrap.elements, bootstrap.teams, sellingPrices, bank, currentGameweek, nextGameweek,
		{ chip, targetGameweek, gameweeks, fixtures: hasFixtures ? fixtureData!.fixtures : undefined },
	);
	const players = new Map<number, Record<string, any>>(bootstrap.elements.map((player: Record<string, any>) => [Number(player.id), player]));
	const attention = selection.picks.flatMap((pick: Record<string, any>) => {
		const player = players.get(Number(pick.element))!;
		if (isManagerPlayerAvailable(player)) return [];
		const hasOption = baseOptions.some((option) => option.outgoing.id === player.id);
		return [{ id: player.id, name: [player.first_name, player.second_name].filter(Boolean).join(' ') || player.web_name,
			role: Number(pick.position) > 11 ? 'Published bench' : 'Published XI',
			news: player.news || 'Availability not confirmed by FPL',
			message: hasOption ? 'Replacement option below.' : !sellingPrices.has(player.id)
				? 'Sale value could not be verified. Check your transfer budget in FPL.'
				: 'No fit, affordable replacement with recent playing evidence was found. Check team news and your bench cover.' }];
	});
	const context = {
		targetGameweek, chip, squadGameweek, publishedChip, chipHistory,
		guidance: managerTransferGuidance[chip], attention,
		squadNote: publishedChip === 'freehit' ? `Based on your GW ${squadGameweek} permanent squad before Free Hit, not the temporary squad shown above.` : `Based on your published GW ${squadGameweek} squad.`,
		transferNote: 'Each card is a separate option using the same bank, not a combined transfer plan. Confirm sale prices, current funds and free transfers in FPL. Point hits are not included.',
		lineupNote: hasFixtures ? null : 'Fixtures could not load. Only availability repairs are shown for a normal week; the suggested XI could not be checked.',
	};
	const playerTeams = new Map<number, number>(bootstrap.elements.map((player: Record<string, any>) => [Number(player.id), Number(player.team)]));
	const withFixtures = (player: Record<string, any>) => {
		if (!fixtureData || !gameweeks.length) return player;
		const fixtureRun = getPlannerFixtureRun(playerTeams.get(player.id)!, fixtureData.fixtures, bootstrap.teams, gameweeks);
		return { ...player, fixtureRun, fixtureSummary: summarizePlannerRun(fixtureRun) };
	};
	const options = baseOptions.map((option) => {
		const outgoing = withFixtures(option.outgoing);
		const incoming = withFixtures(option.incoming);
		const current = outgoing.fixtureSummary;
		const replacement = incoming.fixtureSummary;
		const range = gameweeks.length ? `GW ${gameweeks[0]}–${gameweeks.at(-1)}` : '';
		const fixtureReason = current?.averageDifficulty != null && replacement?.averageDifficulty != null
			? `${range}: average fixture difficulty ${current.averageDifficulty.toFixed(1)} → ${replacement.averageDifficulty.toFixed(1)} out of 5, lower is easier. ${current.matches} → ${replacement.matches} scheduled matches. ${current.blanks} → ${replacement.blanks} gameweeks without a fixture.`
			: 'Fixture comparison is unavailable. Check the schedule before transferring.';
		return { ...option, outgoing, incoming, fixtureReason };
	});
	if (!options.length) {
		return {
			currentGameweek,
			nextGameweek,
			suggestions: [],
			...context,
			message: attention.length ? "No suitable replacement was found. Check the flagged players above and keep your available cover." : "No suitable upgrade was found. Keep your available squad cover.",
		};
	}

	const state = {
		currentGameweek,
		targetGameweek,
		chip,
		chipGuidance: managerTransferGuidance[chip],
		squad: selection.picks.map((pick: Record<string, any>) => { const player = players.get(Number(pick.element))!; return { name: player.web_name, position: player.element_type, bench: Number(pick.position) > 11, status: player.status, news: player.news }; }),
		planningGameweeks: gameweeks,
		bank: roundToTenth(bank / 10),
		priceUnit: "Prices are in £m. Points per game, form, minutes, and the next-gameweek FPL estimate use the current official feed.",
		constraints: "Each option is a single same-position transfer. The server has checked budget, availability, a 90-minute minimum sample, and the three-player club limit. Availability repairs may have lower historical stats. Other candidates pass either a performance upgrade gate or a better-fixture gate with no worse form. Normal and Triple Captain plans exclude the suggested XI. Each option uses the original bank independently. Free transfers and point hits are unknown. Do not assume multiple options can be combined. Budget is a feasibility constraint, not a ranking goal.",
		options: options.map(({ questionId, outgoing, incoming, netCost, bankAfter, reason, kind }) => ({
			id: questionId, reason, kind,
			outgoing: modelPlayer(outgoing),
			incoming: modelPlayer(incoming),
			netCost,
			bankAfter,
		})),
	};
	const performanceOptions = options.filter((option) => option.kind === 'performance');
	const questions = Object.fromEntries(performanceOptions.map((option) => [option.questionId, {
		type: "score",
		instructions: `Compare the replacement with the current player for FPL Gameweek ${targetGameweek} and the supplied planning gameweeks. Assess the selected chip plan and the whole squad. A healthy player outside the suggested XI can still be useful cover; do not recommend selling solely because they are on the bench. Bench Boost counts all 15, Free Hit lasts one gameweek, and Wildcard changes are permanent. Triple Captain triples the captain only and does not make bench transfers urgent. Performance or fixture evidence must justify each optional move. Do not assume free transfers or claim a net gain after hits. Use the supplied opponent runs, home/away venues, fixture counts, blanks, and difficulty when present. Lower difficulty is easier, but does not by itself prove higher points. Prioritize performance, fixtures, minutes, and availability over cost. The price is already feasible; do not reward saving money by itself. Treat the FPL estimate as uncertain, do not infer injuries or lineups, and do not describe this score as projected points.`,
		criteria: scoreCriteria,
	}]));
	const requestBody = { model: "jev-latest", state, questions };
	const fingerprint = createHash("sha256")
		.update(JSON.stringify({ version: 2, requestBody, options, context }))
		.digest("hex");
	const cachedFingerprint = query.cachedFingerprint;
	if (typeof cachedFingerprint === "string" && cachedFingerprint === fingerprint) {
		return { unchanged: true, fingerprint };
	}
	const cached = recommendationCache.get(managerId);
	if (cached?.fingerprint === fingerprint) return cached.response;

	let result: Record<string, any> = { answers: {} };
	let rankingUnavailable = false;
	if (performanceOptions.length) {
		try {
			if (!apiKey) throw new Error('Ranking unavailable');
			let request = inFlightRequests.get(fingerprint);
			if (!request) {
				request = $fetch<Record<string, any>>("https://api.typesafe.ai/v1/systemone", {
					method: 'POST', headers: { Authorization: `Bearer ${apiKey}` }, timeout: 15_000, retry: 0, body: requestBody,
				});
				inFlightRequests.set(fingerprint, request);
			}
			result = await request;
			rankingUnavailable = performanceOptions.some((option) => {
				const answer = result?.answers?.[option.questionId];
				return answer?.type !== 'score' || answer.score === null || answer.score === undefined || answer.score === ''
					|| !Number.isFinite(Number(answer.score)) || Number(answer.score) < 0 || Number(answer.score) > 4;
			});
		} catch { rankingUnavailable = true; }
		finally { inFlightRequests.delete(fingerprint); }
	}

	const suggestions = rankManagerTransferSuggestions(options, result?.answers ?? {}).map(({ questionId, score, confidence, ...suggestion }) => suggestion);
	const response = {
		fingerprint: rankingUnavailable ? undefined : fingerprint,
		currentGameweek,
		nextGameweek,
		...context,
		rankingUnavailable,
		suggestions,
		message: suggestions.length ? null : rankingUnavailable ? "Performance comparisons could not load. Retry to check optional upgrades." : "No clear upgrade was found for the players outside your suggested XI or in your chip plan.",
	};
	if (!rankingUnavailable) recommendationCache.set(managerId, { fingerprint, response });
	return response;
});

function roundToTenth(value: number) {
	return Math.round(value * 10) / 10;
}
