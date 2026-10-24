import { getPositionName } from "../../composables/usePremiereLeague";

const playerFields = [
	"id", "code", "first_name", "second_name", "web_name", "birth_date", "team", "element_type",
	"now_cost", "total_points", "ep_next", "news", "form", "points_per_game", "selected_by_percent",
	"minutes", "goals_scored", "assists", "yellow_cards", "red_cards",
];

export function buildManagerSquad(rawPicks: Record<string, any>[], bootstrap: Record<string, any>) {
	const players = new Map<number, Record<string, any>>(bootstrap.elements.map((player: Record<string, any>) => [player.id, player]));
	const teams = new Map<number, Record<string, any>>(bootstrap.teams.map((team: Record<string, any>) => [team.id, team]));
	const expectedPointsGameweek = bootstrap.events.find((event: Record<string, any>) => event.is_next)?.id ?? null;
	const picks = rawPicks.map((pick) => {
		const player = players.get(Number(pick.element));
		if (!player) return null;
		const element = Object.fromEntries(playerFields.map((field) => [field, player[field]]));
		const team = teams.get(player.team);
		return {
			...pick,
			element,
			team: team ? { id: team.id, code: team.code, name: team.name } : null,
			element_type: getPositionName(player.element_type) ?? "Unknown",
			expectedPoints: player.ep_next,
			expectedPointsGameweek,
		};
	}).filter((pick) => pick !== null);
	const benchStart = Math.max(0, picks.length - 4);
	const startingXI = picks.slice(0, benchStart);
	const bench = picks.slice(benchStart);
	const groupedByType: Record<string, typeof picks> = {};
	for (const pick of startingXI) {
		(groupedByType[pick.element_type] ??= []).push(pick);
	}
	return {
		picks, startingXI, bench, groupedByType,
		teamCost: startingXI.reduce((total, pick) => total + Number(pick.element.now_cost ?? 0), 0),
		teamPoints: startingXI.reduce((total, pick) => total + Number(pick.element.total_points ?? 0), 0),
		events: bootstrap.events.map(({ id, finished, is_next }: Record<string, any>) => ({ id, finished, is_next })),
		teams: bootstrap.teams.map(({ id, code, name }: Record<string, any>) => ({ id, code, name })),
	};
}
