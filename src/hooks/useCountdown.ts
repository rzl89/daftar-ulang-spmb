import { useState, useEffect } from "react";
import { getTimeRemaining } from "@/utils";
import { REGISTRATION_DEADLINE } from "@/constants/school";

export function useCountdown(deadline: Date = REGISTRATION_DEADLINE) {
  const [timeLeft, setTimeLeft] = useState(getTimeRemaining(deadline));

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = getTimeRemaining(deadline);
      setTimeLeft(remaining);
      if (remaining.total <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [deadline]);

  const isExpired = timeLeft.total <= 0;
  const isUrgent = timeLeft.days <= 2;

  return { ...timeLeft, isExpired, isUrgent };
}
