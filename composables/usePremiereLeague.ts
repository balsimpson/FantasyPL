export const getBootstrapStatic = async () => {
	try {
		const url = "https://fantasy.premierleague.com/api/bootstrap-static/";
		const response = await fetch(url);
		const data = await response.json();
		return data;
	} catch (error) {
		console.log(error);
		return null;
	}
};

/**
 * Get Player Info from Bootstrap data
 * @param id Player ID
 * @param data Bootstrap data
 * @returns {Object|null} Returns the player object or null if not found.
 */
export const getPlayerInfo = (id: number, data: any) => {
	try {
		const player = data.elements.find((player: any) => {
			return player.id == id;
		});
		// console.log("getPlayerInfo", player);
		return player;
	} catch (error) {
		console.log("getPlayerInfo: Error - ", error);
		return null;
	}
};

// get team info
export const getTeamInfo = (id: number, data: any) => {
	// console.log(data)
	if (!id || !data) return;
	// console.log("getTeamInfo", id, data.teams, data.teams.find((team: any) => team.id == id));
	try {
		const team = data.teams.find((team: any) => team.id == id);
		return team;
	} catch (error) {
		console.log("getTeamInfo: Error - ", error);
		return null;
	}
};

/**
 * Retrieves gameweek data based on the specified type.
 * @param {String|Number} type - Can be 'current', 'next', 'previous', or a specific gameweek ID (number).
 * @param {Object} data - The bootstrap-static JSON data from FPL API.
 * @returns {Object|null} Returns the gameweek object or null if not found.
 */
export const getGameweekData = (type: string | number, data: any) => {
	// console.log("getGameweekData", type);

	if (!data || !data.events) {
		console.error("Invalid data provided.");
		return null;
	}

	const { events } = data;

	let gw;

	switch (type) {
		case "current":
			gw =
				events.find((event: { is_current: any }) => event.is_current) || null;
			// gw.info = consolidateGameweekData(gw, data);
			return gw;
		case "next":
			return events.find((event: { is_next: any }) => event.is_next) || null;
		case "previous":
			// Find the latest finished gameweek
			const finishedEvents = events.filter(
				(event: { finished: any }) => event.finished
			);
			return finishedEvents[finishedEvents.length - 1] || null;
	}
};

// consolidate gameweek data with player and team details
export const gameweekPlayerDetails = (gameweekData: any, data: any) => {
	try {
		// get info for "most_selected" "most_transferred_in" "top_element" "top_element_info": { "id": 351, "points": 17}, "transfers_made" "most_captained" "most_vice_captained" from data
		const {
			top_element,
			// top_element_info,
			most_selected,
			most_transferred_in,
			// transfers_made,
			most_captained,
			most_vice_captained,
		} = gameweekData;

		const mostSelected: string = getPlayerInfo(most_selected, data);
		const mostTransferredIn = getPlayerInfo(most_transferred_in, data);
		const topElement = getPlayerInfo(top_element, data);
		// const topElementInfo = getPlayerInfo(top_element_info.id, data);
		// const transfersMade = getPlayerInfo(transfers_made, data);
		const mostCaptained = getPlayerInfo(most_captained, data);
		const mostViceCaptained = getPlayerInfo(most_vice_captained, data);

		return {
			mostSelected,
			mostTransferredIn,
			topElement,
			// topElementInfo,
			// transfersMade,
			mostCaptained,
			mostViceCaptained,
		};
	} catch (error) {
		console.error("Error consolidating gameweek data:", error);
		return null;
	}
};

