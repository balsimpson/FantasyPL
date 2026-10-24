import type { Ref } from 'vue'
import type { ArticleDraft } from '~/shared/articles'

type ArticleGenerationResult = { jobId: string; status: 'queued' | 'writing' | 'ready' | 'failed'; error: string | null; model: string | null; updatedAt: number; result: ArticleDraft | null }

export function useArticleGeneration(articleId: Ref<string>) {
  const job = ref<ArticleGenerationResult | null>(null)
  const starting = ref(false)
  const error = ref('')
  const active = computed(() => job.value?.status === 'queued' || job.value?.status === 'writing')
  let requestId: string | null = null
  let timer: ReturnType<typeof setInterval> | undefined
  async function refresh() {
    if (!articleId.value) return
    try {
      const fetchGeneration = $fetch as unknown as (url: string) => Promise<ArticleGenerationResult | null>
      job.value = await fetchGeneration(`/api/admin/generation/${articleId.value}`)
    }
    catch { error.value = 'Generation status could not be loaded. Your background job can still finish. Try refreshing.' }
  }
  async function start() {
    if (starting.value || active.value || !articleId.value) return false
    starting.value = true
    error.value = ''
    requestId ||= crypto.randomUUID()
    try {
      await $fetch(`/api/admin/articles/${articleId.value}/generate`, { method: 'POST', body: { requestId } })
      requestId = null
      await refresh()
      return true
    } catch (cause: any) { error.value = cause.data?.statusMessage || 'The article job could not be started. Please try again.'; return false }
    finally { starting.value = false }
  }
  onMounted(() => { void refresh(); timer = setInterval(() => { if (active.value && !document.hidden) void refresh() }, 4000) })
  onBeforeUnmount(() => clearInterval(timer))
  return { job, active, starting, error, refresh, start }
}
