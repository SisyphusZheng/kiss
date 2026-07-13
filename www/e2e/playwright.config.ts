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

// This value must be derived once for both the web server and every worker.
// Deriving it from process.pid makes the workers navigate to different ports.
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
  // Callers that need parallel isolation can pass openElement_E2E_PORT.  A
  // deterministic default keeps the server and all workers on the same URL.
  webServer: {
    // `exec` prevents the shell Playwright launches from orphaning Deno when
    // the suite finishes or is interrupted.
    command: `exec deno run -A static-server.ts --port ${PORT} --dir ../dist`,
    url: baseURL,
    reuseExistingServer: false,
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
