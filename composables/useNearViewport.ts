import type { Ref } from "vue";

/** Activate once, just before a section becomes visible. Keep SSR output stable. */
export function useNearViewport(target: Ref<HTMLElement | null>) {
  const visible = ref(false);
  const mounted = ref(false);
  let observer: IntersectionObserver | undefined;
  const stop = watch([mounted, target], ([isMounted, element]) => {
    observer?.disconnect();
    if (!isMounted || !element || visible.value) return;
    if (!("IntersectionObserver" in window)) {
      visible.value = true;
      return;
    }
    observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      visible.value = true;
      observer?.disconnect();
    }, { rootMargin: "200px" });
    observer.observe(element);
  }, { flush: "post" });
  onMounted(() => { mounted.value = true; });
  onBeforeUnmount(() => { stop(); observer?.disconnect(); });
  return visible;
}
