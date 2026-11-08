/**
 * Vitest globalSetup — runs once before all tests in a single Node process.
 *
 * Strategy: use a separate SQLite file (prisma/test.db) so tests never touch
 * the dev database. We run `prisma migrate deploy` against it to apply all
 * existing migrations, then let each test file seed and clean its own data.
 *
 * DATABASE_URL is set to file:./prisma/test.db in vitest.config.mts so Prisma
 * picks up the test database during tests.
 */
import { execSync } from 'child_process';
import { existsSync, unlinkSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const BUN_EXE = 'C:\\Users\\User\\.bun\\bin\\bun.exe';

// Resolve project root: src/__tests__/setup/global-setup.ts → up 4 levels
const ROOT = resolve(fileURLToPath(import.meta.url), '../../../..');

export async function setup(): Promise<void> {
  const TEST_DB_URL = 'file:./prisma/test.db';

  // Remove stale test DB so migrations start fresh
  const testDb = resolve(ROOT, 'prisma', 'test.db');
  const testDbJournal = testDb + '-journal';
  if (existsSync(testDb)) unlinkSync(testDb);
  if (existsSync(testDbJournal)) unlinkSync(testDbJournal);

  // Apply all existing migrations to the fresh test DB
  execSync(`"${BUN_EXE}" run prisma migrate deploy`, {
    cwd: ROOT,
    env: { ...process.env, DATABASE_URL: TEST_DB_URL },
    stdio: 'pipe'
  });
}

export async function teardown(): Promise<void> {
  // Leave test.db in place for local inspection; it is gitignored
}
