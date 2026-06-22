import { motion } from "framer-motion";
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center gap-3 py-12"
    >
      <div className="relative">
        <Loader2 className={`${sizeMap[size]} text-primary animate-spin`} />
        <div className="absolute inset-0 rounded-full border-2 border-accent/20 animate-ping" />
      </div>
      <p className="text-sm text-slate-500 font-medium">{message}</p>
    </motion.div>
  );
}
