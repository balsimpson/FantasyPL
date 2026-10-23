import type { ComputedRef } from 'vue'
import type { InstagramDraft } from '~/utils/instagram-templates'

export function useInstagramExport(getElement: () => HTMLElement | null | undefined, draftKey: ComputedRef<string>, draft: ComputedRef<InstagramDraft>) {
  const exportedUrl = ref('')
  function clearExport() {
    if (exportedUrl.value) URL.revokeObjectURL(exportedUrl.value)
    exportedUrl.value = ''
  }
  watch(draftKey, clearExport)
  onScopeDispose(clearExport)
  const assetsReady = ref(false)
  const busy = ref(false)
  const phase = ref('')
  const message = ref('')
  const failed = ref(false)
  const config = useRuntimeConfig()
  const { data: bufferStatus, status: connectionStatus } = useFetch('/api/buffer-status')
  const schedulingConfigured = computed(() => Boolean(config.public.CLOUDINARY_UPLOAD_URL && bufferStatus.value?.configured))
  const schedulingMessage = computed(() => {
    if (!config.public.CLOUDINARY_UPLOAD_URL) return 'Image upload is not configured.'
    if (connectionStatus.value === 'pending' || connectionStatus.value === 'idle') return 'Checking Buffer connection…'
    return bufferStatus.value?.message || 'The Buffer connection could not be checked. Reload to try again.'
  })

  watch([getElement, draftKey], (_, __, onCleanup) => {
    assetsReady.value = false
    message.value = ''
    const element = getElement()
    if (!import.meta.client || !element) return
    const check = () => {
      const photos = Array.from(element.querySelectorAll<HTMLElement>('[data-asset-state]'))
      assetsReady.value = photos.length > 0 && photos.every(photo => photo.dataset.assetState !== 'loading')
    }
    const observer = new MutationObserver(check)
    observer.observe(element, { subtree: true, attributes: true, attributeFilter: ['data-asset-state'], childList: true })
    check()
    onCleanup(() => observer.disconnect())
  }, { immediate: true, flush: 'post' })

  async function capture() {
    const element = getElement()
    if (!element || !assetsReady.value) throw new Error('Wait for the artwork assets to load before exporting.')
    const revision = draftKey.value
    await document.fonts.ready
    await Promise.all(Array.from(element.querySelectorAll('img')).map(image => image.decode()))
    const { toBlob } = await import('html-to-image')
    const blob = await toBlob(element, {
      width: 1080, height: 1080, canvasWidth: 1080, canvasHeight: 1080, pixelRatio: 1,
      backgroundColor: '#ffffff',
      style: { transform: 'none', position: 'static', width: '1080px', height: '1080px' },
    })
    if (!blob) throw new Error('The image could not be created. Please try again.')
    if (revision !== draftKey.value) throw new Error('The post changed during export. Please export it again.')
    return blob
  }
  async function run<T>(action: () => Promise<T>): Promise<T | undefined> {
    if (busy.value) return
    busy.value = true
    failed.value = false
    message.value = ''
    try { return await action() } catch (error) {
      failed.value = true
      message.value = error instanceof Error ? error.message : 'The post could not be processed. Please try again.'
    } finally { busy.value = false; phase.value = '' }
  }
  function download(filename: string) {
    return run(async () => {
      phase.value = 'Creating PNG…'
      const blob = await capture()
      clearExport()
      const url = URL.createObjectURL(blob)
      exportedUrl.value = url
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = filename
      anchor.click()
      message.value = 'PNG created at 1080 × 1080.'
    })
  }
  function schedule(filename: string, caption: string, allowRepeat = false) {
    return run(async () => {
      if (!schedulingConfigured.value) throw new Error(schedulingMessage.value)
      if (!caption.trim()) throw new Error('Write or generate a caption before scheduling.')
      const snapshot = JSON.parse(JSON.stringify(draft.value)) as InstagramDraft
      const requestId = crypto.randomUUID()
      phase.value = 'Creating image…'
      const blob = await capture()
      phase.value = 'Uploading image…'
      const form = new FormData()
      form.append('file', blob, filename)
      form.append('upload_preset', String(config.public.CLOUDINARY_UPLOAD_PRESET || 'fpl-preset'))
      form.append('folder', 'fpl-posts')
      const response = await fetch(String(config.public.CLOUDINARY_UPLOAD_URL), { method: 'POST', body: form })
      if (!response.ok) throw new Error('The image could not be uploaded. The post has not been scheduled.')
      const result = await response.json()
      if (typeof result.secure_url !== 'string' || !result.secure_url.startsWith('https://')) throw new Error('The upload returned no image URL. The post has not been scheduled.')
      phase.value = 'Sending to Buffer…'
      let scheduled
      try {
        scheduled = await $fetch('/api/send-buffer-post', {
          method: 'POST',
          body: { caption, image_url: result.secure_url, draft: snapshot, requestId, allowRepeat },
          retry: 0,
        })
      } catch (error: unknown) {
        const detail = error as { data?: { data?: { message?: string }; statusMessage?: string } }
        throw new Error(detail?.data?.data?.message || detail?.data?.statusMessage || 'Buffer did not confirm the post. Check your Buffer queue before trying again.')
      }
      if (!scheduled?.success || (!scheduled.queued && !scheduled.alreadyScheduled)) throw new Error('The post could not be added to Buffer.')
      useState('scheduler-history-revision', () => 0).value++
      return scheduled
    })
  }
  return { exportedUrl, assetsReady, busy, phase, message, failed, schedulingConfigured, schedulingMessage, download, schedule }
}
