import React from "react";
import { cn } from "@/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftIcon, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-slate-700"
          >
            {label}
            {props.required && <span className="text-destructive ml-0.5">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              "w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400",
              "transition-all duration-200",
              "border-slate-200 hover:border-primary/30",
              "focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none",
              error && "border-destructive focus:border-destructive focus:ring-destructive/10",
              leftIcon && "pl-10",
              className
            )}
            {...props}
          />
        </div>
        {hint && !error && (
          <p className="text-xs text-slate-400">{hint}</p>
        )}
        {error && (
          <p className="text-xs text-destructive font-medium">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
