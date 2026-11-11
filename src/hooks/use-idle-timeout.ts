'use client';

import { useEffect, useRef } from 'react';
import { signOut } from 'next-auth/react';

const IDLE_MINUTES = 5;
const IDLE_MS = IDLE_MINUTES * 60 * 1000;

// Signs the user out after 5 minutes of no mouse/keyboard/touch activity
export function useIdleTimeout() {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function resetTimer() {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        signOut({ callbackUrl: '/login' });
      }, IDLE_MS);
    }

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    events.forEach((e) => window.addEventListener(e, resetTimer));

    // Start the timer on mount
    resetTimer();

    return () => {
      if (timer.current) clearTimeout(timer.current);
      events.forEach((e) => window.removeEventListener(e, resetTimer));
    };
  }, []);
}
