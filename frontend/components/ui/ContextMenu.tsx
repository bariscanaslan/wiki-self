"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "../../lib/utils/cn";

interface ContextMenuPoint {
  x: number;
  y: number;
}

interface ContextMenuProps {
  point: ContextMenuPoint | null;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

export function ContextMenu({ point, onClose, children, className }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    function updatePosition() {
      if (!point) {
        setPosition(null);
        return;
      }

      const rect = menuRef.current?.getBoundingClientRect();
      const width = rect?.width ?? 0;
      const height = rect?.height ?? 0;

      setPosition({
        left: Math.max(8, Math.min(point.x, window.innerWidth - width - 8)),
        top: Math.max(8, Math.min(point.y, window.innerHeight - height - 8)),
      });
    }

    updatePosition();
  }, [point]);

  useEffect(() => {
    if (!point) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (menuRef.current?.contains(event.target as Node)) {
        return;
      }
      onClose();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", onClose, true);
    window.addEventListener("resize", onClose);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", onClose, true);
      window.removeEventListener("resize", onClose);
    };
  }, [point, onClose]);

  if (typeof document === "undefined" || !point) {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.12, ease: "easeOut" }}
        onClick={onClose}
        style={{
          position: "fixed",
          top: position?.top ?? point.y,
          left: position?.left ?? point.x,
          visibility: position ? "visible" : "hidden",
        }}
        className={cn("z-50 min-w-[12rem] rounded-xl border border-zinc-200 bg-white p-1.5 shadow-lg", className)}
      >
        {children}
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}