// get top players
// @ts-ignore
export function calculatePlayerScore(player) {
	let weightTotalPoints = 5;
	let weightPointsPerGame = 5.5;
	let weightForm = 9.5;
	let weightCleanSheetsPer90 = 0;
	let weightExpectedGoalsConcededPer90 = 0;
	let weightBps = 2;
	let weightThreat = 0;
	let weightInfluence = 1.5;
	let weightValue = 3.5;
	let weightTransfersIn = 5.5;
	let weightTransfersOut = -4.5;
	let weightGoals = 0;
	let weightAssists = 0;
	let weightSavesPer90 = 0;
	let weightExpectedGoalsPer90 = 0;
	let weightExpectedAssistsPer90 = 0;

	// Adjust weights based on the player's position
	switch (player.element_type) {
		case 1: // Goalkeeper
			weightCleanSheetsPer90 = 3;
			weightExpectedGoalsConcededPer90 = 2.5;
			weightSavesPer90 = 3;
			break;
		case 2: // Defender
			weightCleanSheetsPer90 = 2.5;
			weightExpectedGoalsConcededPer90 = 2;
			weightThreat = 2;

			break;
		case 3: // Midfielder
			weightGoals = 3;
			weightAssists = 3;
			weightThreat = 2.5;
			weightExpectedGoalsPer90 = 2;
			weightExpectedAssistsPer90 = 2;
			break;
		case 4: // Forward
			weightGoals = 4;
			weightAssists = 2.5;
			weightThreat = 3;
			weightExpectedGoalsPer90 = 3;
			break;
	}

	return (
		player.total_points * weightTotalPoints +
		parseFloat(player.points_per_game) * weightPointsPerGame +
		parseFloat(player.form) * weightForm +
		parseFloat(player.clean_sheets_per_90) * weightCleanSheetsPer90 -
		parseFloat(player.expected_goals_conceded_per_90) *
		weightExpectedGoalsConcededPer90 +
		player.bps * weightBps +
		parseFloat(player.threat) * weightThreat +
		parseFloat(player.influence) * weightInfluence +
		parseFloat(player.value_form) * weightValue +
		player.transfers_in_event * weightTransfersIn +
		player.transfers_out_event * weightTransfersOut +
		player.goals_scored * weightGoals +
		player.assists * weightAssists +
		parseFloat(player.saves_per_90) * weightSavesPer90 +
		parseFloat(player.expected_goals_per_90) * weightExpectedGoalsPer90 +
		parseFloat(player.expected_assists_per_90) * weightExpectedAssistsPer90
	);
}

/**
 * computeScores(players, opts)
 * - players: array of player objects (the full batch)
 * - opts: configuration (thresholds, weights override, etc.)
 *
 * Returns: players mapped with { score, explain }
 */
