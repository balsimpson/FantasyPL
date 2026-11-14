import type { ComputedRef, Ref } from 'vue'
import { IPHONE_CROP, WALLPAPER_HEIGHT, WALLPAPER_WIDTH, type WallpaperArtworkModel } from '~/utils/wallpaper'
import type { WallpaperDevice } from '~/utils/wallpaper-devices'

// 1.2× keeps text crisp on recent phones while staying well inside mobile canvas limits.
const PIXEL_RATIO = 1.2
const PREPARE_DELAY = 400
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

interface WallpaperExportRequest {
  artwork: WallpaperArtworkModel
  device: WallpaperDevice
  filename: string
}

export function useWallpaperExport(
  getElement: () => HTMLElement | null | undefined,
  request: ComputedRef<WallpaperExportRequest | null>,
  dragging: Ref<boolean>,
) {
  const phase = ref('')
  const error = ref('')
  const prepared = shallowRef<{ request: WallpaperExportRequest; url: string }>()
  const current = computed(() => prepared.value?.request === request.value ? prepared.value : undefined)
  const downloadRequest = shallowRef<WallpaperExportRequest | null>(null)
  const busy = computed(() => downloadRequest.value !== null)
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
      prepared.value = { request: target, url: URL.createObjectURL(blob) }
      if (downloadRequest.value === target) downloadPrepared()
    } catch (cause) {
      if (isCurrent() && downloadRequest.value === target) error.value = cause instanceof Error && cause.message ? cause.message : 'The wallpaper could not be created. Please try again.'
    } finally {
      if (downloadRequest.value === target) downloadRequest.value = null
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
    if (downloadRequest.value === request.value) void prepare()
    else timer = setTimeout(prepare, PREPARE_DELAY)
  }

  onMounted(schedule)
  watch([request, dragging], ([target], [previous]) => {
    if (target !== previous) {
      clear()
      if (downloadRequest.value) {
        // Text can finish fitting after Save is clicked. Keep that download pending.
        if (target && previous?.artwork === target.artwork && previous.device === target.device) {
          downloadRequest.value = target
        } else {
          downloadRequest.value = null
          error.value = 'The wallpaper changed while saving. Press Save to download the current version.'
        }
      }
    }
    schedule()
  }, { flush: 'post' })
  function downloadPrepared() {
    const artwork = current.value
    if (!artwork) return
    const link = document.createElement('a')
    link.href = artwork.url
    link.download = artwork.request.filename
    link.click()
  }

  function download() {
    if (!request.value || dragging.value || busy.value) return
    error.value = ''
    if (current.value) {
      downloadPrepared()
      return
    }
    downloadRequest.value = request.value
    void prepare()
  }

  onScopeDispose(() => {
    disposed = true
    clearTimeout(timer)
    clear()
  })
  return { busy, phase, error, download }
}
