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
			title: "FPL Insights | Simplified Fantasy Premier League Decision-Making",
			meta: [
				{ name: "viewport", content: "width=device-width, initial-scale=1" },
				{
					name: "description",
					content:
						"Make smarter FPL decisions with our simplified view of top transfers and key player statistics. Stay ahead in your Fantasy Premier League journey.",
				},
				{
					property: "og:title",
					content: "FPL Insights | Smart Fantasy Premier League Tools",
				},
				{
					property: "og:description",
					content:
						"Simplify your FPL strategy with our easy-to-use tools. Track top transfers, analyze key stats, and make informed decisions effortlessly.",
				},
				{
					property: "og:image",
					content: "https://example.com/fpl-insights-preview.png",
				},
				{
					property: "og:url",
					content: "https://fpl-insights.com/",
				},
				{
					name: "twitter:card",
					content: "summary_large_image",
				},
				{
					name: "twitter:title",
					content: "FPL Insights | Simplified Fantasy Premier League Analysis",
				},
				{
					name: "twitter:description",
					content:
						"Maximize your FPL performance with our intuitive tools. Track transfers, analyze player stats, and make winning decisions easily.",
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
	modules: ["@nuxtjs/tailwindcss"],
	runtimeConfig: {
		public: {
			OPENAI_KEY: process.env.OPENAI_API_KEY,
		},
	},
});
