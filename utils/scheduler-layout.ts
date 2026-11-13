export type SchedulerTextContrast = 'none' | 'outline' | 'shadow' | 'exclusion'
export const schedulerTextContrasts: { value: SchedulerTextContrast; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'outline', label: 'Outline' },
  { value: 'shadow', label: 'Shadow' },
  { value: 'exclusion', label: 'Exclusion' },
]
export const getSchedulerTextContrast = (design: string, contrast?: SchedulerTextContrast): SchedulerTextContrast => contrast ?? (design === 'night' ? 'outline' : 'none')

export interface SchedulerElementTransform {
  x: number
  y: number
  scale: number
  z?: number
  align?: 'left' | 'center' | 'right'
  contrast?: SchedulerTextContrast
  // Wallpaper layouts only; the scheduler parser drops it, so its saved data is unchanged.
  hidden?: boolean
}
export type SchedulerLayout = Record<string, SchedulerElementTransform>
export interface SchedulerBox { x: number; y: number; width: number; height: number }
export interface SchedulerGuide { axis: 'x' | 'y'; value: number }
// The artwork's coordinate space. The scheduler keeps its fixed 1080 px square.
export interface ArtboardSpec { width: number; height: number; margin: number; guides?: SchedulerGuide[] }
export const schedulerArtboard: ArtboardSpec = { width: 1080, height: 1080, margin: 48 }
export const schedulerLayoutStorageKey = 'fpl-scheduler-layouts-v1'
export const defaultElementTransform = (): SchedulerElementTransform => ({ x: 0, y: 0, scale: 1 })
export const copyLayout = (layout: SchedulerLayout): SchedulerLayout => JSON.parse(JSON.stringify(layout))
export const clampLayoutValue = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

export function parseSchedulerLayouts(raw: string | null): Record<string, SchedulerLayout> {
  if (!raw) return {}
  const parsed: unknown = JSON.parse(raw)
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed) || !('version' in parsed) || parsed.version !== 1 || !('layouts' in parsed)) throw new Error('Invalid saved layouts')
  const layouts = parsed.layouts
  if (!layouts || typeof layouts !== 'object' || Array.isArray(layouts)) throw new Error('Invalid saved layouts')
  const result: Record<string, SchedulerLayout> = {}
  for (const [key, layout] of Object.entries(layouts)) {
    if (!/^[a-z]+:(spotlight|transfers|comparison|shortlist|fixtures)$/.test(key)) continue
    const elements = parseLayoutElements(layout)
    if (elements) result[key] = elements
  }
  return result
}

// Validates one saved layout. Invalid items are skipped individually so the rest survive.
export function parseLayoutElements(layout: unknown, artboard: ArtboardSpec = schedulerArtboard, keepHidden = false): SchedulerLayout | null {
  if (!layout || typeof layout !== 'object' || Array.isArray(layout)) return null
  const limit = Math.max(artboard.width, artboard.height)
  const elements: SchedulerLayout = {}
  for (const [id, value] of Object.entries(layout)) {
    if (!/^[a-z][a-z0-9-]{0,63}$/.test(id) || !value || typeof value !== 'object') continue
    const { x, y, scale, z, align, contrast, hidden } = value as SchedulerElementTransform
    if (![x, y, scale].every(value => typeof value === 'number' && Number.isFinite(value)) || Math.abs(x) > limit || Math.abs(y) > limit || scale < 0.1 || scale > 3) continue
    elements[id] = { x, y, scale, ...(typeof z === 'number' && Number.isFinite(z) ? { z: clampLayoutValue(Math.round(z), -50, 100) } : {}), ...(['left', 'center', 'right'].includes(align ?? '') ? { align } : {}), ...(schedulerTextContrasts.some(option => option.value === contrast) ? { contrast } : {}), ...(keepHidden && hidden === true ? { hidden: true } : {}) }
  }
  return elements
}

// All geometry uses the artwork's own coordinate space (1080 px for the scheduler), regardless of preview size.
export function snapSchedulerBox(box: SchedulerBox, others: SchedulerBox[], threshold = 8, artboard: ArtboardSpec = schedulerArtboard) {
  const guides: SchedulerGuide[] = []
  const next = { ...box }
  for (const axis of ['x', 'y'] as const) {
    const size = axis === 'x' ? 'width' : 'height'
    const extent = axis === 'x' ? artboard.width : artboard.height
    const targets = [0, artboard.margin, extent / 2, extent - artboard.margin, extent, ...(artboard.guides ?? []).filter(guide => guide.axis === axis).map(guide => guide.value), ...others.flatMap(other => [other[axis], other[axis] + other[size] / 2, other[axis] + other[size]])]
    let closest = threshold + 1
    let correction = 0
    let guide: number | undefined
    for (const offset of [0, box[size] / 2, box[size]]) {
      for (const target of targets) {
        const distance = target - box[axis] - offset
        if (Math.abs(distance) <= threshold && Math.abs(distance) < closest) {
          closest = Math.abs(distance)
          correction = distance
          guide = target
        }
      }
    }
    next[axis] += correction
    next[axis] = clampLayoutValue(next[axis], 0, Math.max(0, extent - next[size]))
    if (guide !== undefined && Math.abs(next[axis] - box[axis] - correction) < 0.01) guides.push({ axis, value: guide })
  }
  return { box: next, guides }
}

export function resizeSchedulerBox(box: SchedulerBox, dx: number, dy: number, corner: string, minRatio: number, maxRatio: number, artboard: ArtboardSpec = schedulerArtboard) {
  const left = corner.includes('w')
  const top = corner.includes('n')
  const horizontal = dx * (left ? -1 : 1)
  const vertical = dy * (top ? -1 : 1)
  const delta = (horizontal * box.width + vertical * box.height) / (box.width ** 2 + box.height ** 2)
  const roomX = left ? box.x + box.width : artboard.width - box.x
  const roomY = top ? box.y + box.height : artboard.height - box.y
  const ratio = clampLayoutValue(1 + delta, minRatio, Math.min(maxRatio, roomX / box.width, roomY / box.height))
  const width = box.width * ratio
  const height = box.height * ratio
  return { x: left ? box.x + box.width - width : box.x, y: top ? box.y + box.height - height : box.y, width, height, ratio }
}
