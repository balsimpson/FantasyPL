import { getBootstrapStatic } from "~~/composables/usePremiereLeague";
import { getPlayerRoute } from "~/composables/usePlayerRoute";
import { getPublicSiteOrigin } from "~/utils/site-url";

const escapeXml = (value: string) =>
	value.replace(/[<>&'"]/g, (character) => {
		const entities: Record<string, string> = {
			"&": "&amp;",
			"<": "&lt;",
			">": "&gt;",
			"'": "&apos;",
			'"': "&quot;",
		};

		return entities[character];
	});

export default defineCachedEventHandler(
	async (event) => {
		const {
			public: { SITE_URL },
		} = useRuntimeConfig(event);
		const origin = getPublicSiteOrigin(SITE_URL);
		const data = await getBootstrapStatic();
		const players = Array.isArray(data?.elements) ? data.elements : [];
		const playerUrls = players
			.filter((player: any) => player?.id !== undefined && player?.id !== null)
			.map((player: any) => `${origin}${getPlayerRoute(player)}`);
		const urls = [...new Set([`${origin}/`, ...playerUrls])];

		setHeader(event, "content-type", "application/xml; charset=utf-8");

		return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
			.map(
				(url) => `  <url>
    <loc>${escapeXml(url)}</loc>
  </url>`
			)
			.join("\n")}
</urlset>
`;
	},
	{ name: "sitemap-v2", maxAge: 60 * 60, swr: true }
);
