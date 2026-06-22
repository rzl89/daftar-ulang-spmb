import { cn } from "@/utils";
import { motion } from "framer-motion";
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
        <motion.div
          className="absolute top-5 left-0 h-0.5 bg-primary mx-8"
          initial={{ width: "0%" }}
          animate={{
            width: `${Math.max(0, ((currentStep - 1) / (steps.length - 1)) * 100)}%`,
          }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />

        {steps.map((step, index) => {
          const stepNum = index + 1;
          const isCompleted = stepNum < currentStep;
          const isActive = stepNum === currentStep;

          return (
            <div key={index} className="relative flex flex-col items-center z-10">
              <motion.div
                initial={false}
                animate={{
                  scale: isActive ? 1.1 : 1,
                  backgroundColor: isCompleted
                    ? "#1A237E"
                    : isActive
                    ? "#F9A825"
                    : "#e2e8f0",
                }}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors",
                  isCompleted && "text-white",
                  isActive && "text-primary-dark shadow-lg shadow-accent/30",
                  !isCompleted && !isActive && "text-slate-400"
                )}
              >
                {isCompleted ? <Check className="h-5 w-5" /> : stepNum}
              </motion.div>
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
