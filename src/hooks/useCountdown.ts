import { useState, useEffect } from "react";
import { getTimeRemaining } from "@/utils";
import { getRegistrationDeadline } from "@/constants/school";

export function useCountdown(deadline?: Date) {
  const targetDeadline = deadline || getRegistrationDeadline();
  const [timeLeft, setTimeLeft] = useState(getTimeRemaining(targetDeadline));

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = getTimeRemaining(targetDeadline);
      setTimeLeft(remaining);
      if (remaining.total <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDeadline]);

  const isExpired = timeLeft.total <= 0;
  const isUrgent = timeLeft.days <= 2;

  return { ...timeLeft, isExpired, isUrgent };
}
