import { useEffect, type RefObject } from "react";

type Orientation = "horizontal" | "vertical" | "both";

interface ArrowKeyNavOptions {
  /** Which arrow keys move focus. "vertical" (Up/Down) is right for stacked lists/menus,
      "horizontal" (Left/Right) for a row of buttons/tabs, "both" for a grid. Default "both". */
  orientation?: Orientation;
  /** Whether moving past the last item wraps to the first (and vice versa). Default true. */
  loop?: boolean;
  /** CSS selector for the focusable items to navigate between, scoped to the container. */
  selector?: string;
}

const DEFAULT_SELECTOR =
  'button:not([disabled]), [role="button"]:not([aria-disabled="true"]), a[href], input:not([disabled]):not([type="hidden"]), select:not([disabled])';

/**
 * Roving-focus arrow-key navigation for a group of sibling controls (nav items, tab lists,
 * toolbars, pill groups, dropdown results) — attach `containerRef` to their wrapping element and
 * Up/Down/Left/Right will move focus between whichever of them (buttons, links, inputs) are
 * currently focusable, in DOM order, without needing per-item wiring. Enter/Space aren't handled
 * here — they already activate a focused native <button>/<a> by default, so there's nothing to add.
 */
export function useArrowKeyNav(containerRef: RefObject<HTMLElement | null>, options: ArrowKeyNavOptions = {}) {
  const { orientation = "both", loop = true, selector = DEFAULT_SELECTOR } = options;

  useEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    function handleKeyDown(event: KeyboardEvent) {
      const { key } = event;
      const allowsVertical = orientation !== "horizontal";
      const allowsHorizontal = orientation !== "vertical";

      const forward = (allowsVertical && key === "ArrowDown") || (allowsHorizontal && key === "ArrowRight");
      const backward = (allowsVertical && key === "ArrowUp") || (allowsHorizontal && key === "ArrowLeft");

      if (!forward && !backward) return;

      const items = Array.from(container!.querySelectorAll<HTMLElement>(selector));

      if (items.length === 0) return;

      const currentIndex = items.indexOf(document.activeElement as HTMLElement);

      if (currentIndex === -1) return;

      let nextIndex = currentIndex + (forward ? 1 : -1);

      if (loop) {
        nextIndex = (nextIndex + items.length) % items.length;
      } else {
        nextIndex = Math.max(0, Math.min(items.length - 1, nextIndex));
      }

      if (nextIndex === currentIndex) return;

      event.preventDefault();
      items[nextIndex]?.focus();
    }

    container.addEventListener("keydown", handleKeyDown);

    return () => container.removeEventListener("keydown", handleKeyDown);
  }, [containerRef, orientation, loop, selector]);
}
