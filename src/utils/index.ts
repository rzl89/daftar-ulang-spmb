import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatShortDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function getTimeRemaining(deadline: Date): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
} {
  const total = deadline.getTime() - Date.now();
  // Clamp negative values to 0 so countdown doesn't show negative numbers after deadline passes
  const safe = Math.max(0, total);
  const seconds = Math.floor((safe / 1000) % 60);
  const minutes = Math.floor((safe / 1000 / 60) % 60);
  const hours = Math.floor((safe / (1000 * 60 * 60)) % 24);
  const days = Math.floor(safe / (1000 * 60 * 60 * 24));

  return { total, days, hours, minutes, seconds };
}

/** Convert a UTC ISO string to local datetime-local input value (YYYY-MM-DDTHH:mm) */
export function toDatetimeLocalValue(isoUtc: string): string {
  if (!isoUtc) return '';
  const d = new Date(isoUtc);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function generateRegistrationId(): string {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `SPMB-${year}-${random}`;
}

// Re-export API helpers
export { apiFetch, getStoredToken, setStoredToken, clearStoredToken } from './api';
