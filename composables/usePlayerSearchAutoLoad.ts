import type { Ref } from "vue";

export function usePlayerSearchAutoLoad(target: Ref<HTMLElement | null>, canLoadMore: Ref<boolean>, loadMore: () => void) {
  let observer: IntersectionObserver | undefined;

  watch(target, (element) => {
    observer?.disconnect();
    if (!element || typeof IntersectionObserver === "undefined") return;

    let root = element.parentElement;
    while (root && !/(auto|scroll)/.test(getComputedStyle(root).overflowY)) root = root.parentElement;
    observer = new IntersectionObserver((entries) => {
      if (element.isConnected && canLoadMore.value && entries.some((entry) => entry.isIntersecting)) loadMore();
    }, { root, rootMargin: "0px 0px 320px 0px" });
    observer.observe(element);
  }, { flush: "post" });

  onBeforeUnmount(() => observer?.disconnect());
}
