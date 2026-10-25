export function useSchedulerHistoryRefresh(refresh: () => Promise<void>) {
  const now = ref(Date.now())
  let timer: ReturnType<typeof setInterval> | undefined
  const tick = () => {
    if (document.hidden) return
    now.value = Date.now()
    void refresh()
  }
  onMounted(() => {
    tick()
    // A short local tick avoids missing the minute-long provider cooldown.
    timer = setInterval(tick, 15_000)
    document.addEventListener('visibilitychange', tick)
  })
  onBeforeUnmount(() => {
    if (timer) clearInterval(timer)
    document.removeEventListener('visibilitychange', tick)
  })
  return now
}
