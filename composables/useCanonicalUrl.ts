export const useCanonicalUrl = () => {
	const route = useRoute();
	const {
		public: { SITE_URL },
	} = useRuntimeConfig();

	return computed(() => new URL(route.path, SITE_URL).href);
};
