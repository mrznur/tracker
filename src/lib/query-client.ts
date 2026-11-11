import { QueryClient } from '@tanstack/react-query';

// One client per browser session, new client on every server request
let browserQueryClient: QueryClient | undefined;

export function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server — always create fresh
    return new QueryClient({ defaultOptions: { queries: { staleTime: 60_000 } } });
  }
  // Browser — reuse the same client
  if (!browserQueryClient) {
    browserQueryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 60_000 } } });
  }
  return browserQueryClient;
}
