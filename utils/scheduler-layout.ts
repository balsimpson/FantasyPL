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
}
export type SchedulerLayout = Record<string, SchedulerElementTransform>
export interface SchedulerBox { x: number; y: number; width: number; height: number }
export interface SchedulerGuide { axis: 'x' | 'y'; value: number }
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
    if (!/^[a-z]+:(spotlight|transfers|comparison|shortlist|fixtures)$/.test(key) || !layout || typeof layout !== 'object' || Array.isArray(layout)) continue
    const elements: SchedulerLayout = {}
    for (const [id, value] of Object.entries(layout)) {
      if (!/^[a-z][a-z0-9-]{0,63}$/.test(id) || !value || typeof value !== 'object') continue
      const { x, y, scale, z, align, contrast } = value as SchedulerElementTransform
      if (![x, y, scale].every(value => typeof value === 'number' && Number.isFinite(value)) || Math.abs(x) > 1080 || Math.abs(y) > 1080 || scale < 0.1 || scale > 3) continue
      elements[id] = { x, y, scale, ...(typeof z === 'number' && Number.isFinite(z) ? { z: clampLayoutValue(Math.round(z), -50, 100) } : {}), ...(['left', 'center', 'right'].includes(align ?? '') ? { align } : {}), ...(schedulerTextContrasts.some(option => option.value === contrast) ? { contrast } : {}) }
    }
    result[key] = elements
  }
  return result
}

// All geometry uses the artwork's 1080 px coordinate space, regardless of preview size.
export function snapSchedulerBox(box: SchedulerBox, others: SchedulerBox[], threshold = 8) {
  const guides: SchedulerGuide[] = []
  const next = { ...box }
  for (const axis of ['x', 'y'] as const) {
    const size = axis === 'x' ? 'width' : 'height'
    const targets = [0, 48, 540, 1032, 1080, ...others.flatMap(other => [other[axis], other[axis] + other[size] / 2, other[axis] + other[size]])]
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
    next[axis] = clampLayoutValue(next[axis], 0, Math.max(0, 1080 - next[size]))
    if (guide !== undefined && Math.abs(next[axis] - box[axis] - correction) < 0.01) guides.push({ axis, value: guide })
  }
  return { box: next, guides }
}

export function resizeSchedulerBox(box: SchedulerBox, dx: number, dy: number, corner: string, minRatio: number, maxRatio: number) {
  const left = corner.includes('w')
  const top = corner.includes('n')
  const horizontal = dx * (left ? -1 : 1)
  const vertical = dy * (top ? -1 : 1)
  const delta = (horizontal * box.width + vertical * box.height) / (box.width ** 2 + box.height ** 2)
  const roomX = left ? box.x + box.width : 1080 - box.x
  const roomY = top ? box.y + box.height : 1080 - box.y
  const ratio = clampLayoutValue(1 + delta, minRatio, Math.min(maxRatio, roomX / box.width, roomY / box.height))
  const width = box.width * ratio
  const height = box.height * ratio
  return { x: left ? box.x + box.width - width : box.x, y: top ? box.y + box.height - height : box.y, width, height, ratio }
}