export function computeScores(players: any[] = [], opts = {}) {
	const cfg = {
		minMinutesForTrust: 90,     // below this -> strong penalty
		minutesFloorForFullWeight: 270, // >= this -> full minutes multiplier
		transfersCapPercentile: 0.95,
		lambdaValue: 0.12,          // value (ppg / cost) weight multiplier
		weights: null,              // can pass custom weights per position
		...opts,
	};

	// Helpers
	const num = v => {
		const n = parseFloat(v);
		return Number.isFinite(n) ? n : 0;
	};
	const per90 = (stat, mins) => (mins > 0 ? stat * (90 / mins) : 0);
	const log1p = v => Math.log1p(Math.max(0, v));
	const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

	// Default weights by position (sensible defaults)
	const defaultWeights = {
		GK: { total_points: 0.2, points_per_game: 0.15, form: 0.15, clean_sheets_per_90: 0.18, saves_per_90: 0.18, expected_goals_conceded_per_90: -0.12, bps: 0.02, influence: 0.02, value: 0.1, transfers: 0.0 },
		DEF: { total_points: 0.18, points_per_game: 0.12, form: 0.14, clean_sheets_per_90: 0.20, tackles: 0.12, clearances_blocks_interceptions: 0.10, threat: 0.06, bps: 0.02, value: 0.06, transfers: 0.04 },
		MID: { total_points: 0.16, points_per_game: 0.12, form: 0.14, goals_per90: 0.15, assists_per90: 0.12, expected_goal_involvements: 0.08, creativity: 0.06, threat: 0.04, value: 0.06, transfers: 0.07 },
		FWD: { total_points: 0.16, points_per_game: 0.12, form: 0.13, goals_per90: 0.30, assists_per90: 0.10, expected_goals_per_90: 0.10, threat: 0.05, value: 0.04, transfers: 0.06 },
	};

	const weightsByPos = cfg.weights || defaultWeights;

	// 1) Precompute derived stats we will normalize: per90 metrics & log transfers
	const derived = players.map(p => {
		const mins = Math.max(0, num(p.minutes));
		return {
			id: p.id,
			derived: {
				goals_per90: per90(num(p.goals_scored), mins),
				assists_per90: per90(num(p.assists), mins),
				saves_per90: per90(num(p.saves), mins),
				expected_goals_per_90: num(p.expected_goals_per_90) || per90(num(p.expected_goals), mins),
				expected_assists_per_90: num(p.expected_assists_per_90) || per90(num(p.expected_assists), mins),
				expected_goal_involvements: num(p.expected_goal_involvements) || per90(num(p.expected_goal_involvements), mins),
				clean_sheets_per_90: num(p.clean_sheets_per_90) || per90(num(p.clean_sheets), mins),
				saves_per_90: per90(num(p.saves), mins),
				transfers_in_event_log: log1p(num(p.transfers_in_event)),
				transfers_out_event_log: log1p(num(p.transfers_out_event)),
				value_raw: (num(p.points_per_game) || 0) / Math.max(1, num(p.now_cost)), // small protect
			},
			raw: p,
		};
	});

	// 2) Build min/max ranges for normalization (per derived field + some raw fields)
	const metricsToNorm = [
		'total_points', 'points_per_game', 'form', 'bps', 'influence', 'threat',
		'goals_per90', 'assists_per90', 'saves_per90',
		'expected_goals_per_90', 'expected_assists_per_90', 'expected_goal_involvements',
		'clean_sheets_per_90', 'saves_per_90',
		'transfers_in_event_log', 'transfers_out_event_log', 'value_raw'
	];

	const ranges = {};
	for (const m of metricsToNorm) {
		const values = derived.map(d => {
			if (m in d.derived) return d.derived[m];
			return num(d.raw[m]);
		});
		const min = Math.min(...values);
		const max = Math.max(...values);
		ranges[m] = { min, max: max === min ? min + 1 : max, span: Math.max(1e-6, max - min) };
	}

	const normalize = (m, v) => {
		if (v == null) return 0;
		const r = ranges[m] || { min: 0, span: 1 };
		return clamp((v - r.min) / r.span, 0, 1);
	};

	// 3) Optionally compute transfer cap via percentile (simple approach: cap to observed max or cfg)
	const maxTransfersInLog = Math.max(...derived.map(d => d.derived.transfers_in_event_log || 0));
	const maxTransfersOutLog = Math.max(...derived.map(d => d.derived.transfers_out_event_log || 0));

	// 4) Score each player
	const scored = derived.map(d => {
		const p = d.raw;
		const mins = Math.max(0, num(p.minutes));
		const pos = { 1: 'GK', 2: 'DEF', 3: 'MID', 4: 'FWD' }[p.element_type] || 'MID';
		const W = weightsByPos[pos] || weightsByPos.MID;

		// availability + minutes factor
		const availability = clamp((num(p.chance_of_playing_next_round) || num(p.chance_of_playing_this_round) || 100) / 100, 0, 1);
		const minutesFactor = clamp(mins / cfg.minutesFloorForFullWeight, 0, 1); // 0..1
		const lowMinutesPenalty = mins < cfg.minMinutesForTrust ? 0.4 : 1; // heavy penalty for almost no minutes

		// normalized inputs
		const vals = {
			total_points: normalize('total_points', num(p.total_points)),
			points_per_game: normalize('points_per_game', num(p.points_per_game)),
			form: normalize('form', num(p.form)),
			bps: normalize('bps', num(p.bps)),
			influence: normalize('influence', num(p.influence)),
			threat: normalize('threat', num(p.threat)),
			goals_per90: normalize('goals_per90', d.derived.goals_per90),
			assists_per90: normalize('assists_per90', d.derived.assists_per90),
			saves_per90: normalize('saves_per90', d.derived.saves_per90),
			expected_goals_per_90: normalize('expected_goals_per_90', d.derived.expected_goals_per_90),
			expected_assists_per_90: normalize('expected_assists_per_90', d.derived.expected_assists_per_90),
			expected_goal_involvements: normalize('expected_goal_involvements', d.derived.expected_goal_involvements),
			clean_sheets_per_90: normalize('clean_sheets_per_90', d.derived.clean_sheets_per_90),
			transfers_in_event_log: normalize('transfers_in_event_log', d.derived.transfers_in_event_log),
			transfers_out_event_log: normalize('transfers_out_event_log', d.derived.transfers_out_event_log),
			value_raw: normalize('value_raw', d.derived.value_raw),
		};

		// compute weighted sum by W
		let score = 0;
		for (const k of Object.keys(W)) {
			const w = W[k] || 0;
			const v = vals[k] ?? 0;
			score += w * v;
		}

		// incorporate transfers (in positive, out negative), scaled and capped
		const transfersScore = (vals.transfers_in_event_log || 0) - (vals.transfers_out_event_log || 0);
		score += (W.transfers || 0) * transfersScore;

		// value boost (small)
		score += cfg.lambdaValue * vals.value_raw * (weightsByPos[pos]?.value || 0);

		// apply availability & minutes multipliers and low-minutes penalty
		score = score * availability * minutesFactor * lowMinutesPenalty;

		// Attach explanation bits (top contributors)
		const explain = {};
		const contributors = Object.entries(W).map(([k, w]) => ({ k, w, v: vals[k] || 0, contrib: (vals[k] || 0) * (w || 0) }));
		contributors.sort((a, b) => Math.abs(b.contrib) - Math.abs(a.contrib));
		explain.top = contributors.slice(0, 4).map(c => ({ stat: c.k, weight: c.w, norm: +c.v.toFixed(3), contrib: +c.contrib.toFixed(3) }));

		return {
			...p,
			score,
			explain,
			_meta: { availability, minutesFactor, mins },
		};
	});

	// final sort and return
	scored.sort((a, b) => b.score - a.score);
	return scored;
}

