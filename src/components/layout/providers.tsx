'use client';
import React from 'react';
import { ActiveThemeProvider } from '@/components/themes/active-theme';
import QueryProvider from '@/components/layout/query-provider';
import { SessionProvider } from 'next-auth/react';

export default function Providers({
  activeThemeValue,
  children
}: {
  activeThemeValue: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <SessionProvider>
        <ActiveThemeProvider initialTheme={activeThemeValue}>
          <QueryProvider>{children}</QueryProvider>
        </ActiveThemeProvider>
      </SessionProvider>
    </>
  );
}
