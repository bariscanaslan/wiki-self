import { Check } from "lucide-react";
import { cn } from "../../lib/utils/cn";

interface StepperProps {
  steps: string[];
  currentStep: number;
}

export function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <div className="flex items-center">
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isActive = index === currentStep;

        return (
          <div key={step} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-2">
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors duration-300",
                  isCompleted && "border-primary-600 dark:border-primary-500 bg-primary-600 text-white",
                  isActive && !isCompleted && "border-primary-600 dark:border-primary-500 text-primary-600 dark:text-primary-400",
                  !isActive && !isCompleted && "border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500",
                )}
              >
                {isCompleted ? <Check size={16} /> : index + 1}
              </div>
              <span className={cn("text-xs font-medium", isActive || isCompleted ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400 dark:text-zinc-500")}>{step}</span>
            </div>
            {index < steps.length - 1 && (
              <div className="mx-3 mb-5 h-0.5 flex-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                <div
                  className={cn("h-full bg-primary-600 transition-all duration-500", isCompleted ? "w-full" : "w-0")}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
