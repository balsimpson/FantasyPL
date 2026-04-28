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
			titleTemplate: (title) => (title ? `${title} | FPL Insights` : "FPL Insights"),
			meta: [
				{ name: "viewport", content: "width=device-width, initial-scale=1" },
				{
					property: "og:image",
					content: "https://example.com/fpl-insights-preview.png",
				},
				{
					name: "twitter:card",
					content: "summary_large_image",
				},
				{
					name: "twitter:image",
					content: "https://example.com/fpl-insights-preview.png",
				},
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
	modules: ["@pinia/nuxt", "@nuxt/ui"],
	  css: ['~/assets/css/main.css'],
	runtimeConfig: {
		OPENAI_KEY: process.env.OPENAI_API_KEY,
		public: {
			CLOUDINARY_UPLOAD_URL: process.env.CLOUDINARY_UPLOAD_URL,
			MAKE_WEBHOOK_URL: process.env.MAKE_WEBHOOK_URL,
		},
	},
});
