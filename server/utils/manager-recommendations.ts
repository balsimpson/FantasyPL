import { isManagerPlayerAvailable } from "../../utils/manager-availability";
import { buildManagerWeekPlan, getPlannerFixtureRun, summarizePlannerRun } from "../../utils/manager-planner";
import type { ManagerTransferChip } from "../../shared/manager-transfer-plan";

type TransferContext = {
	chip?: ManagerTransferChip;
	targetGameweek?: number;
	gameweeks?: number[];
	fixtures?: PlayerRecord[];
};

type PlayerRecord = Record<string, any>;
type ManagerTransferOption = {
	id: string;
	questionId: string;
	outgoing: PlayerRecord;
	incoming: PlayerRecord;
	netCost: number;
	bankAfter: number;
	currentGameweek: number;
	nextGameweek: number | null;
	reason: string;
	priority: number;
	kind: "availability" | "performance";
};

const positionLabels: Record<number, string> = {
	1: "Goalkeeper",
	2: "Defender",
	3: "Midfielder",
	4: "Forward",
};

const toNumber = (value: unknown): number | null => {
	if (value === null || value === undefined || value === "") return null;
	const number = Number(value);
	return Number.isFinite(number) ? number : null;
};

const roundToTenth = (value: number) => Math.round(value * 10) / 10;

const playerName = (player: PlayerRecord) =>
	[player.first_name, player.second_name].filter(Boolean).join(" ") || String(player.web_name ?? "Unknown player");

function summarizePlayer(player: PlayerRecord, teams: Map<number, PlayerRecord>, price: number, nextGameweek: number | null) {
	const teamId = toNumber(player.team);
	const expectedPoints = nextGameweek === null ? null : toNumber(player.ep_next);
	return {
		id: Number(player.id),
		first_name: String(player.first_name ?? ""),
		second_name: String(player.second_name ?? ""),
		web_name: String(player.web_name ?? ""),
		code: toNumber(player.code),
		name: playerName(player),
		team: teams.get(teamId ?? -1)?.name ?? "Unknown club",
		position: positionLabels[Number(player.element_type)] ?? "Unknown",
		price: roundToTenth(price / 10),
		minutes: toNumber(player.minutes),
		totalPoints: toNumber(player.total_points),
		pointsPerGame: toNumber(player.points_per_game),
		form: toNumber(player.form),
		availability: String(player.status ?? "unknown"),
		chanceOfPlaying: toNumber(player.chance_of_playing_next_round),
		news: String(player.news ?? ""),
		expectedPoints: expectedPoints,
	};
}

function compareAlternatives(a: PlayerRecord, b: PlayerRecord, nextGameweek: number | null) {
	for (const field of ["points_per_game", "form", ...(nextGameweek === null ? [] : ["ep_next"]), "total_points"]) {
		const aValue = toNumber(a[field]);
		const bValue = toNumber(b[field]);
		if (aValue === bValue) continue;
		if (aValue === null) return 1;
		if (bValue === null) return -1;
		return bValue - aValue;
	}
	return Number(a.id) - Number(b.id);
}

function isPerformanceUpgrade(current: PlayerRecord, candidate: PlayerRecord, nextGameweek: number | null) {
	const comparisons = [
		[toNumber(current.form), toNumber(candidate.form)],
		[toNumber(current.points_per_game), toNumber(candidate.points_per_game)],
		...(nextGameweek === null ? [] : [[toNumber(current.ep_next), toNumber(candidate.ep_next)]]),
	].filter(([currentValue, candidateValue]) => currentValue !== null && candidateValue !== null) as [number, number][];
	return comparisons.length >= 2
		&& comparisons.every(([currentValue, candidateValue]) => candidateValue >= currentValue)
		&& comparisons.some(([currentValue, candidateValue]) => candidateValue > currentValue);
}

