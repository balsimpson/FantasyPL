export function usePlayerSearchSurface() {
  const isOpen = useState("homepage-player-search-open", () => false);
  const origin = useState("homepage-player-search-origin", () => ({ x: 0, y: 0 }));

  const open = (event: MouseEvent) => {
    const bounds = (event.currentTarget as HTMLElement).getBoundingClientRect();
    origin.value = { x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2 };
    isOpen.value = true;
  };

  return { isOpen, origin, open };
}
