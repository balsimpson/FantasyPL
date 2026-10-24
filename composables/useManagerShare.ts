export function useManagerShare(getData: () => { title: string; url: string }) {
  const sharing = ref(false)
  const copied = ref(false)
  const showCopyDialog = ref(false)
  let resetCopied: ReturnType<typeof setTimeout> | undefined

  function record(event: 'click' | 'copy') {
    void $fetch('/api/manager-shares', {
      method: 'POST', body: { event }, keepalive: true, retry: 0, timeout: 3000,
    }).catch(() => {})
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(getData().url)
      copied.value = true
      showCopyDialog.value = false
      clearTimeout(resetCopied)
      resetCopied = setTimeout(() => { copied.value = false }, 2500)
      record('copy')
    } catch {
      showCopyDialog.value = true
    }
  }

  async function share() {
    if (sharing.value) return
    sharing.value = true
    record('click')
    try {
      const data = getData()
      if (navigator.share) {
        try {
          if (!navigator.canShare || navigator.canShare(data)) {
            await navigator.share(data)
            return
          }
        }
        catch (error) {
          if ((error as { name?: string } | null)?.name === 'AbortError') return
        }
      }
      await copyLink()
    } finally {
      sharing.value = false
    }
  }

  onBeforeUnmount(() => { clearTimeout(resetCopied) })
  return { sharing, copied, showCopyDialog, share, copyLink }
}
