import { cn } from "@/utils";
import type { RegistrationStatus } from "@/types";
import { CheckCircle, Clock, XCircle, Award } from "lucide-react";

const statusConfig: Record<
  RegistrationStatus,
  { label: string; className: string; icon: React.ReactNode }
> = {
  lulus: {
    label: "Lulus Seleksi",
    className: "bg-success/10 text-success border-success/20",
    icon: <CheckCircle className="h-3.5 w-3.5" />,
  },
  pending: {
    label: "Menunggu Verifikasi",
    className: "bg-accent/10 text-warning border-warning/20",
    icon: <Clock className="h-3.5 w-3.5" />,
  },
  ditolak: {
    label: "Ditolak",
    className: "bg-destructive/10 text-destructive border-destructive/20",
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
  selesai: {
    label: "Daftar Ulang Selesai",
    className: "bg-primary/10 text-primary border-primary/20",
    icon: <Award className="h-3.5 w-3.5" />,
  },
};

interface StatusBadgeProps {
  status: RegistrationStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
        config.className,
        className
      )}
    >
      {config.icon}
      {config.label}
    </span>
  );
}
