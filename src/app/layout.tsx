import Providers from '@/components/layout/providers';
import { Toaster } from '@/components/ui/sonner';
import { fontVariables } from '@/components/themes/font.config';
import { DEFAULT_THEME } from '@/components/themes/theme.config';
import ThemeProvider from '@/components/themes/theme-provider';
import { cn } from '@/lib/utils';
import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import NextTopLoader from 'nextjs-toploader';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Robotics Club Equipment Tracker',
    template: '%s | Robotics Club Equipment Tracker'
  },
  description:
    'Equipment lending tracker for the university Robotics Club. Track equipment, members, and loans.',
  icons: { icon: '/favicon.svg' }
};

export const viewport: Viewport = {
  themeColor: '#ffffff'
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const savedTheme = cookieStore.get('active_theme')?.value ?? DEFAULT_THEME;

  return (
    <html lang='en' suppressHydrationWarning data-theme={savedTheme}>
      <body
        className={cn(
          'bg-background overflow-x-hidden overscroll-none font-sans antialiased',
          fontVariables
        )}
      >
        <NextTopLoader color='var(--primary)' showSpinner={false} />
        <ThemeProvider
          attribute='class'
          defaultTheme='system'
          enableSystem
          disableTransitionOnChange
          enableColorScheme
        >
          <Providers activeThemeValue={savedTheme}>
            <Toaster />
            {children}
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
