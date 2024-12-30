import React, { useEffect } from "react";
import { useTimer } from "react-timer-hook";

interface SpotTimerProps {
  expiryTimestamp: Date;
  timerStarted: boolean;
}

const SpotTimer: React.FC<SpotTimerProps> = ({ expiryTimestamp, timerStarted }) => {
  const { seconds, minutes, restart } = useTimer({
    expiryTimestamp,
    onExpire: () => console.log("Timer expired!"),
  });

  // Restart the timer whenever the expiryTimestamp changes
  useEffect(() => {
    console.log("SpotTimer: New expiryTimestamp received:", expiryTimestamp);
    restart(expiryTimestamp);
  }, [expiryTimestamp, restart]);

  // Calculate total time remaining in seconds
  const totalSecondsRemaining = minutes * 60 + seconds;

  return (
    <div>
      <p
        className={
          totalSecondsRemaining <= 30 ? "text-2xl text-red-700" : "text-2xl"
        }
      >
        {totalSecondsRemaining === 0
          ? timerStarted ? "Time's up!" : ""
          : `Time remaining: ${minutes}:${seconds < 10 ? `0${seconds}` : seconds}`}
      </p>
    </div>
  );
  
};

export default SpotTimer;
