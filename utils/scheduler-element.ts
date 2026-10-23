import type { ObjectDirective } from 'vue'
import type { SchedulerLayout, SchedulerTextContrast } from './scheduler-layout'

interface ElementBinding { id: string; label: string; layout?: SchedulerLayout; group?: boolean; contrast?: SchedulerTextContrast }
const originals = new WeakMap<HTMLElement, { transform: string; transformOrigin: string; z: number; position: string; isStatic: boolean; textAlign: string }>()

function apply(element: HTMLElement, { value }: { value: ElementBinding }) {
  if (!originals.has(element)) {
    const computed = getComputedStyle(element)
    originals.set(element, { transform: element.style.transform, transformOrigin: element.style.transformOrigin, z: (Number(computed.zIndex) || 0) + 10, position: element.style.position, isStatic: computed.position === 'static', textAlign: element.style.textAlign })
  }
  const original = originals.get(element)!
  element.dataset.layoutId = value.id
  element.dataset.layoutLabel = value.label
  if (value.group) element.dataset.layoutGroup = 'true'
  const change = value.layout?.[value.id]
  element.style.transform = change ? `translate(${change.x}px, ${change.y}px) scale(${change.scale}) ${original.transform}`.trim() : original.transform
  element.style.transformOrigin = change ? '0 0' : original.transformOrigin
  element.style.zIndex = String(change?.z ?? original.z)
  element.style.position = original.isStatic ? 'relative' : original.position
  element.style.textAlign = change?.align ?? original.textAlign
  if (value.id === 'player-name') {
    const contrast = change?.contrast ?? value.contrast ?? 'none'
    element.classList.toggle('[-webkit-text-stroke:4px_#071829]', contrast === 'outline')
    element.classList.toggle('[paint-order:stroke_fill]', contrast === 'outline')
    element.classList.toggle('[text-shadow:0_3px_8px_#000,0_0_3px_#000]', contrast === 'shadow')
    element.classList.toggle('mix-blend-exclusion', contrast === 'exclusion')
  }
}

// A directive preserves each template's existing flex/grid geometry without extra wrappers.
export const vSchedulerElement: ObjectDirective<HTMLElement, ElementBinding> = { mounted: apply, updated: apply }
