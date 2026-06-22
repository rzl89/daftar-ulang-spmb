import { cn } from "@/utils";
import { Check } from "lucide-react";

interface ProgressBarProps {
  steps: { title: string; description?: string }[];
  currentStep: number;
  className?: string;
}

export function ProgressBar({ steps, currentStep, className }: ProgressBarProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between relative">
        {/* Background line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-slate-200 mx-8" />
        {/* Active line */}
        <div
          className="absolute top-5 left-0 h-0.5 bg-primary mx-8 transition-all duration-500 ease-in-out"
          style={{
            width: `${Math.max(0, ((currentStep - 1) / (steps.length - 1)) * 100)}%`,
          }}
        />

        {steps.map((step, index) => {
          const stepNum = index + 1;
          const isCompleted = stepNum < currentStep;
          const isActive = stepNum === currentStep;

          return (
            <div key={index} className="relative flex flex-col items-center z-10">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300",
                  isCompleted && "bg-primary text-white",
                  isActive && "bg-accent text-primary-dark shadow-lg shadow-accent/30 scale-110",
                  !isCompleted && !isActive && "bg-slate-200 text-slate-400"
                )}
              >
                {isCompleted ? <Check className="h-5 w-5" /> : stepNum}
              </div>
              <span
                className={cn(
                  "mt-2 text-xs font-medium text-center max-w-[80px] leading-tight",
                  isActive ? "text-primary font-semibold" : "text-slate-400"
                )}
              >
                {step.title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
