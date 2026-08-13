import { Eye, EyeOff } from "lucide-react";
import { forwardRef, useState, type InputHTMLAttributes } from "react";
import { cn } from "../../lib/utils/cn";

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: string;
  hint?: string;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const [isVisible, setIsVisible] = useState(false);
    const inputId = id ?? props.name;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-zinc-700">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={isVisible ? "text" : "password"}
            className={cn(
              "w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 pr-10 text-sm text-zinc-900 placeholder:text-zinc-400 transition-colors",
              "focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100",
              error && "border-red-400 focus:border-red-500 focus:ring-red-100",
              className,
            )}
            {...props}
          />
          <button
            type="button"
            onClick={() => setIsVisible((prev) => !prev)}
            tabIndex={-1}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors hover:text-zinc-600"
            aria-label={isVisible ? "Şifreyi gizle" : "Şifreyi göster"}
          >
            {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {hint && !error && <p className="text-xs text-zinc-500">{hint}</p>}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  },
);

PasswordInput.displayName = "PasswordInput";
