'use client';

import { useIdleTimeout } from '@/hooks/use-idle-timeout';

// Drop this anywhere inside the dashboard — it has no visible output
export function IdleTimeout() {
  useIdleTimeout();
  return null;
}
