import { useState, useEffect } from "react";
import { getTimeRemaining } from "@/utils";

const URGENT_THRESHOLD_MS = 2 * 24 * 60 * 60 * 1000; // 2 days in milliseconds

export function useCountdown(deadline?: Date) {
  const [timeLeft, setTimeLeft] = useState(
    deadline ? getTimeRemaining(deadline) : getTimeRemaining(new Date(0))
  );

  useEffect(() => {
    if (!deadline) {
      setTimeLeft(getTimeRemaining(new Date(0)));
      return;
    }

    const timer = setInterval(() => {
      const remaining = getTimeRemaining(deadline);
      setTimeLeft(remaining);
      if (remaining.total <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [deadline]);

  const isExpired = !deadline || timeLeft.total <= 0;
  // Use total ms for accuracy, not just days (off-by-one fix)
  const isUrgent = timeLeft.total <= URGENT_THRESHOLD_MS;

  return { ...timeLeft, isExpired, isUrgent };
}
