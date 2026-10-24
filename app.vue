<template>
	<NuxtLoadingIndicator />
	<NuxtPwaAssets />
	<NuxtLayout>
		<NuxtPage />
	</NuxtLayout>
</template>

<script setup lang="ts">
import { getPublicSiteOrigin } from "~/utils/site-url";

const config = useRuntimeConfig();
const origin = getPublicSiteOrigin(config.public.SITE_URL);
const socialImage = `${origin}/og-transfer-count.png`;
const socialImageAlt = "FPL Insights: Make your next transfer count. Player stats and fixtures, in one place.";

useSeoMeta({
	ogType: "website",
	ogSiteName: "FPL Insights",
	ogImage: socialImage,
	ogImageAlt: socialImageAlt,
	ogImageWidth: 1733,
	ogImageHeight: 907,
	ogImageType: "image/png",
	twitterCard: "summary_large_image",
	twitterImage: socialImage,
	twitterImageAlt: socialImageAlt,
});
</script>
