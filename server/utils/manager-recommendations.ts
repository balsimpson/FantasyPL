import { isManagerPlayerAvailable } from "../../utils/manager-availability";

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
		if (event === null && freeHitGameweeks.size > 0) {
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

	const options: ManagerTransferOption[] = [];
	for (const { pick, player: outgoing, sellingPrice } of roster) {
		if (!outgoing || sellingPrice === null) continue;
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
				if (!isPerformanceUpgrade(outgoing, candidate, nextGameweek)) return false;
				const countAfterSale = (teamCounts.get(candidateTeam) ?? 0) - (candidateTeam === Number(outgoing.team) ? 1 : 0);
				return countAfterSale < 3;
			})
			.sort((a, b) => compareAlternatives(a, b, nextGameweek))
			.slice(0, 2);

		for (const incoming of alternatives) {
			const incomingPrice = toNumber(incoming.now_cost);
			if (incomingPrice === null) continue;
			const questionId = `option_${options.length + 1}`;
			options.push({
				id: `swap_${Number(pick.element)}_${Number(incoming.id)}`,
				questionId,
				outgoing: summarizePlayer(outgoing, teams, sellingPrice, nextGameweek),
				incoming: summarizePlayer(incoming, teams, incomingPrice, nextGameweek),
				netCost: roundToTenth((incomingPrice - sellingPrice) / 10),
				bankAfter: roundToTenth((bank + sellingPrice - incomingPrice) / 10),
				currentGameweek,
				nextGameweek,
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
		if (answer?.type !== "score" || score === null || score < 0 || score > 4) return [];
		if (score < 2.5) return [];
		return [{
			...option,
			score: roundToTenth(score),
			confidence: confidence !== null && confidence >= 0 && confidence <= 1 ? Math.round(confidence * 100) : null,
		}];
	}).sort((a, b) => b.score - a.score || (b.confidence ?? -1) - (a.confidence ?? -1));

	const usedOutgoing = new Set<number>();
	const usedIncoming = new Set<number>();
	const suggestions = [];
	for (const suggestion of ranked) {
		const outgoingId = Number(suggestion.outgoing.id);
		const incomingId = Number(suggestion.incoming.id);
		if (usedOutgoing.has(outgoingId) || usedIncoming.has(incomingId)) continue;
		usedOutgoing.add(outgoingId);
		usedIncoming.add(incomingId);
		suggestions.push(suggestion);
	}
	return suggestions;
}
