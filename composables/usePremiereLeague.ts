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
		return player;
	} catch (error) {
		console.log("getPlayerInfo: Error - ", error);
		return null;
	}
};

// get team info
export const getTeamInfo = (id: number, data: any) => {
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
	console.log("getGameweekData", type);

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
	let weightForm = 2.5;
	let weightCleanSheetsPer90 = 0;
	let weightExpectedGoalsConcededPer90 = 0;
	let weightBps = 2;
	let weightThreat = 0;
	let weightInfluence = 1.5;
	let weightValue = 3.5;
	let weightTransfersIn = 1.5;
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
			weightTransfersIn = 3.0;
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
