import type { Ref } from 'vue';
import type { ManagerTransferChip } from '~/shared/manager-transfer-plan';

export function useManagerTransferRecommendations(managerId: Ref<string | number>, gameweek: Ref<number | null>, chip: Ref<ManagerTransferChip>) {
  const loading = ref(true);
  const errorMessage = ref('');
  const result = ref<Record<string, any> | null>(null);
  const cacheKey = computed(() => `manager-recommendations:v2:${managerId.value}:${gameweek.value ?? 'next'}:${chip.value}`);
  let requestId = 0;
  const readCache = (key: string) => {
    try {
      const cached = JSON.parse(localStorage.getItem(key) || 'null');
      return /^[a-f0-9]{64}$/.test(cached?.fingerprint) && Array.isArray(cached?.suggestions) ? cached : null;
    } catch { return null; }
  };
  const loadRecommendations = async () => {
    const id = ++requestId;
    const key = cacheKey.value;
    const cached = readCache(key);
    loading.value = true;
    errorMessage.value = '';
    result.value = cached;
    try {
      const latest = await $fetch<Record<string, any>>(`/api/managers/${managerId.value}/recommendations`, {
        retry: 0, cache: 'no-store',
        query: { chip: chip.value, gameweek: gameweek.value ?? undefined, cachedFingerprint: cached?.fingerprint },
      });
      // Switching week or chip must not let an older response replace the new plan.
      if (id !== requestId) return;
      result.value = latest.unchanged && cached ? cached : latest;
      if (typeof latest.fingerprint === 'string' && Array.isArray(latest.suggestions)) {
        try { localStorage.setItem(key, JSON.stringify(latest)); } catch { /* Storage is optional. */ }
      } else if (!latest.unchanged) {
        try { localStorage.removeItem(key); } catch { /* Storage is optional. */ }
      }
    } catch (error: any) {
      if (id === requestId) errorMessage.value = error?.data?.statusMessage || 'Transfer options could not load. Try again shortly.';
    } finally {
      if (id === requestId) loading.value = false;
    }
  };
  onMounted(() => watch(cacheKey, () => { void loadRecommendations(); }, { immediate: true }));
  onBeforeUnmount(() => { requestId++; });
  return { loading, errorMessage, result, loadRecommendations };
}