export function getTopPlayers(
	players: any[],
	position = null,
	topN = 5,
	budget = Infinity
) {
	let filteredPlayers = [];
	// if (budget) {
	// 	// Filter players by position and budget
	// 	filteredPlayers = players.filter((p) => {
	// 		// console.log("p", p.now_cost);
	// 		console.log("budget", p.now_cost <= budget * 10);
	// 		return (position ? p.element_type === position : true) &&
	// 			p.now_cost <= budget * 10; // Convert budget from millions to FPL's cost unit (usually in tenths of millions)
	// 	});
	// 	// filteredPlayers = players.filter(
	// 	// 	(p) =>
	// 	// 		(position ? p.element_type === position : true) &&
	// 	// 		p.now_cost <= budget * 10 // Convert budget from millions to FPL's cost unit (usually in tenths of millions)
	// 	// );
	// 	console.log("filteredPlayers", budget, filteredPlayers);
	// } else {

	// 	console.log("else", budget, filteredPlayers.slice(0, topN));
	// }
	filteredPlayers = position
		? // @ts-ignore
		players.filter((p) => p.element_type === position)
		: players;
	// console.log("filteredPlayers", filteredPlayers.length, position);
	// console.log("filteredPlayers", filteredPlayers.slice(0, topN));
	// Calculate scores
	const scoredPlayers = filteredPlayers.map((player) => ({
		...player,
		score: calculatePlayerScore(player),
	}));

	// Sort by score in descending order and take the top N
	return scoredPlayers.sort((a, b) => b.score - a.score).slice(0, topN);
}

export const getPositionName = (position: any) => {
	const elementTypeMap = {
		1: "Goalkeeper",
		2: "Defender",
		3: "Midfielder",
		4: "Forward",
	};

	// @ts-ignore
	return elementTypeMap[position];
};

export function getMostSelectedPlayers(players: any[], topN = 5) {
	return [...players]
		.sort((a, b) => (b.selected_by_percent || 0) - (a.selected_by_percent || 0))
		.slice(0, topN);
}

export function getMostTransferredInPlayers(players: any[], topN = 5) {
	return [...players]
		.sort((a, b) => (b.transfers_in_event || 0) - (a.transfers_in_event || 0))
		.slice(0, topN);
}

export function getMostTransferredOutPlayers(players: any[], topN = 5) {
	return [...players]
		.sort((a, b) => (b.transfers_out_event || 0) - (a.transfers_out_event || 0))
		.slice(0, topN);
}

export async function getPlayerInfoDetails(id: number) {
	try {
		const BASE_URL = "https://fantasy.premierleague.com/api/element-summary";
		const url = `${BASE_URL}/${id}/`;
		const response = await $fetch(url);
		// console.log("getPlayerInfoDetails", response);
		return response;
	} catch (error) {
		console.error("Error getPlayerInfoDetails:", error);
		return null;
	}
}

export async function getUpcomingFixtures(count: number = 12) {
	try {
		const url = "https://fantasy.premierleague.com/api/fixtures";
		const fixtures: any[] = await $fetch(url);

		const upcomingFixtures = fixtures.filter((fixture) => !fixture.finished);
		return count ? upcomingFixtures.slice(0, count) : upcomingFixtures;
	} catch (error) {
		console.error("Error getPlayerInfoDetails:", error);
		return null;
	}
}

export async function getManagerDetails(id: number) {
	try {
		const url = `https://fantasy.premierleague.com/api/entry/${id}/`;
		const response = await $fetch(url);
		return response;
	} catch (error) {
		console.error("Error getManagerDetails:", error);
		return error;
	}
}

export async function getManagerPicks(id: number, gw: number) {
	try {
		const url = `https://fantasy.premierleague.com/api/entry/${id}/event/${gw}/picks/`;
		const response = await $fetch(url);
		return response;
	} catch (error) {
		console.error("Error getManagerPicks:", error);
		return null;
	}
}

export async function getPlayerPredictions() {
	try {
		const url = `https://www.fantasyfootballhub.co.uk/player-data/player-data.json`;
		const response = await $fetch(url);
		return response;
	} catch (error) {
		console.error("Error getPlayerPredictions:", error);
		return null;
	}
}

