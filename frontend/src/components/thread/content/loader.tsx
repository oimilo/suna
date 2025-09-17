import React, { useState, useEffect } from 'react';
import { CircleDashed } from 'lucide-react';
import styles from '@/styles/toolcalls.module.css';

export const AgentLoader = () => {
  const [seconds, setSeconds] = useState(0);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setSeconds(elapsed);
    }, 100); // Update every 100ms for smooth experience

    return () => clearInterval(timer);
  }, [startTime]);

  return (
    <div className="flex items-center gap-2 py-2">
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8">
        <CircleDashed className={`h-3.5 w-3.5 text-muted-foreground opacity-60 ${styles.smoothSpin}`} />
        <span className="text-sm text-muted-foreground/80 font-medium">
          Pensando{seconds > 0 && (
            <span className="text-muted-foreground/60 font-normal">
              {' '}por {seconds} segundo{seconds !== 1 ? 's' : ''}
            </span>
          )}
        </span>
      </div>
    </div>
  );
};