export function buildManagerSellingPrices(
	picks: PlayerRecord[],
	elements: PlayerRecord[],
	transfers: PlayerRecord[],
	freeHitGameweeks: Set<number>,
	managerId: number,
	unknownChipGameweeks = new Set<number>(),
) {
	const players = new Map<number, PlayerRecord>(elements.map((player) => [Number(player.id), player]));
	const ownedIds = new Set(picks.map((pick) => Number(pick.element)));
	const latestTransfers = new Map<number, { direction: "in" | "out"; purchasePrice: number | null; time: string }>();
	const unresolvedIds = new Set<number>();

	for (const transfer of transfers) {
		const entryId = toNumber(transfer.entry);
		if (entryId !== null && entryId !== managerId) continue;
		const event = toNumber(transfer.event);
		if (event !== null && freeHitGameweeks.has(event)) continue;
		if (event !== null && unknownChipGameweeks.has(event)) {
			for (const value of [transfer.element_in, transfer.element_out]) {
				if (ownedIds.has(Number(value))) unresolvedIds.add(Number(value));
			}
			continue;
		}
		if (event === null && (freeHitGameweeks.size > 0 || unknownChipGameweeks.size > 0)) {
			for (const value of [transfer.element_in, transfer.element_out]) {
				const playerId = toNumber(value);
				if (playerId !== null && ownedIds.has(playerId)) unresolvedIds.add(playerId);
			}
			continue;
		}
		const time = String(transfer.time ?? "");
		if (!Number.isFinite(Date.parse(time))) {
			for (const value of [transfer.element_in, transfer.element_out]) {
				const playerId = toNumber(value);
				if (playerId !== null && ownedIds.has(playerId)) unresolvedIds.add(playerId);
			}
			continue;
		}

		for (const transaction of [
			{ playerId: toNumber(transfer.element_in), direction: "in" as const, purchasePrice: toNumber(transfer.element_in_cost) },
			{ playerId: toNumber(transfer.element_out), direction: "out" as const, purchasePrice: null },
		]) {
			if (transaction.playerId === null || !ownedIds.has(transaction.playerId)) continue;
			const previous = latestTransfers.get(transaction.playerId);
			if (!previous || time >= previous.time) latestTransfers.set(transaction.playerId, { ...transaction, time });
		}
	}

	const sellingPrices = new Map<number, number>();
	for (const playerId of ownedIds) {
		const player = players.get(playerId);
		if (!player || unresolvedIds.has(playerId)) continue;

		const currentPrice = toNumber(player.now_cost);
		const latestTransfer = latestTransfers.get(playerId);
		let purchasePrice = latestTransfer?.purchasePrice ?? null;
		if (latestTransfer?.direction === "out") continue;
		if (!latestTransfer) {
			const costChangeSinceStart = toNumber(player.cost_change_start);
			if (currentPrice === null || costChangeSinceStart === null) continue;
			purchasePrice = currentPrice - costChangeSinceStart;
		}
		if (currentPrice === null || purchasePrice === null || !Number.isSafeInteger(currentPrice) || !Number.isSafeInteger(purchasePrice) || purchasePrice < 0) continue;

		// FPL passes through losses and returns half of profits, rounded down to £0.1m.
		const sellingPrice = currentPrice > purchasePrice
			? purchasePrice + Math.floor((currentPrice - purchasePrice) / 2)
			: currentPrice;
		if (Number.isSafeInteger(sellingPrice) && sellingPrice >= 0) sellingPrices.set(playerId, sellingPrice);
	}

	return sellingPrices;
}

