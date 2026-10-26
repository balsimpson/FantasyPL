export function useManagerTeamImage(getElement: () => HTMLElement | null, getFilename: () => string) {
  const busy = ref(false)
  const sharing = ref(false)
  const error = ref('')
  const imageUrl = ref('')
  const file = shallowRef<File | null>(null)
  const canShare = computed(() => Boolean(import.meta.client && file.value && navigator.share && navigator.canShare?.({ files: [file.value] })))
  let disposed = false

  async function create() {
    if (busy.value) return
    busy.value = true
    error.value = ''
    try {
      await nextTick()
      const element = getElement()
      if (!element) throw new Error('The team image could not load. Try again.')
      await document.fonts.ready
      await Promise.all(Array.from(element.querySelectorAll('img')).map(async image => {
        image.loading = 'eager'
        try { await image.decode() } catch {
          // PlayerPortrait replaces missing photos with the existing fallback.
          await nextTick()
          await image.decode().catch(() => {})
        }
      }))
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
      await nextTick()
      const { toBlob } = await import('html-to-image')
      const blob = await toBlob(element, { width: 540, height: 960, pixelRatio: 2, backgroundColor: '#101216', preferredFontFormat: 'woff2' })
      if (!blob) throw new Error('The team image could not be created. Try again.')
      if (disposed) return
      if (imageUrl.value) URL.revokeObjectURL(imageUrl.value)
      imageUrl.value = URL.createObjectURL(blob)
      file.value = new File([blob], getFilename(), { type: 'image/png' })
    } catch {
      if (!disposed) error.value = 'The team image could not be created. Please try again.'
    } finally { busy.value = false }
  }

  function download() {
    if (!file.value || !imageUrl.value) return
    const link = document.createElement('a')
    link.href = imageUrl.value
    link.download = file.value.name
    link.click()
  }

  async function share() {
    if (!file.value || !canShare.value || sharing.value) return
    sharing.value = true
    error.value = ''
    try { await navigator.share({ files: [file.value] }) }
    catch (cause) {
      if ((cause as { name?: string })?.name !== 'AbortError') error.value = 'Sharing did not complete. You can download the PNG instead.'
    } finally { sharing.value = false }
  }

  onScopeDispose(() => {
    disposed = true
    if (imageUrl.value) URL.revokeObjectURL(imageUrl.value)
  })
  return { busy, sharing, error, imageUrl, canShare, create, download, share }
}
