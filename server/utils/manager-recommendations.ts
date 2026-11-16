import { isManagerPlayerAvailable } from "../../utils/manager-availability";
import { buildManagerWeekPlan, getPlannerFixtureRun, summarizePlannerRun } from "../../utils/manager-planner";
import type { ManagerTransferChip } from "../../shared/manager-transfer-plan";
import { buildManagerSquad } from "./manager-squad";

type TransferContext = {
	chip?: ManagerTransferChip;
	targetGameweek?: number;
	gameweeks?: number[];
	fixtures?: PlayerRecord[];
	wholeSquad?: boolean;
};

type PlayerRecord = Record<string, any>;
type ManagerTransferOption = {
	id: string;
	questionId: string;
	outgoing: PlayerRecord;
	incoming: PlayerRecord;
	netCost: number | null;
	bankAfter: number | null;
	currentGameweek: number;
	nextGameweek: number | null;
	reason: string;
	priority: number;
	kind: "availability" | "performance";
	previewGain?: number;
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
	const wholeSquad = context.wholeSquad === true;
	const chip = context.chip ?? 'none';
	const singleWeek = chip === 'freehit' || chip === 'bboost';
	const gameweeks = singleWeek && targetGameweek ? [targetGameweek] : context.gameweeks ?? [];
	const runs = new Map<number, ReturnType<typeof getPlannerFixtureRun>>();
	const runFor = (player: PlayerRecord) => {
		if (!context.fixtures || !gameweeks.length) return null;
		const team = Number(player.team);
		if (!runs.has(team)) runs.set(team, getPlannerFixtureRun(team, context.fixtures, teamRows, gameweeks));
		return runs.get(team)!;
	};
	const plannerPicks: PlayerRecord[] = roster.map(({ pick, player }) => ({ ...pick, element: player, element_type: positionLabels[Number(player!.element_type)] }));
	const plan = !wholeSquad && context.fixtures && targetGameweek
		? buildManagerWeekPlan({ picks: plannerPicks, startingXI: plannerPicks.filter((pick) => Number(pick.position) <= 11), teams: teamRows }, context.fixtures, targetGameweek) : null;
	const retainedIds = new Set<number>(plan?.canPreview ? plan.squad.startingXI.map((pick: PlayerRecord) => Number(pick.element.id)) : []);
	const keepSuggestedXI = !wholeSquad && (chip === 'none' || chip === '3xc');
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
	const squadScore = (player: PlayerRecord, useEstimate: boolean) =>
		useEstimate ? toNumber(player.ep_next) : evidenceScore(player);
	const options: ManagerTransferOption[] = [];
	for (const { pick, player: outgoing, sellingPrice } of roster) {
		if (!outgoing || (!wholeSquad && sellingPrice === null)) continue;
		const flagged = !isManagerPlayerAvailable(outgoing);
		// When the legal XI cannot be computed, only suggest availability repairs.
		if (keepSuggestedXI && (retainedIds.has(Number(outgoing.id)) || (!plan?.canPreview && !flagged))) continue;
		const outgoingRun = runFor(outgoing);
		const outgoingSummary = outgoingRun ? summarizePlannerRun(outgoingRun) : null;
		const bench = Number(pick.position) > 11;
		const priority = flagged ? (outgoing.status === 'd' ? 2 : 3) : 0;
		const role = bench ? 'Published bench' : 'Published XI';
		const useEstimate = estimateGameweek !== null && toNumber(outgoing.ep_next) !== null;
		const reason = flagged ? String(outgoing.news || 'Availability not confirmed')
			: wholeSquad ? useEstimate ? `Higher GW ${targetGameweek} FPL estimate` : 'Stronger form and fixture score'
			: chip === 'freehit' ? `Improves your GW ${targetGameweek} XI`
			: chip === 'bboost' ? `Improves your GW ${targetGameweek} total, including the bench`
			: chip === 'wildcard' ? 'Stronger upcoming fixture run'
			: 'Upgrade outside your suggested XI';
		const budget = bank + (sellingPrice ?? 0);
		const alternatives = elements
			.filter((candidate) => {
				const candidateId = Number(candidate.id);
				const candidateTeam = toNumber(candidate.team);
				const cost = toNumber(candidate.now_cost);
				const minutes = toNumber(candidate.minutes);
				if (!Number.isSafeInteger(candidateId) || candidateId < 1 || ownedIds.has(candidateId)) return false;
				if (Number(candidate.element_type) !== Number(outgoing.element_type)) return false;
				if (!isManagerPlayerAvailable(candidate) || candidate.can_select === false || candidate.can_transact === false || minutes === null || minutes < 90) return false;
				if (candidateTeam === null || cost === null || (!wholeSquad && cost > budget)) return false;
				const candidateRun = runFor(candidate);
				if (candidateRun && !candidateRun[0]?.matches.length) return false;
				const hasPlayingEvidence = (toNumber(candidate.form) ?? 0) > 0 || (estimateGameweek !== null && (toNumber(candidate.ep_next) ?? 0) > 0);
				if (!hasPlayingEvidence) return false;
				if (wholeSquad) {
					if (candidateRun?.[0]?.matches.some(match => match.difficulty === null)) return false;
					const score = squadScore(candidate, useEstimate);
					if (!flagged && (score === null || score - squadScore(outgoing, useEstimate)! < 0.5)) return false;
				} else if (chip === 'freehit' && plan?.canPreview) {
					const nextPicks = plannerPicks.map((row) => row.element.id === outgoing.id ? { ...row, element: candidate } : row);
					const nextPlan = buildManagerWeekPlan({ picks: nextPicks, startingXI: nextPicks.filter((row) => Number(row.position) <= 11), teams: teamRows }, context.fixtures!, targetGameweek!);
					if (!nextPlan.canPreview || !nextPlan.squad.startingXI.some((row: PlayerRecord) => row.element.id === candidate.id)
						|| nextPlan.selectionScore! <= plan.selectionScore! + 1e-9) return false;
				} else if (singleWeek && !flagged) {
					const currentValue = outgoingRun?.[0]?.matches.length === 0 ? 0 : estimateGameweek !== null
						? toNumber(outgoing.ep_next) ?? evidenceScore(outgoing) : evidenceScore(outgoing);
					const incomingValue = estimateGameweek !== null ? toNumber(candidate.ep_next) ?? evidenceScore(candidate) : evidenceScore(candidate);
					if (incomingValue <= currentValue) return false;
				} else if (!flagged && !isPerformanceUpgrade(outgoing, candidate, estimateGameweek)) {
					const summary = candidateRun ? summarizePlannerRun(candidateRun) : null;
					const betterFixtures = summary && outgoingSummary && (summary.matches > outgoingSummary.matches
						|| (summary.averageDifficulty !== null && outgoingSummary.averageDifficulty !== null && summary.averageDifficulty < outgoingSummary.averageDifficulty));
					if (!betterFixtures || (toNumber(candidate.form) ?? 0) < (toNumber(outgoing.form) ?? 0)) return false;
				}
				const countAfterSale = (teamCounts.get(candidateTeam) ?? 0) - (candidateTeam === Number(outgoing.team) ? 1 : 0);
				return countAfterSale < 3;
			})
			.sort((a, b) => {
				if (wholeSquad) return (squadScore(b, useEstimate) ?? -1) - (squadScore(a, useEstimate) ?? -1)
					|| evidenceScore(b) - evidenceScore(a) || Number(a.id) - Number(b.id);
				const aRun = runFor(a), bRun = runFor(b);
				const aSummary = aRun ? summarizePlannerRun(aRun) : null, bSummary = bRun ? summarizePlannerRun(bRun) : null;
				// FPL's one-week estimate already accounts for the schedule; do not multiply it by match count.
				if (singleWeek && estimateGameweek !== null) {
					const delta = (toNumber(b.ep_next) ?? -1) - (toNumber(a.ep_next) ?? -1);
					if (delta) return delta;
				}
				if (singleWeek && aSummary && bSummary && aSummary.matches !== bSummary.matches) return bSummary.matches - aSummary.matches;
				return evidenceScore(b) - evidenceScore(a) || compareAlternatives(a, b, estimateGameweek);
			});

		for (const incoming of wholeSquad ? alternatives : alternatives.slice(0, 2)) {
			const incomingPrice = toNumber(incoming.now_cost);
			if (incomingPrice === null) continue;
			const questionId = `option_${options.length + 1}`;
			options.push({
				id: `swap_${Number(pick.element)}_${Number(incoming.id)}`,
				questionId,
				outgoing: { ...summarizePlayer(outgoing, teams, sellingPrice ?? Number(outgoing.now_cost), estimateGameweek), squadRole: role },
				incoming: summarizePlayer(incoming, teams, incomingPrice, estimateGameweek),
				netCost: sellingPrice === null ? null : roundToTenth((incomingPrice - sellingPrice) / 10),
				bankAfter: sellingPrice === null ? null : roundToTenth((bank + sellingPrice - incomingPrice) / 10),
				currentGameweek,
				nextGameweek,
				reason, priority: chip === 'freehit' ? 0 : priority, kind: flagged && chip !== 'freehit' ? "availability" : "performance",
				...(wholeSquad ? { previewGain: (squadScore(incoming, useEstimate) ?? 0) - (squadScore(outgoing, useEstimate) ?? 0) } : {}),
			});
		}
	}

	return options;
}

