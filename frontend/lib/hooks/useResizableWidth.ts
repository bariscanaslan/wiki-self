import { useCallback, useEffect, useRef, useState } from "react";

interface UseResizableWidthOptions {
  storageKey: string;
  defaultWidth: number;
  minWidth: number;
  maxWidth: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function useResizableWidth({ storageKey, defaultWidth, minWidth, maxWidth }: UseResizableWidthOptions) {
  const [width, setWidth] = useState(defaultWidth);
  const isResizingRef = useRef(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) {
      return;
    }
    const parsed = Number.parseInt(stored, 10);
    if (Number.isNaN(parsed)) {
      return;
    }
    // One-time hydrate from localStorage after mount (SSR has no access to it, so the
    // default width is used for the initial render to avoid a hydration mismatch).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWidth(clamp(parsed, minWidth, maxWidth));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const startResize = useCallback(
    (event: React.PointerEvent) => {
      event.preventDefault();
      isResizingRef.current = true;
      const startX = event.clientX;
      const startWidth = width;

      function handlePointerMove(moveEvent: PointerEvent) {
        if (!isResizingRef.current) {
          return;
        }
        const nextWidth = clamp(startWidth + (moveEvent.clientX - startX), minWidth, maxWidth);
        setWidth(nextWidth);
      }

      function handlePointerUp(upEvent: PointerEvent) {
        isResizingRef.current = false;
        const finalWidth = clamp(startWidth + (upEvent.clientX - startX), minWidth, maxWidth);
        window.localStorage.setItem(storageKey, String(finalWidth));
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
      }

      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
    },
    [width, minWidth, maxWidth, storageKey],
  );

  return { width, startResize };
}
