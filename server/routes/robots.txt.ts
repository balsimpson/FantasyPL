import { getPublicSiteOrigin } from "~/utils/site-url";

export default defineEventHandler((event) => {
	const {
		public: { SITE_URL },
	} = useRuntimeConfig(event);
	const origin = getPublicSiteOrigin(SITE_URL);

	setHeader(event, "content-type", "text/plain; charset=utf-8");

	return `User-agent: *
Allow: /
Disallow: /api/
Sitemap: ${origin}/sitemap.xml
`;
});
