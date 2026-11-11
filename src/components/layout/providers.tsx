'use client';

import React from 'react';
import { SessionProvider } from 'next-auth/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { ActiveThemeProvider } from '@/components/themes/active-theme';

// Wraps the app with the three things everything needs:
// 1. SessionProvider  — makes the logged-in user available everywhere
// 2. QueryClientProvider — needed for the sidebar overdue badge polling
// 3. ActiveThemeProvider — applies the mono/dark/light theme
export default function Providers({
  activeThemeValue,
  children
}: {
  activeThemeValue: string;
  children: React.ReactNode;
}) {
  const queryClient = getQueryClient();

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <ActiveThemeProvider initialTheme={activeThemeValue}>
          {children}
        </ActiveThemeProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
