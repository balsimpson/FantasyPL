export const SCHEMA_CONTEXT = "https://schema.org";
export const SITE_NAME = "FantasyPL";
export const SITE_ALTERNATE_NAME = "FPL Insights";
export const SITE_LOGO_PATH = "/FPL_logo.png";
export const SITE_LOGO_SIZE = 512;

export interface BreadcrumbItem {
	name: string;
	url: string;
}

export const getAbsoluteUrl = (origin: string, path: string) => new URL(path, origin).href;

export const getWebsiteSchema = (origin: string) => {
	const homeUrl = getAbsoluteUrl(origin, "/");

	return {
		"@type": "WebSite",
		"@id": `${homeUrl}#website`,
		url: homeUrl,
		name: SITE_NAME,
		alternateName: SITE_ALTERNATE_NAME,
		inLanguage: "en",
		publisher: { "@id": `${homeUrl}#organization` },
	};
};

// Articles repeat this full publisher object with the same @id so each page is self-contained.
export const getOrganizationSchema = (origin: string) => {
	const homeUrl = getAbsoluteUrl(origin, "/");

	return {
		"@type": "Organization",
		"@id": `${homeUrl}#organization`,
		name: SITE_NAME,
		alternateName: SITE_ALTERNATE_NAME,
		url: homeUrl,
		logo: {
			"@type": "ImageObject",
			url: getAbsoluteUrl(origin, SITE_LOGO_PATH),
			width: SITE_LOGO_SIZE,
			height: SITE_LOGO_SIZE,
		},
	};
};

// Pass the same visible items used by the page breadcrumb, with absolute canonical URLs.
export const getBreadcrumbSchema = (items: BreadcrumbItem[]) => ({
	"@type": "BreadcrumbList",
	itemListElement: items.map((item, index) => ({
		"@type": "ListItem",
		position: index + 1,
		name: item.name,
		item: item.url,
	})),
});

const JSON_LD_ESCAPES: Record<string, string> = {
	"<": "\\u003c",
	">": "\\u003e",
	"&": "\\u0026",
	"\u2028": "\\u2028",
	"\u2029": "\\u2029",
};

// Escapes characters that could end the script element or change HTML parsing.
export const serializeJsonLd = (schema: Record<string, unknown>) =>
	JSON.stringify({ "@context": SCHEMA_CONTEXT, ...schema }).replace(
		/[<>&\u2028\u2029]/g,
		(character) => JSON_LD_ESCAPES[character] ?? character,
	);

export const getJsonLdScript = (schema: Record<string, unknown>) => ({
	type: "application/ld+json",
	innerHTML: serializeJsonLd(schema),
});