export function buildManagerSquadTransferPlans(
	picks: PlayerRecord[],
	bootstrap: { elements: PlayerRecord[]; teams: PlayerRecord[]; events: PlayerRecord[] },
	fixtures: PlayerRecord[],
	gameweeks: number[],
	currentGameweek: number,
) {
	if (picks.length !== 15 || new Set(picks.map(pick => Number(pick.element))).size !== 15) return [];
	const players = new Map(bootstrap.elements.map(player => [Number(player.id), player]));
	const nextGameweek = Number(bootstrap.events.find(event => event.is_next)?.id) || null;
	return gameweeks.map(targetGameweek => {
		const options = buildManagerTransferOptions(picks, bootstrap.elements, bootstrap.teams, new Map(), 0, currentGameweek,
			nextGameweek, { wholeSquad: true, targetGameweek, gameweeks: [targetGameweek], fixtures });
		options.sort((a, b) => b.priority - a.priority || (b.previewGain ?? 0) - (a.previewGain ?? 0));
		const preview = buildManagerTransferPreview(picks, players, options, { scanAllCandidates: true });
		const incomingIds = new Set(preview.transfers.map(move => move.incomingId));
		const hasAlternative = new Set<number>();
		const suggestions = options.filter(({ outgoing, incoming }) => {
			if (incomingIds.has(incoming.id) || hasAlternative.has(outgoing.id)) return false;
			hasAlternative.add(outgoing.id);
			return true;
		});
		const replacements = preview.picks.filter(pick => incomingIds.has(Number(pick.element)));
		return {
			targetGameweek,
			nextGameweek,
			suggestions,
			transferPreview: replacements.length ? {
				replacements: buildManagerSquad(replacements, bootstrap).picks, transfers: preview.transfers,
			} : null,
		};
	});
}

