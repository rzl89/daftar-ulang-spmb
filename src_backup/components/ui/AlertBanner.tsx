import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Clock } from "lucide-react";
import { useCountdown } from "@/hooks";

export function AlertBanner() {
  const { days, hours, minutes, seconds, isExpired, isUrgent } = useCountdown();

  if (isExpired) return null;

  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className={`w-full ${isUrgent ? "bg-destructive" : "bg-primary-dark"} text-white overflow-hidden`}
      >
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-center gap-3 text-sm">
          {isUrgent ? (
            <AlertTriangle className="h-4 w-4 text-accent animate-pulse flex-shrink-0" />
          ) : (
            <Clock className="h-4 w-4 text-accent flex-shrink-0" />
          )}
          <span className="font-medium">
            {isUrgent ? "⚠️ Segera Daftar Ulang!" : "Batas Waktu Daftar Ulang:"}
          </span>
          <div className="flex items-center gap-1 font-mono font-bold">
            <TimeBlock value={pad(days)} label="Hari" />
            <span className="text-accent mx-0.5">:</span>
            <TimeBlock value={pad(hours)} label="Jam" />
            <span className="text-accent mx-0.5">:</span>
            <TimeBlock value={pad(minutes)} label="Mnt" />
            <span className="text-accent mx-0.5">:</span>
            <TimeBlock value={pad(seconds)} label="Dtk" />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function TimeBlock({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="bg-white/15 rounded px-1.5 py-0.5 text-xs tabular-nums min-w-[28px] text-center">
        {value}
      </span>
      <span className="text-[9px] text-white/60 mt-0.5 hidden sm:block">{label}</span>
    </div>
  );
}
