import { useEffect, useState, type RefObject } from "react";

interface ScrollFadeState {
  /** There's more (already-scrolled-past) content to the left/top. */
  showStartFade: boolean;
  /** There's more content still hidden to the right/bottom. */
  showEndFade: boolean;
}

/**
 * Tracks whether a horizontally-scrollable element has content hidden past its current scroll
 * position, so callers can render a fade-out edge hinting "there's more here, swipe" — important
 * on mobile/touch, where there's no visible scrollbar to make an overflow obvious the way a mouse
 * wheel + visible track does on desktop.
 */
export function useScrollFade(ref: RefObject<HTMLElement | null>): ScrollFadeState {
  const [state, setState] = useState<ScrollFadeState>({ showStartFade: false, showEndFade: false });

  useEffect(() => {
    const el = ref.current;

    if (!el) return;

    function update() {
      const { scrollLeft, scrollWidth, clientWidth } = el!;

      setState({
        showStartFade: scrollLeft > 4,
        showEndFade: scrollLeft + clientWidth < scrollWidth - 4,
      });
    }

    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    const resizeObserver = new ResizeObserver(update);

    resizeObserver.observe(el);

    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      resizeObserver.disconnect();
    };
  }, [ref]);

  return state;
}
