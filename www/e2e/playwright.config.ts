/**
 * Playwright configuration for openElement E2E tests.
 *
 * Tests run against the built www site (static HTML).
 * Uses a simple HTTP server instead of Vite preview (which may fail
 * in CI due to config resolution issues).
 *
 * Prerequisites:
 *   1. deno task build   (build the www site to www/dist/)
 *
 * Run: deno task test:e2e
 */
import { defineConfig } from '@playwright/test';
import process from 'node:process';

const PORT = Number(process.env.openElement_E2E_PORT ?? 4174);
const baseURL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: '.',
  testMatch: '*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1,
  reporter: 'html',
  timeout: 120_000,

  use: {
    baseURL,
    trace: 'on-first-retry',
  },

  // Auto-start a Deno static file server for www/dist/.
  // Locally, reuse an existing server to avoid failing when a residual Deno
  // process still holds the default port. CI always starts a fresh server.
  webServer: {
    command: `deno run -A static-server.ts --port ${PORT} --dir ../dist`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
    {
      name: 'firefox',
      use: { browserName: 'firefox' },
    },
    {
      name: 'webkit',
      use: { browserName: 'webkit' },
    },
  ],
});
