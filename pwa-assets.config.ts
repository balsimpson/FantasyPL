import {
	createAppleSplashScreens,
	defineConfig,
	minimal2023Preset,
} from "@vite-pwa/assets-generator/config";

const brandBackground = "#050608";
const darkIconBackground = { fit: "contain" as const, background: brandBackground };

export default defineConfig({
	images: ["public/fpl-pwa-icon.png"],
	headLinkOptions: { preset: "2023" },
	preset: {
		...minimal2023Preset,
		transparent: {
			sizes: [64, 192, 512],
			favicons: [[48, "favicon.ico"]],
			padding: 0.05,
			resizeOptions: darkIconBackground,
		},
		maskable: {
			sizes: [512],
			padding: 0.18,
			resizeOptions: darkIconBackground,
		},
		apple: {
			sizes: [180],
			padding: 0.05,
			resizeOptions: darkIconBackground,
		},
		appleSplashScreens: createAppleSplashScreens({
			padding: 0.4,
			resizeOptions: { fit: "contain", background: brandBackground },
			darkResizeOptions: { fit: "contain", background: brandBackground },
			linkMediaOptions: { log: false, basePath: "/" },
		}),
	},
});
