export const DEFAULT_SITE_URL = "https://www.sportsync.in";

const DEFAULT_SITE_ORIGIN = new URL(DEFAULT_SITE_URL).origin;

export const getPublicSiteOrigin = (siteUrl?: string | null) => {
	const candidate = siteUrl?.trim() || DEFAULT_SITE_URL;

	try {
		const parsedUrl = new URL(candidate);

		if (
			!["http:", "https:"].includes(parsedUrl.protocol) ||
			parsedUrl.username ||
			parsedUrl.password
		) {
			return DEFAULT_SITE_ORIGIN;
		}
		// The configured apex redirects to www; keep old environment overrides consistent.
		if (!parsedUrl.port && ["sportsync.in", "www.sportsync.in"].includes(parsedUrl.hostname)) {
			return DEFAULT_SITE_ORIGIN;
		}

		return parsedUrl.origin;
	} catch {
		return DEFAULT_SITE_ORIGIN;
	}
};
