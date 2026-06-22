import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  message?: string;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: "h-5 w-5",
  md: "h-8 w-8",
  lg: "h-12 w-12",
};

export function LoadingSpinner({ message = "Memuat data...", size = "md" }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <div className="relative">
        <Loader2 className={`${sizeMap[size]} text-primary animate-spin`} />
      </div>
      <p className="text-sm text-slate-500 font-medium">{message}</p>
    </div>
  );
}
