import { toValue, type MaybeRefOrGetter } from "vue";
import { getPublicSiteOrigin } from "~/utils/site-url";

export const useCanonicalUrl = (path?: MaybeRefOrGetter<string>) => {
	const route = useRoute();
	const {
		public: { SITE_URL },
	} = useRuntimeConfig();
	const siteOrigin = getPublicSiteOrigin(SITE_URL);

	return computed(() => {
		const canonicalPath = path === undefined ? route.path : toValue(path);

		return new URL(canonicalPath, siteOrigin).href;
	});
};
