import { getBootstrapStatic } from "~~/composables/usePremiereLeague";
import { getPlayerRoute } from "~/composables/usePlayerRoute";

export default defineCachedEventHandler(
	async (event) => {
		const origin = getRequestURL(event).origin;
		const data = await getBootstrapStatic();
		const playerUrls = (data.elements || []).map((player: any) => `${origin}${getPlayerRoute(player)}`);
		const urls = [`${origin}/`, ...playerUrls];

		setHeader(event, "content-type", "application/xml; charset=utf-8");

		return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
			.map(
				(url) => `  <url>
    <loc>${url}</loc>
  </url>`
			)
			.join("\n")}
</urlset>
`;
	},
	{ maxAge: 60 * 60, swr: true }
);
