import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  // Override Vite's CSS handling to prevent PostCSS/Tailwind from loading
  // during tests — these are pure Node.js service layer tests with no CSS
  css: {
    postcss: {
      plugins: []
    }
  },
  test: {
    // globalSetup runs once before all test files — applies migrations to the test DB
    globalSetup: './src/__tests__/setup/global-setup.ts',
    // setupFiles run before each test file — resets tables
    setupFiles: ['./src/__tests__/setup/setup-per-file.ts'],
    include: ['src/__tests__/**/*.test.ts'],
    environment: 'node',
    testTimeout: 30000,
    // Run test files sequentially to avoid DB contention on a single SQLite file
    fileParallelism: false,
    env: {
      DATABASE_URL: 'file:./prisma/test.db',
      APP_TIMEZONE: 'Asia/Dhaka',
      LOAN_DEFAULT_DAYS: '7',
      MEMBER_LOAN_WARN_LIMIT: '5',
      AUTH_SECRET: 'test-secret-for-vitest-only',
      NODE_ENV: 'test'
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src')
    }
  }
});
