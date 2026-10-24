import { nextTick, type Ref } from "vue";

export function useHomepagePlayerRail(
  rail: Ref<HTMLElement | null>,
  visibleCount: Ref<number>,
  getTotal: () => number,
  filters: Ref<number | string>[],
) {
  const savedLeft = useState("homepage-player-scroll", () => 0);
  const canScrollBack = ref(false);
  const canScrollForward = ref(false);
  let active = true;
  let restoring = true;
  let appending = false;
  let resizeObserver: ResizeObserver | undefined;

  const updateControls = () => {
    const element = rail.value;
    if (!element) return;
    canScrollBack.value = element.scrollLeft > 2;
    canScrollForward.value = element.scrollLeft + element.clientWidth < element.scrollWidth - 2
      || visibleCount.value < getTotal();
  };

  const appendPlayers = async () => {
    if (appending || visibleCount.value >= getTotal()) return;
    appending = true;
    visibleCount.value = Math.min(visibleCount.value + 6, getTotal());
    await nextTick();
    appending = false;
    updateControls();
  };

  const onScroll = () => {
    if (!active || restoring || !rail.value) return;
    const element = rail.value;
    savedLeft.value = element.scrollLeft;
    updateControls();
    const remaining = element.scrollWidth - element.clientWidth - element.scrollLeft;
    if (element.scrollLeft > 0 && remaining <= element.clientWidth) void appendPlayers();
  };

  const restore = async () => {
    restoring = true;
    await nextTick();
    if (!active || !rail.value) return;
    rail.value.scrollTo({ left: savedLeft.value, behavior: "instant" });
    updateControls();
    restoring = false;
  };

  const scrollPlayers = async (direction: number) => {
    const element = rail.value;
    if (!element) return;
    const remaining = element.scrollWidth - element.clientWidth - element.scrollLeft;
    if (direction > 0 && remaining <= element.clientWidth) await appendPlayers();
    element.scrollBy({
      left: direction * element.clientWidth,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  };

  watch(rail, (element) => {
    resizeObserver?.disconnect();
    if (!element) return;
    resizeObserver = new ResizeObserver(updateControls);
    resizeObserver.observe(element);
    void restore();
  }, { flush: "post" });

  watch(filters, () => {
    savedLeft.value = 0;
    void restore();
  }, { flush: "post" });
  watch(getTotal, updateControls, { flush: "post" });

  onBeforeRouteLeave(() => {
    if (rail.value) savedLeft.value = rail.value.scrollLeft;
    active = false;
  });
  onActivated(() => {
    active = true;
    void restore();
  });
  onDeactivated(() => { active = false; });
  onBeforeUnmount(() => {
    active = false;
    resizeObserver?.disconnect();
  });

  return { canScrollBack, canScrollForward, onScroll, scrollPlayers };
}
