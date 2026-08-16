import type { ReactNode } from "react";
import { cn } from "../../lib/utils/cn";

type BadgeVariant = "default" | "primary" | "success" | "warning" | "danger";

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300",
  primary: "bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-400",
  success: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  warning: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400",
  danger: "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400",
};

export function Badge({ children, variant = "default", className }: { children: ReactNode; variant?: BadgeVariant; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", variantStyles[variant], className)}>
      {children}
    </span>
  );
}