export function buildManagerTransferOptions(
	picks: PlayerRecord[],
	elements: PlayerRecord[],
	teamRows: PlayerRecord[],
	sellingPrices: Map<number, number>,
	bank: number,
	currentGameweek: number,
	nextGameweek: number | null,
	context: TransferContext = {},
) {
	if (!picks.length || !Number.isFinite(bank) || bank < 0) return [];

	const players = new Map<number, PlayerRecord>(elements.map((player) => [Number(player.id), player]));
	const teams = new Map<number, PlayerRecord>(teamRows.map((team) => [Number(team.id), team]));
	const roster = picks.map((pick) => ({
		pick,
		player: players.get(Number(pick.element)),
		sellingPrice: sellingPrices.get(Number(pick.element)) ?? null,
	}));
	if (roster.some(({ player }) => !player || toNumber(player.team) === null || toNumber(player.element_type) === null)) return [];

	const ownedIds = new Set(roster.map(({ pick }) => Number(pick.element)));
	const teamCounts = new Map<number, number>();
	for (const { player } of roster) {
		const teamId = Number(player!.team);
		teamCounts.set(teamId, (teamCounts.get(teamId) ?? 0) + 1);
	}

	const targetGameweek = context.targetGameweek ?? nextGameweek;
	const chip = context.chip ?? 'none';
	const singleWeek = chip === 'freehit' || chip === 'bboost';
	const gameweeks = singleWeek && targetGameweek ? [targetGameweek] : context.gameweeks ?? [];
	const runFor = (player: PlayerRecord) => context.fixtures && gameweeks.length
		? getPlannerFixtureRun(Number(player.team), context.fixtures, teamRows, gameweeks) : null;
	const plannerPicks: PlayerRecord[] = roster.map(({ pick, player }) => ({ ...pick, element: player, element_type: positionLabels[Number(player!.element_type)] }));
	const plan = context.fixtures && targetGameweek
		? buildManagerWeekPlan({ picks: plannerPicks, startingXI: plannerPicks.filter((pick) => Number(pick.position) <= 11), teams: teamRows }, context.fixtures, targetGameweek) : null;
	const retainedIds = new Set<number>(plan?.canPreview ? plan.squad.startingXI.map((pick: PlayerRecord) => Number(pick.element.id)) : []);
	const keepSuggestedXI = chip === 'none' || chip === '3xc';
	const estimateGameweek = targetGameweek === nextGameweek ? nextGameweek : null;
	const evidenceScore = (player: PlayerRecord) => {
		const measures = [toNumber(player.form), toNumber(player.points_per_game)].filter((value): value is number => value !== null);
		const performance = measures.length ? measures.reduce((sum, value) => sum + value, 0) / measures.length : 0;
		const run = runFor(player);
		// Relative evidence only: balance recent form with PPG and the scheduled run.
		// An unknown difficulty contributes a neutral fixture weight.
		const fixtures = run ? run.flatMap((week) => week.matches).reduce((sum, match) => sum + 1 + (3 - (match.difficulty ?? 3)) * 0.15, 0) / run.length : 1;
		return performance * fixtures;
	};
	const options: ManagerTransferOption[] = [];
	for (const { pick, player: outgoing, sellingPrice } of roster) {
		if (!outgoing || sellingPrice === null) continue;
		const flagged = !isManagerPlayerAvailable(outgoing);
		// When the legal XI cannot be computed, only suggest availability repairs.
		if (keepSuggestedXI && (retainedIds.has(Number(outgoing.id)) || (!plan?.canPreview && !flagged))) continue;
		const outgoingRun = runFor(outgoing);
		const outgoingSummary = outgoingRun ? summarizePlannerRun(outgoingRun) : null;
		const bench = Number(pick.position) > 11;
		const priority = flagged ? (outgoing.status === 'd' ? 2 : 3) : 0;
		const role = bench ? 'Published bench' : 'Published XI';
		const reason = flagged
			? `${role}: ${String(outgoing.news || 'FPL availability is not confirmed')}. ${chip === 'bboost' ? 'Bench Boost needs all 15 players available.' : 'Review a fit replacement; check the latest team news before transferring.'}`
			: keepSuggestedXI ? `Outside the suggested GW ${targetGameweek} XI. Compare this upgrade with keeping your current bench cover.`
			: `${role}: compare this option for your ${chip === 'wildcard' ? 'Wildcard fixture run' : chip === 'freehit' ? 'one-week Free Hit' : 'Bench Boost'}.`;
		const budget = bank + sellingPrice;
		const alternatives = elements
			.filter((candidate) => {
				const candidateId = Number(candidate.id);
				const candidateTeam = toNumber(candidate.team);
				const cost = toNumber(candidate.now_cost);
				const minutes = toNumber(candidate.minutes);
				if (!Number.isSafeInteger(candidateId) || candidateId < 1 || ownedIds.has(candidateId)) return false;
				if (Number(candidate.element_type) !== Number(outgoing.element_type)) return false;
				if (!isManagerPlayerAvailable(candidate) || candidate.can_select === false || candidate.can_transact === false || minutes === null || minutes < 90) return false;
				if (candidateTeam === null || cost === null || cost > budget) return false;
				const candidateRun = runFor(candidate);
				if (candidateRun && !candidateRun[0]?.matches.length) return false;
				const hasPlayingEvidence = (toNumber(candidate.form) ?? 0) > 0 || (estimateGameweek !== null && (toNumber(candidate.ep_next) ?? 0) > 0);
				if (!hasPlayingEvidence) return false;
				// Injury repairs must not beat the injured player's historical points per game.
				if (!flagged && !isPerformanceUpgrade(outgoing, candidate, estimateGameweek)) {
					const summary = candidateRun ? summarizePlannerRun(candidateRun) : null;
					const betterFixtures = summary && outgoingSummary && (summary.matches > outgoingSummary.matches
						|| (summary.averageDifficulty !== null && outgoingSummary.averageDifficulty !== null && summary.averageDifficulty < outgoingSummary.averageDifficulty));
					if (!betterFixtures || (toNumber(candidate.form) ?? 0) < (toNumber(outgoing.form) ?? 0)) return false;
				}
				const countAfterSale = (teamCounts.get(candidateTeam) ?? 0) - (candidateTeam === Number(outgoing.team) ? 1 : 0);
				return countAfterSale < 3;
			})
			.sort((a, b) => {
				const aRun = runFor(a), bRun = runFor(b);
				const aSummary = aRun ? summarizePlannerRun(aRun) : null, bSummary = bRun ? summarizePlannerRun(bRun) : null;
				// FPL's one-week estimate already accounts for the schedule; do not multiply it by match count.
				if (singleWeek && estimateGameweek !== null) {
					const delta = (toNumber(b.ep_next) ?? -1) - (toNumber(a.ep_next) ?? -1);
					if (delta) return delta;
				}
				if (singleWeek && aSummary && bSummary && aSummary.matches !== bSummary.matches) return bSummary.matches - aSummary.matches;
				return evidenceScore(b) - evidenceScore(a) || compareAlternatives(a, b, estimateGameweek);
			})
			.slice(0, 2);

		for (const incoming of alternatives) {
			const incomingPrice = toNumber(incoming.now_cost);
			if (incomingPrice === null) continue;
			const questionId = `option_${options.length + 1}`;
			options.push({
				id: `swap_${Number(pick.element)}_${Number(incoming.id)}`,
				questionId,
				outgoing: { ...summarizePlayer(outgoing, teams, sellingPrice, estimateGameweek), squadRole: role },
				incoming: summarizePlayer(incoming, teams, incomingPrice, estimateGameweek),
				netCost: roundToTenth((incomingPrice - sellingPrice) / 10),
				bankAfter: roundToTenth((bank + sellingPrice - incomingPrice) / 10),
				currentGameweek,
				nextGameweek,
				reason, priority, kind: flagged ? "availability" : "performance",
			});
		}
	}

	return options;
}

export function rankManagerTransferSuggestions<T extends ManagerTransferOption>(options: T[], answers: Record<string, any>) {
	const ranked = options.flatMap((option) => {
		const answer = answers?.[option.questionId];
		const score = toNumber(answer?.score);
		const confidence = toNumber(answer?.confidence);
		const validScore = answer?.type === "score" && score !== null && score >= 0 && score <= 4;
		if (option.kind !== 'availability' && (!validScore || score! < 2.5)) return [];
		return [{
			...option,
			score: validScore ? roundToTenth(score!) : null,
			confidence: confidence !== null && confidence >= 0 && confidence <= 1 ? Math.round(confidence * 100) : null,
		}];
	}).sort((a, b) => b.priority - a.priority || (b.score ?? -1) - (a.score ?? -1) || (b.confidence ?? -1) - (a.confidence ?? -1));

	const usedOutgoing = new Set<number>();
	const suggestions = [];
	for (const suggestion of ranked) {
		const outgoingId = Number(suggestion.outgoing.id);
		if (usedOutgoing.has(outgoingId)) continue;
		usedOutgoing.add(outgoingId);
		suggestions.push(suggestion);
	}
	return suggestions;
}
