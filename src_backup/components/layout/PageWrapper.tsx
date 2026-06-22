import { motion } from "framer-motion";
import { cn } from "@/utils";

interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function PageWrapper({ children, className, noPadding = false }: PageWrapperProps) {
  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "min-h-[calc(100vh-4rem)] bg-slate-50",
        !noPadding && "py-8 md:py-12 px-4 sm:px-6 lg:px-8",
        className
      )}
    >
      <div className={cn(!noPadding && "max-w-7xl mx-auto")}>{children}</div>
    </motion.main>
  );
}
