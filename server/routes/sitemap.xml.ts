import { getBootstrapStatic } from "~~/composables/usePremiereLeague";
import { getPlayerRoute } from "~/composables/usePlayerRoute";
import { getPublicSiteOrigin } from "~/utils/site-url";
import { articleDatabase, publishedArticleResponse } from "../utils/articles";

const escapeXml = (value: string) =>
	value.replace(/[<>&'"]/g, (character) => {
		const entities: Record<string, string> = {
			"&": "&amp;",
			"<": "&lt;",
			">": "&gt;",
			"'": "&apos;",
			'"': "&quot;",
		};

		return entities[character]!;
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
		let publishedArticles: { loc: string; lastmod: string }[] = [];
		try {
			const { client, api } = articleDatabase();
			const articles = await client.query(api.articles.listPublished, { limit: 100 });
			publishedArticles = articles.map((record) => {
				const article = publishedArticleResponse(record);
				return { loc: `${origin}/blog/${article.slug}`, lastmod: new Date(article.updatedAt).toISOString() };
			});
		} catch {
			publishedArticles = [];
		}
		const entries: { loc: string; lastmod?: string }[] = [...new Set([`${origin}/`, `${origin}/blog`, ...playerUrls])].map((loc) => ({ loc }));
		const urls = [...entries, ...publishedArticles];

		setHeader(event, "content-type", "application/xml; charset=utf-8");

		return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
			.map(
				({ loc, lastmod }) => `  <url>
    <loc>${escapeXml(loc)}</loc>${lastmod ? `
    <lastmod>${escapeXml(lastmod)}</lastmod>` : ''}
  </url>`
			)
			.join("\n")}
</urlset>
`;
	},
	{ name: "sitemap-sportsync-v3", maxAge: 5 * 60, swr: true }
);
