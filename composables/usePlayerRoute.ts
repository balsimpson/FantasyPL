type PlayerRouteTarget = {
	id: number | string;
	web_name?: string | null;
	first_name?: string | null;
	second_name?: string | null;
};

export const slugifyPlayerName = (value: string) =>
	value
		.normalize("NFKD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.replace(/["'’]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");

export const getPlayerRoute = (player: PlayerRouteTarget) => {
	const playerName = [player.first_name, player.second_name].filter(Boolean).join(" ") || player.web_name || "";
	const slug = slugifyPlayerName(playerName);

	return slug ? `/player/${slug}-${player.id}` : `/player/${player.id}`;
};

export const getPlayerIdFromRouteParam = (param: string | string[] | undefined) => {
	const routeParam = Array.isArray(param) ? param[param.length - 1] : param;
	const idMatch = String(routeParam ?? "").match(/(\d+)$/);

	return idMatch?.[1] ?? String(routeParam ?? "");
};
