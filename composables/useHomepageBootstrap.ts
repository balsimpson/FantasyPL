export function useHomepageBootstrap() {
  const lastSuccessful = shallowRef<Record<string, any>>();
  const mounted = ref(false);
  const recovering = ref(false);
  const request = useAsyncData("homepage-bootstrap", () => $fetch<Record<string, any>>("/api/homepage-bootstrap", { retry: 0 }), {
    default: () => lastSuccessful.value,
  });
  const hasCatalog = computed(() => Array.isArray(request.data.value?.elements));

  watch(request.data, (data) => {
    if (Array.isArray(data?.elements)) lastSuccessful.value = data;
  }, { immediate: true });

  // A failed server request gets one client recovery attempt before showing the fallback.
  // The same placeholders render on the server and during hydration.
  onMounted(async () => {
    if (!hasCatalog.value) {
      recovering.value = true;
      try { await request.refresh(); }
      finally { recovering.value = false; mounted.value = true; }
    } else {
      mounted.value = true;
    }
  });

  const pending = computed(() => !hasCatalog.value && (
    !mounted.value || recovering.value || request.status.value === "idle" || request.status.value === "pending"
  ));

  return { request, pending, failed: computed(() => !hasCatalog.value && !pending.value) };
}