export function rankManagerTransferSuggestions<T extends ManagerTransferOption>(
	options: T[], answers: Record<string, any>, { includeAlternatives = false } = {},
) {
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

	if (includeAlternatives) return ranked;
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

export function buildManagerTransferPreview(
	picks: PlayerRecord[],
	players: Map<number, PlayerRecord>,
	suggestions: Pick<ManagerTransferOption, "outgoing" | "incoming">[],
	{ scanAllCandidates = false } = {},
) {
	const owned = new Set(picks.map((pick) => Number(pick.element)));
	const clubCounts = new Map<number, number>();
	for (const id of owned) {
		const club = Number(players.get(id)?.team);
		clubCounts.set(club, (clubCounts.get(club) ?? 0) + 1);
	}

	const byOutgoing = new Map<number, {
		outgoing: PlayerRecord; incoming: PlayerRecord; fromClub: number; toClub: number; gain: number;
	}[]>();
	const claimed = new Set<number>();
	const signed = new Set<number>();
	const adjustClub = (club: number, delta: number) => clubCounts.set(club, (clubCounts.get(club) ?? 0) + delta);
	for (const { outgoing, incoming } of suggestions) {
		if (!owned.has(outgoing.id) || owned.has(incoming.id)) continue;
		const from = players.get(outgoing.id);
		const to = players.get(incoming.id);
		if (!from || !to) continue;
		const before = outgoing.expectedPoints ?? outgoing.form ?? 0;
		const after = incoming.expectedPoints ?? incoming.form ?? 0;
		const fromClub = Number(from.team);
		const toClub = Number(to.team);
		if (scanAllCandidates) {
			if (claimed.has(outgoing.id) || signed.has(incoming.id) || (toClub !== fromClub && (clubCounts.get(toClub) ?? 0) >= 3)) continue;
			claimed.add(outgoing.id);
			signed.add(incoming.id);
			adjustClub(fromClub, -1);
			adjustClub(toClub, 1);
		}
		const alternatives = byOutgoing.get(outgoing.id) ?? [];
		alternatives.push({ outgoing, incoming, fromClub, toClub, gain: after - before });
		byOutgoing.set(outgoing.id, alternatives);
	}

	const groups = [...byOutgoing.values()];
	const selected: (typeof groups)[number] = [];
	let best = selected.slice();
	let lowestLoss = Infinity;

	// Consider both shortlisted candidates so one crowded club does not block another upgrade.
	function select(index: number, loss: number) {
		const maxMoves = selected.length + groups.length - index;
		if (maxMoves < best.length || (maxMoves === best.length && loss >= lowestLoss)) return;
		if (index === groups.length) {
			if ([...clubCounts.values()].some(count => count > 3)) return;
			best = selected.slice();
			lowestLoss = loss;
			return;
		}

		const alternatives = groups[index]!;
		const preferred = alternatives[0]!;
		for (const [rank, move] of alternatives.entries()) {
			if (signed.has(move.incoming.id)) continue;
			signed.add(move.incoming.id);
			selected.push(move);
			adjustClub(move.fromClub, -1);
			adjustClub(move.toClub, 1);
			const alternateLoss = rank ? Math.max(0, preferred.gain - move.gain) + rank * 0.01 : 0;
			select(index + 1, loss + alternateLoss);
			adjustClub(move.toClub, -1);
			adjustClub(move.fromClub, 1);
			selected.pop();
			signed.delete(move.incoming.id);
		}
		select(index + 1, loss + Math.max(0, preferred.gain) + 1);
	}
	if (scanAllCandidates) {
		if ([...clubCounts.values()].every(count => count <= 3)) best = groups.flat();
	} else select(0, 0);

	const replacements = new Map(best.map(({ outgoing, incoming }) => [outgoing.id, incoming.id]));
	return {
		picks: picks.map((pick) => ({ ...pick, element: replacements.get(Number(pick.element)) ?? pick.element })),
		transfers: best.map(({ outgoing, incoming }) => ({
			outgoingId: outgoing.id, incomingId: incoming.id, outgoing: outgoing.web_name, incoming: incoming.name,
		})),
	};
}
