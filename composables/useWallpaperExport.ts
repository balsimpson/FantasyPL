import { IPHONE_CROP, WALLPAPER_HEIGHT, WALLPAPER_WIDTH } from '~/utils/wallpaper'
import type { WallpaperDevice } from '~/utils/wallpaper-devices'

// 1.2× keeps text crisp on recent phones while staying well inside mobile canvas limits.
const PIXEL_RATIO = 1.2
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export function useWallpaperExport(getElement: () => HTMLElement | null | undefined, revision: () => string) {
  const busy = ref(false)
  const phase = ref('')
  const error = ref('')
  const imageUrl = ref('')
  const file = shallowRef<File | null>(null)
  const sharing = ref(false)
  const canShare = computed(() => Boolean(import.meta.client && file.value && typeof navigator.share === 'function' && navigator.canShare?.({ files: [file.value] })))
  let disposed = false

  function clear() {
    if (imageUrl.value) URL.revokeObjectURL(imageUrl.value)
    imageUrl.value = ''
    file.value = null
  }

  async function create(device: WallpaperDevice, filename: string) {
    if (busy.value) return
    busy.value = true
    error.value = ''
    clear()
    try {
      const element = getElement()
      if (!element) throw new Error('The wallpaper is still loading. Try again in a moment.')
      const before = revision()
      phase.value = 'Loading photo and fonts…'
      await document.fonts.ready
      for (let attempt = 0; attempt < 50 && element.querySelector('[data-asset-state="loading"]'); attempt++) await wait(160)
      if (element.querySelector('[data-wp-portrait] [data-asset-state="missing"]')) throw new Error('The player photo is unavailable right now, so this wallpaper can’t be saved. Try again shortly or choose another player.')
      await Promise.all(Array.from(element.querySelectorAll('img')).map(image => image.decode().catch(() => undefined)))
      phase.value = 'Rendering wallpaper…'
      const { toCanvas } = await import('html-to-image')
      const source = await toCanvas(element, { width: WALLPAPER_WIDTH, height: WALLPAPER_HEIGHT, pixelRatio: PIXEL_RATIO, preferredFontFormat: 'woff2', style: { transform: 'none' } })
      let output = source
      if (device === 'iphone') {
        // The iPhone file is the centred 19.5:9 crop shown in the preview.
        output = document.createElement('canvas')
        output.width = source.width
        output.height = Math.round((WALLPAPER_HEIGHT - IPHONE_CROP * 2) * PIXEL_RATIO)
        output.getContext('2d')!.drawImage(source, 0, Math.round(IPHONE_CROP * PIXEL_RATIO), source.width, output.height, 0, 0, output.width, output.height)
      }
      const blob = await new Promise<Blob | null>(resolve => output.toBlob(resolve, 'image/png'))
      if (!blob) throw new Error('The image could not be created. Please try again.')
      if (revision() !== before) throw new Error('The wallpaper changed while it was saving. Save it again.')
      if (disposed) return
      imageUrl.value = URL.createObjectURL(blob)
      file.value = new File([blob], filename, { type: 'image/png' })
    } catch (cause) {
      if (!disposed) error.value = cause instanceof Error && cause.message ? cause.message : 'The wallpaper could not be created. Please try again.'
    } finally {
      busy.value = false
      phase.value = ''
    }
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
      if ((cause as { name?: string })?.name !== 'AbortError') error.value = 'Sharing didn’t complete. You can download the PNG instead.'
    } finally { sharing.value = false }
  }

  onScopeDispose(() => { disposed = true; clear() })
  return { busy, phase, error, imageUrl, file, canShare, sharing, create, download, share, clear }
}
