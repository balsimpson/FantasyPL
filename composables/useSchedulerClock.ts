// Local clock for relative post labels. It makes no provider or API requests.
export function useSchedulerClock() {
  const now = ref(Date.now())
  let timer: ReturnType<typeof setInterval> | undefined
  onMounted(() => {
    now.value = Date.now()
    timer = setInterval(() => { if (!document.hidden) now.value = Date.now() }, 60_000)
  })
  onBeforeUnmount(() => {
    if (timer) clearInterval(timer)
  })
  return now
}
