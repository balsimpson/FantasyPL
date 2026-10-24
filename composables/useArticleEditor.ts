import { articleText, emptyArticle, validateArticleDraft, type SavedArticle } from '~/shared/articles'

export function useArticleEditor(id: string) {
  const draft = ref(emptyArticle())
  const articleId = ref(id === 'new' ? '' : id)
  const version = ref(0)
  const savedAt = ref<number | null>(null)
  const savedSnapshot = ref(JSON.stringify(draft.value))
  const saving = ref(false)
  const saveError = ref('')
  const loadError = ref('')
  const loading = ref(id !== 'new')
  const conflict = ref(false)
  const dirty = computed(() => JSON.stringify(draft.value) !== savedSnapshot.value)
  const wordCount = computed(() => articleText(draft.value.body).trim().split(/\s+/).filter(Boolean).length)
  const requestFetch = useRequestFetch()
  // Preserve a request ID after a failed/uncertain response, so a retry is safe.
  let pendingSave: { requestId: string; expectedVersion: number; draft: ReturnType<typeof emptyArticle>; fingerprint: string } | null = null

  async function load() {
    if (id === 'new') return
    loading.value = true
    loadError.value = ''
    try {
      const article = await requestFetch<SavedArticle>(`/api/admin/articles/${id}`)
      const { title, slug, excerpt, template, season, gameweek, body } = article
      draft.value = { title, slug, excerpt, template, season, gameweek, body }
      version.value = article.version
      savedAt.value = article.updatedAt
      savedSnapshot.value = JSON.stringify(draft.value)
    } catch (error: any) { loadError.value = error.data?.statusMessage || 'This article could not be loaded. Please try again.' }
    finally { loading.value = false }
  }

  async function save() {
    if (saving.value || loading.value || loadError.value || conflict.value || (!dirty.value && version.value > 0)) return false
    saveError.value = ''
    try {
      if (!pendingSave) {
        const validated = validateArticleDraft(draft.value)
        articleId.value ||= crypto.randomUUID()
        pendingSave = { requestId: crypto.randomUUID(), expectedVersion: version.value, draft: validated, fingerprint: JSON.stringify(draft.value) }
      }
      saving.value = true
      const snapshot = pendingSave
      const article = await $fetch<SavedArticle>(`/api/admin/articles/${articleId.value}`, { method: 'PUT', body: { requestId: snapshot.requestId, expectedVersion: snapshot.expectedVersion, draft: snapshot.draft } })
      version.value = article.version
      savedAt.value = article.updatedAt
      // Compare the submitted content, not text typed while the request was in flight.
      savedSnapshot.value = snapshot.fingerprint
      pendingSave = null
      return true
    } catch (error: any) {
      conflict.value = error.statusCode === 409 || error.response?.status === 409
      saveError.value = error.data?.statusMessage || error.message || 'Your draft could not be saved. Keep this page open and try again.'
      if ([400, 401, 403, 409].includes(error.statusCode || error.response?.status)) pendingSave = null
      return false
    } finally { saving.value = false }
  }

  const beforeUnload = (event: BeforeUnloadEvent) => {
    if (!dirty.value && !saving.value) return
    event.preventDefault()
    event.returnValue = ''
  }
  onMounted(() => window.addEventListener('beforeunload', beforeUnload))
  onBeforeUnmount(() => window.removeEventListener('beforeunload', beforeUnload))
  return { draft, articleId, version, savedAt, saving, saveError, loadError, loading, conflict, dirty, wordCount, load, save }
}