export async function getTeamOfTheWeek(gw: string) {
	try {
		const url = `https://fantasy.premierleague.com/api/dream-team/${gw}/`;
		const response = await $fetch(url);
		return response;
	} catch (error) {
		console.error("Error getTeamOfTheWeek:", error);
		return null;
	}
}

// export const getPlayerByCode = (players: [], code: number) => {
// 	// @ts-ignore
// 	return players.find((player) => player.code === code);
// };

export const getPredictionsOfPlayer = (players: [], code: number) => {
	let weeks = 5
	// @ts-ignore
	let player = players.find((p) => p.code === code);
	if (!player) return [];
	// Slice the predictions array to get the next 'weeks' number of predictions
	// @ts-ignore
	const predictions = player.data.predictions.slice(0, weeks);

	// Extract the predicted points for each week
	return predictions.map((pred: any) => ({
		gw: pred.gw,
		opponent: pred.opp[0][1],
		predicted_pts: pred.predicted_pts,
	}));
};

export const formatDate = (dateString: string) => {
	const options = {
		// year: "numeric",
		month: "short",
		day: "numeric",
		weekday: "short",
		hour: "numeric",
		minute: "numeric",
	};
	// @ts-ignore
	return new Date(dateString).toLocaleDateString(undefined, options);
};

// export const consolidateGameweekData = (gameweekData: any, data: any) => {
// 	try {
// 		const { elements } = data;
// 		// console.log("elements", data);

// 		const gameweek = gameweekData.id;
// 		const deadlineTime = gameweekData.deadline_time;
// 		const deadlineTimeFormatted = new Date(deadlineTime).toLocaleString();
// 		const deadlineTimeRemaining =
// 			new Date(deadlineTime).getTime() - new Date().getTime();

// 		const {
// 			mostSelected,
// 			mostTransferredIn,
// 			topElement,
// 			// topElementInfo,
// 			transfersMade,
// 			mostCaptained,
// 			mostViceCaptained,
// 		} = gameweekPlayerDetails(gameweekData, data);

// 		// console.log("mostSelected", mostSelected.web_name);

// 		// const mostSelectedTeam = teams.find(
// 		// 	(team: any) => team.id === mostSelected.team
// 		// );

// 		// const mostTransferredInTeam = teams.find(
// 		// 	(team: any) => team.id === mostTransferredIn.team
// 		// );

// 		// const topElementTeam = teams.find((team: any) => team.id === topElement.team);

// 		// const topElementInfoTeam = teams.find(
// 		// 	(team: any) => team.id === topElementInfo.team
// 		// );

// 		// const transfersMadeTeam = teams.find(
// 		// 	(team: any) => team.id === transfersMade.team
// 		// );

// 		// const mostCaptainedTeam = teams.find(
// 		// 	(team: any) => team.id === mostCaptained.team
// 		// );

// 		// const mostViceCaptainedTeam = teams.find(
// 		// 	(team: any) => team.id === mostViceCaptained.team
// 		// );

// 		const mostSelectedPlayer = elements.find(
// 			(player: any) => player.id === mostSelected.id
// 		);
// 		// console.log("mostSelectedPlayer", mostSelectedPlayer);

// 		const mostTransferredInPlayer = elements.find(
// 			(player: any) => player.id === mostTransferredIn.id
// 		);
// 		// console.log("mostTransferredInPlayer", mostTransferredInPlayer);

// 		const topElementPlayer = elements.find(
// 			(player: any) => player.id === topElement.id
// 		);

// 		// const transfersMadePlayer = elements.find(
// 		// 	(player: any) => player.id === transfersMade.element
// 		// );

// 		const mostCaptainedPlayer = elements.find(
// 			(player: any) => player.id === mostCaptained.id
// 		);

// 		const mostViceCaptainedPlayer = elements.find(
// 			(player: any) => player.id === mostViceCaptained.id
// 		);

// 		gameweekData["most_selected"] = mostSelectedPlayer.web_name || "";
// 		gameweekData.most_transferred_in = mostTransferredInPlayer.web_name || "";
// 		gameweekData.top_element = topElementPlayer.web_name || "";
// 		gameweekData.most_captained = mostCaptainedPlayer.web_name || "";
// 		gameweekData.most_vice_captained = mostViceCaptainedPlayer.web_name || "";

// 		return;
// 	} catch (error) {
// 		console.error("Error consolidating gameweek data:", error);
// 		return null;
// 	}
// };
