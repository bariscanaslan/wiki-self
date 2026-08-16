import { cn } from "../../lib/utils/cn";

export function Spinner({ className, size = 20 }: { className?: string; size?: number }) {
  return (
    <svg
      className={cn("animate-spin text-current", className)}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      role="status"
      aria-label="Yükleniyor"
    >
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function FullPageSpinner() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-white dark:bg-zinc-900">
      <Spinner size={32} className="text-primary-600 dark:text-primary-400" />
    </div>
  );
}
