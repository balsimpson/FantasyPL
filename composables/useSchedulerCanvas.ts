import type { ComputedRef, Ref } from 'vue'
import { clampLayoutValue, copyLayout, defaultElementTransform, resizeSchedulerBox, snapSchedulerBox, type SchedulerBox, type SchedulerElementTransform, type SchedulerGuide } from '~/utils/scheduler-layout'
import type { useSchedulerLayouts } from './useSchedulerLayouts'

interface CanvasElement extends SchedulerBox { id: string; label: string; z: number; textAlign: string; parentId: string; parentScale: number; group: boolean }
type Corner = 'nw' | 'ne' | 'sw' | 'se'

export function useSchedulerCanvas(
  getArtwork: () => HTMLElement | null | undefined,
  surface: Ref<HTMLElement | null>,
  enabled: ComputedRef<boolean>,
  revision: ComputedRef<string>,
  editor: ReturnType<typeof useSchedulerLayouts>,
) {
  const elements = ref<CanvasElement[]>([])
  const selectedId = ref('')
  const scopeId = ref('')
  const visibleElements = computed(() => elements.value.filter(element => element.parentId === scopeId.value))
  const breadcrumbs = computed(() => {
    const chain: CanvasElement[] = []
    let current = elements.value.find(element => element.id === scopeId.value)
    while (current) { chain.unshift(current); current = elements.value.find(element => element.id === current!.parentId) }
    return chain
  })
  const snapping = ref(true)
  const guides = ref<SchedulerGuide[]>([])
  const previewWidth = ref(0)
  const dragging = ref(false)
  const selected = computed(() => elements.value.find(element => element.id === selectedId.value))
  const transform = computed(() => editor.layout.value[selectedId.value] ?? defaultElementTransform())
  let frame = 0
  let observer: ResizeObserver | undefined
  let assetsObserver: MutationObserver | undefined
  let gesture: { pointer: number; target: HTMLElement; startX: number; startY: number; box: CanvasElement; transform: SchedulerElementTransform; corner?: Corner; ratio: number } | undefined

  function measure() {
    frame = 0
    const artwork = getArtwork()
    const bounds = artwork?.getBoundingClientRect()
    if (!artwork || !bounds?.width) { elements.value = []; return }
    const ratio = bounds.width / 1080
    previewWidth.value = bounds.width
    elements.value = Array.from(artwork.querySelectorAll<HTMLElement>('[data-layout-id]')).flatMap(element => {
      const box = element.getBoundingClientRect()
      if (!box.width || !box.height) return []
      const style = getComputedStyle(element)
      let ancestor = element.parentElement?.closest<HTMLElement>('[data-layout-id]')
      const parentId = ancestor?.dataset.layoutId ?? ''
      let parentScale = 1
      while (ancestor) {
        parentScale *= editor.layout.value[ancestor.dataset.layoutId!]?.scale ?? 1
        ancestor = ancestor.parentElement?.closest<HTMLElement>('[data-layout-id]') ?? null
      }
      return [{ id: element.dataset.layoutId!, label: element.dataset.layoutLabel!, x: (box.left - bounds.left) / ratio, y: (box.top - bounds.top) / ratio, width: box.width / ratio, height: box.height / ratio, z: Number(style.zIndex) || 0, textAlign: style.textAlign, parentId, parentScale, group: element.dataset.layoutGroup === 'true' }]
    })
    if (selectedId.value && !selected.value) selectedId.value = ''
    if (scopeId.value && !elements.value.some(element => element.id === scopeId.value)) scopeId.value = ''
  }
  function scheduleMeasure() { if (!frame) frame = requestAnimationFrame(measure) }
  onMounted(() => {
    observer = new ResizeObserver(scheduleMeasure)
    if (surface.value) observer.observe(surface.value)
    assetsObserver = new MutationObserver(scheduleMeasure)
    if (getArtwork()) assetsObserver.observe(getArtwork()!, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-asset-state'] })
    void document.fonts.ready.then(scheduleMeasure)
    scheduleMeasure()
  })
  watch(revision, async () => { await nextTick(); scheduleMeasure() })
  watch(enabled, value => { if (!value) finish(true); scheduleMeasure() })
  onScopeDispose(() => { finish(true); observer?.disconnect(); assetsObserver?.disconnect(); if (frame) cancelAnimationFrame(frame) })

  function select(id: string) { selectedId.value = id; surface.value?.focus({ preventScroll: true }) }
  function openGroup(id = selectedId.value) {
    if (!elements.value.find(element => element.id === id)?.group) return
    scopeId.value = id
    select('')
  }
  function navigateGroup(id: string) { scopeId.value = id; select('') }
  function setTransform(next: SchedulerElementTransform, continuous = false) {
    if (!selectedId.value || !enabled.value) return
    const layout = { ...editor.layout.value, [selectedId.value]: next }
    if (continuous) editor.update(layout)
    else editor.change(layout)
  }
  function start(event: PointerEvent, id: string, corner?: Corner) {
    if (!enabled.value || (event.pointerType === 'mouse' && event.button !== 0) || gesture) return
    const element = elements.value.find(item => item.id === id)
    if (!element) return
    event.preventDefault()
    select(id)
    const target = event.currentTarget as HTMLElement
    target.setPointerCapture(event.pointerId)
    editor.begin()
    gesture = { pointer: event.pointerId, target, startX: event.clientX, startY: event.clientY, box: { ...element }, transform: { ...transform.value }, corner, ratio: getArtwork()!.getBoundingClientRect().width / 1080 }
  }
  function move(event: PointerEvent) {
    if (!gesture || event.pointerId !== gesture.pointer) return
    event.preventDefault()
    const { box, transform: original, corner, ratio } = gesture
    if (!dragging.value && Math.hypot(event.clientX - gesture.startX, event.clientY - gesture.startY) < 3) return
    dragging.value = true
    let dx = (event.clientX - gesture.startX) / ratio
    let dy = (event.clientY - gesture.startY) / ratio
    guides.value = []
    if (corner) {
      const result = resizeSchedulerBox(box, dx, dy, corner, 0.1 / original.scale, 3 / original.scale)
      setTransform({ ...original, x: original.x + (result.x - box.x) / box.parentScale, y: original.y + (result.y - box.y) / box.parentScale, scale: original.scale * result.ratio }, true)
    } else {
      if (event.shiftKey) { if (Math.abs(dx) > Math.abs(dy)) dy = 0; else dx = 0 }
      const proposed = { ...box, x: box.x + dx, y: box.y + dy }
      const others = visibleElements.value.filter(element => element.id !== box.id)
      const result = snapSchedulerBox(proposed, others, snapping.value && !event.altKey ? 6 / ratio : -1)
      // Shift constrains motion to the dominant axis, even when a guide is near.
      if (event.shiftKey) { if (dy === 0) result.box.y = box.y; else result.box.x = box.x }
      guides.value = result.guides.filter(guide => !event.shiftKey || (dy === 0 ? guide.axis === 'x' : guide.axis === 'y'))
      setTransform({ ...original, x: original.x + (result.box.x - box.x) / box.parentScale, y: original.y + (result.box.y - box.y) / box.parentScale }, true)
    }
  }
  function finish(cancel = false) {
    if (!gesture) return
    const { pointer, target } = gesture
    gesture = undefined
    dragging.value = false
    if (target.hasPointerCapture(pointer)) target.releasePointerCapture(pointer)
    editor.end(cancel)
    guides.value = []
  }
  function pointerEnd(event: PointerEvent) { if (gesture?.pointer === event.pointerId) finish(event.type === 'pointercancel') }
  function resetSelected() {
    const layout = copyLayout(editor.layout.value)
    delete layout[selectedId.value]
    editor.change(layout)
  }
  function align(axis: 'x' | 'y') {
    const box = selected.value
    if (!box) return
    const size = axis === 'x' ? box.width : box.height
    const parent = elements.value.find(element => element.id === box.parentId)
    const extent = parent ? (axis === 'x' ? parent.width : parent.height) : 1080
    setTransform({ ...transform.value, [axis]: transform.value[axis] + ((parent?.[axis] ?? 0) + (extent - size) / 2 - box[axis]) / box.parentScale })
  }
  function resize(percent: number) {
    const box = selected.value
    if (!box || !Number.isFinite(percent)) return
    const value = clampLayoutValue(percent / 100, 0.1, 3)
    const maximum = Math.min((1080 - box.x) / box.width, (1080 - box.y) / box.height)
    setTransform({ ...transform.value, scale: Math.min(value, transform.value.scale * maximum) })
  }
  function layer(direction: -1 | 1) {
    if (!selected.value) return
    const levels = visibleElements.value.map(element => element.z)
    setTransform({ ...transform.value, z: clampLayoutValue(direction === 1 ? Math.max(...levels) + 1 : Math.min(...levels) - 1, 1, 100) })
  }
  function alignText(value: 'left' | 'center' | 'right') { setTransform({ ...transform.value, align: value }) }
  function keyboard(event: KeyboardEvent) {
    if (!enabled.value || event.defaultPrevented || (event.target as HTMLElement).closest('input, textarea, select, [contenteditable="true"], [role="menu"]')) return
    const command = event.ctrlKey || event.metaKey
    if (command && ['z', 'y', 's'].includes(event.key.toLowerCase())) {
      event.preventDefault()
      if (gesture) return
      if (event.key.toLowerCase() === 's') editor.save()
      else if (event.key.toLowerCase() === 'y' || event.shiftKey) editor.redo()
      else editor.undo()
      return
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      if (gesture) finish(true)
      else if (selectedId.value) selectedId.value = ''
      else navigateGroup(elements.value.find(element => element.id === scopeId.value)?.parentId ?? '')
      return
    }
    if (event.key === 'Enter' && selected.value?.group) { event.preventDefault(); openGroup(); return }
    if (!selected.value || gesture) return
    const delta: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }
    const offset = delta[event.key]
    if (!offset) return
    event.preventDefault()
    const step = event.shiftKey ? 10 : 1
    const box = selected.value
    const x = clampLayoutValue(box.x + offset[0] * step, 0, Math.max(0, 1080 - box.width))
    const y = clampLayoutValue(box.y + offset[1] * step, 0, Math.max(0, 1080 - box.height))
    setTransform({ ...transform.value, x: transform.value.x + (x - box.x) / box.parentScale, y: transform.value.y + (y - box.y) / box.parentScale })
  }
  return { elements, visibleElements, scopeId, breadcrumbs, selectedId, selected, transform, snapping, guides, previewWidth, dragging, select, openGroup, navigateGroup, start, move, pointerEnd, finish, resetSelected, align, alignText, resize, layer, keyboard }
}
