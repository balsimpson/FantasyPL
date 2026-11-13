import type { MaybeRefOrGetter } from 'vue'
import type { RemixFont } from '~/utils/wallpaper-remix'

// Fits one line of display text to a length once its font has loaded, and reports
// the fitted size and measured width so remix parts can size their own boxes.
export function useRemixFit(options: MaybeRefOrGetter<{ text: string; font: RemixFont; length: number; maxSize: number; minSize: number; tracking?: number }>) {
  const size = ref(toValue(options).maxSize)
  const width = ref(0)
  const fitTick = useState('wallpaper-fit-tick', () => 0)
  let request = 0

  function measure(context: CanvasRenderingContext2D, text: string, font: RemixFont, fontSize: number, tracking: number) {
    context.font = `${font.style} ${font.weight} ${fontSize}px ${font.family}`
    return context.measureText(text).width + tracking * fontSize * Math.max(0, text.length - 1)
  }

  async function fit() {
    if (!import.meta.client) return
    const revision = ++request
    const { text: raw, font, length, maxSize, minSize, tracking = 0 } = toValue(options)
    const text = font.uppercase ? raw.toLocaleUpperCase() : raw
    try { await document.fonts.load(`${font.style} ${font.weight} ${maxSize}px ${font.family}`, text || 'A') } catch { /* system metrics */ }
    if (revision !== request) return
    const context = document.createElement('canvas').getContext('2d')
    if (!context) return
    const measured = measure(context, text, font, maxSize, tracking)
    const next = measured > 0 ? Math.max(minSize, Math.min(maxSize, Math.floor(maxSize * length / measured))) : maxSize
    size.value = next
    width.value = Math.ceil(measure(context, text, font, next, tracking))
    await nextTick()
    fitTick.value++
  }

  onMounted(fit)
  watch(() => JSON.stringify(toValue(options)), fit)
  return { size, width }
}
