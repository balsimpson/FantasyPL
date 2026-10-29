import { DEFAULT_SITE_URL, getPublicSiteOrigin } from "./utils/site-url";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	compatibilityDate: "2024-04-03",
	devtools: {
		enabled: true,

		timeline: {
			enabled: true,
		},
	},
	app: {
		head: {
			title: "FPL Insights",
			titleTemplate: "%s | FPL Insights",
			htmlAttrs: {
				lang: "en",
			},
			meta: [
				{ name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
				{ name: "theme-color", content: "#050608" },
				{ name: "mobile-web-app-capable", content: "yes" },
				{ name: "apple-mobile-web-app-capable", content: "yes" },
				{ name: "apple-mobile-web-app-title", content: "FPL Insights" },
				{ name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
				{
					name: "keywords",
					content:
						"Fantasy Premier League, FPL, player transfers, statistics, decision-making, football, soccer, fantasy sports",
				},
			],
			script: [],
			link: [],
			style: [],
		},
	},
	modules: ["@pinia/nuxt", "@nuxt/ui", "nuxt-og-image", "nuxt-auth-utils", "@vite-pwa/nuxt"],
	vite: {
		optimizeDeps: {
			include: [
				"@tiptap/core",
				"@tiptap/vue-3",
				"@tiptap/pm/changeset",
				"@tiptap/pm/commands",
				"@tiptap/pm/dropcursor",
				"@tiptap/pm/gapcursor",
				"@tiptap/pm/history",
				"@tiptap/pm/keymap",
				"@tiptap/pm/model",
				"@tiptap/pm/schema-list",
				"@tiptap/pm/state",
				"@tiptap/pm/tables",
				"@tiptap/pm/transform",
				"@tiptap/pm/view",
			],
		},
	},
	pwa: {
		registerType: "autoUpdate",
		manifest: {
			id: "/",
			name: "FPL Insights",
			short_name: "FPL Insights",
			description: "Fantasy Premier League player stats, fixtures and insights.",
			start_url: "/",
			scope: "/",
			display: "standalone",
			background_color: "#050608",
			theme_color: "#050608",
			lang: "en",
		},
		pwaAssets: {
			config: true,
		},
		workbox: {
			navigateFallback: null,
			runtimeCaching: [{
				urlPattern: ({ request }) => request.mode === "navigate",
				handler: "NetworkOnly",
				options: { precacheFallback: { fallbackURL: "/offline.html" } },
			}],
			globPatterns: [
				"_nuxt/**/*.{js,css,woff2}",
				"offline.html",
				"pwa-*.png",
				"maskable-icon-*.png",
				"apple-touch-icon-*.png",
				"favicon.ico",
			],
		},
	},
	hooks: {
		"pwa:beforeBuildServiceWorker"(options) {
			// Nuxt's PWA transform strips .html from static files. Keep this public asset's real URL.
			options.workbox.manifestTransforms?.push(async (entries) => ({
				manifest: entries.map((entry) => entry.url === "offline" ? { ...entry, url: "offline.html" } : entry),
				warnings: [],
			}));
		},
	},
	routeRules: {
		"/admin/**": { headers: { "X-Robots-Tag": "noindex, nofollow", "Cache-Control": "private, no-store" } },
		"/api/admin/**": { headers: { "Cache-Control": "private, no-store" } },
	},
	site: {
		url: getPublicSiteOrigin(process.env.NUXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL),
		name: "FPL Insights",
	},
	ogImage: {
		defaults: {
			width: 1200,
			height: 630,
			extension: "png",
		},
	},
	  css: ['~/assets/css/main.css'],
	runtimeConfig: {
		adminGithubId: "",
		contentConvexUrl: "",
		contentServiceToken: "",
		oauth: { github: { clientId: "", clientSecret: "", redirectURL: "" } },
		session: { password: process.env.NUXT_SESSION_PASSWORD || "", maxAge: 60 * 60 * 12 },
		OPENAI_KEY: process.env.OPENAI_API_KEY,
		JEV_API_KEY: process.env.JEV_API_KEY || "",
		BUFFER_API_KEY: process.env.BUFFER_API_KEY || "",
		BUFFER_CHANNEL_ID: process.env.BUFFER_CHANNEL_ID || "",
		BUFFER_X_CHANNEL_ID: process.env.BUFFER_X_CHANNEL_ID || "",
		CONVEX_URL: process.env.CONVEX_URL || "",
		SCHEDULER_SERVICE_TOKEN: process.env.SCHEDULER_SERVICE_TOKEN || "",
		public: {
			SITE_URL: process.env.NUXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL,
			CLOUDINARY_UPLOAD_URL: process.env.CLOUDINARY_UPLOAD_URL,
			CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
			CLOUDINARY_UPLOAD_PRESET: process.env.CLOUDINARY_UPLOAD_PRESET,
		},
	},
});
