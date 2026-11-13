import type { ComputedRef, Ref } from 'vue'
import { IPHONE_CROP, WALLPAPER_HEIGHT, WALLPAPER_WIDTH } from '~/utils/wallpaper'
import type { WallpaperDevice } from '~/utils/wallpaper-devices'

// 1.2× keeps text crisp on recent phones while staying well inside mobile canvas limits.
const PIXEL_RATIO = 1.2
const PREPARE_DELAY = 400
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

interface WallpaperExportRequest {
  device: WallpaperDevice
  filename: string
}

export function useWallpaperExport(
  getElement: () => HTMLElement | null | undefined,
  request: ComputedRef<WallpaperExportRequest | null>,
  dragging: Ref<boolean>,
  open: Ref<boolean>,
) {
  const phase = ref('')
  const error = ref('')
  const prepared = shallowRef<{ request: WallpaperExportRequest; file: File; url: string }>()
  const current = computed(() => prepared.value?.request === request.value ? prepared.value : undefined)
  const imageUrl = computed(() => current.value?.url ?? '')
  const busy = computed(() => Boolean(request.value && !current.value && !error.value))
  const sharing = ref(false)
  const canShare = computed(() => Boolean(import.meta.client && current.value && typeof navigator.share === 'function' && navigator.canShare?.({ files: [current.value.file] })))
  let timer: ReturnType<typeof setTimeout> | undefined
  let active: WallpaperExportRequest | null = null
  let queued = false
  let disposed = false

  function clear() {
    if (prepared.value) URL.revokeObjectURL(prepared.value.url)
    prepared.value = undefined
  }

  async function prepare() {
    clearTimeout(timer)
    const target = request.value
    if (disposed || !target || dragging.value) return
    error.value = ''
    if (current.value || active === target) return
    if (active) {
      queued = true
      return
    }

    active = target
    const isCurrent = () => !disposed && request.value === target
    try {
      const element = getElement()
      if (!element) throw new Error('The wallpaper is still loading. Try again in a moment.')
      phase.value = 'Loading photo and fonts…'
      await document.fonts.ready
      for (let attempt = 0; attempt < 50 && isCurrent() && element.querySelector('[data-asset-state="loading"]'); attempt++) await wait(160)
      if (!isCurrent()) return
      if (element.querySelector('[data-asset-state="loading"]')) throw new Error('The player photo is still loading. Try again in a moment.')
      if (element.querySelector('[data-wp-portrait] [data-asset-state="missing"]')) throw new Error('The player photo is unavailable right now, so this wallpaper can’t be saved. Try again shortly or choose another player.')
      await Promise.all(Array.from(element.querySelectorAll('img')).map(image => image.decode().catch(() => undefined)))
      const { toCanvas } = await import('html-to-image')
      if (!isCurrent()) return
      phase.value = 'Rendering wallpaper…'
      // The editor uses both TrueType and WOFF2 fonts.
      const source = await toCanvas(element, { width: WALLPAPER_WIDTH, height: WALLPAPER_HEIGHT, pixelRatio: PIXEL_RATIO, style: { transform: 'none' } })
      if (!isCurrent()) return
      let output = source
      if (target.device === 'iphone') {
        // The iPhone file is the centred 19.5:9 crop shown in the preview.
        output = document.createElement('canvas')
        output.width = source.width
        output.height = Math.round((WALLPAPER_HEIGHT - IPHONE_CROP * 2) * PIXEL_RATIO)
        output.getContext('2d')!.drawImage(source, 0, Math.round(IPHONE_CROP * PIXEL_RATIO), source.width, output.height, 0, 0, output.width, output.height)
      }
      const blob = await new Promise<Blob | null>(resolve => output.toBlob(resolve, 'image/png'))
      if (!isCurrent()) return
      if (!blob) throw new Error('The image could not be created. Please try again.')
      const file = new File([blob], target.filename, { type: 'image/png' })
      prepared.value = { request: target, file, url: URL.createObjectURL(file) }
    } catch (cause) {
      if (isCurrent()) error.value = cause instanceof Error && cause.message ? cause.message : 'The wallpaper could not be created. Please try again.'
    } finally {
      active = null
      phase.value = ''
      if (queued) {
        queued = false
        void prepare()
      }
    }
  }

  function schedule() {
    clearTimeout(timer)
    queued = false
    if (!request.value || dragging.value || current.value) return
    if (open.value) void prepare()
    else timer = setTimeout(prepare, PREPARE_DELAY)
  }

  onMounted(schedule)
  watch([request, dragging], ([target], [previous]) => {
    if (target !== previous) {
      clear()
      error.value = ''
    }
    schedule()
  }, { flush: 'post' })
  watch(open, value => { if (value) void prepare() }, { flush: 'post' })

  function download() {
    if (!current.value) return
    const link = document.createElement('a')
    link.href = current.value.url
    link.download = current.value.file.name
    link.click()
  }

  async function share() {
    if (!current.value || !canShare.value || sharing.value) return
    const artwork = current.value
    sharing.value = true
    error.value = ''
    try { await navigator.share({ files: [artwork.file] }) }
    catch (cause) {
      if (current.value === artwork && (cause as { name?: string })?.name !== 'AbortError') error.value = 'Sharing didn’t complete. You can download the PNG instead.'
    } finally { sharing.value = false }
  }

  onScopeDispose(() => {
    disposed = true
    clearTimeout(timer)
    clear()
  })
  return { busy, phase, error, imageUrl, canShare, sharing, prepare, download, share }
}
