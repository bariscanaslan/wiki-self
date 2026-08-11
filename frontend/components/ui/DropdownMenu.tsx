"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "../../lib/utils/cn";

interface DropdownMenuProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: "left" | "right";
  className?: string;
}

interface Position {
  top: number;
  left?: number;
  right?: number;
}

export function DropdownMenu({ trigger, children, align = "right", className }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<Position | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function updatePosition() {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }

      setPosition(
        align === "right"
          ? { top: rect.bottom + 8, right: window.innerWidth - rect.right }
          : { top: rect.bottom + 8, left: rect.left },
      );
    }

    updatePosition();

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (containerRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }
      setIsOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen, align]);

  return (
    <div ref={containerRef} className="relative">
      <div onClick={() => setIsOpen((prev) => !prev)}>{trigger}</div>
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {isOpen && position && (
              <motion.div
                ref={menuRef}
                initial={{ opacity: 0, scale: 0.96, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -6 }}
                transition={{ duration: 0.14, ease: "easeOut" }}
                onClick={() => setIsOpen(false)}
                style={{ position: "fixed", top: position.top, left: position.left, right: position.right }}
                className={cn("z-50 min-w-[12rem] rounded-xl border border-zinc-200 bg-white p-1.5 shadow-lg", className)}
              >
                {children}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}

export function DropdownItem({
  children,
  onClick,
  href,
  danger,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  danger?: boolean;
  disabled?: boolean;
}) {
  const itemClassName = cn(
    "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40",
    danger ? "text-red-600 hover:bg-red-50" : "text-zinc-700 hover:bg-zinc-100",
  );

  if (href) {
    return (
      <Link href={href} className={itemClassName}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={itemClassName}>
      {children}
    </button>
  );
}
