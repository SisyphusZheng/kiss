/**
 * Playwright configuration for the request-time rendering fixture.
 *
 * Tests run against the built fixture app (packages/adapter-vite/__fixtures__/
 * request-time/dist), served by e2e/server.ts: static files from disk,
 * renderIntent 'dynamic' routes delegated to dist/server/index.js.
 *
 * Prerequisites:
 *   deno task fixture:request-time:build
 *
 * Run: deno task fixture:request-time:e2e
 */
import { defineConfig } from '@playwright/test';
import process from 'node:process';

const PORT = Number(process.env.REQUEST_TIME_E2E_PORT ?? 4180);
const baseURL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: '.',
  testMatch: '*.spec.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1,
  reporter: 'list',
  timeout: 60_000,

  use: {
    baseURL,
    trace: 'on-first-retry',
  },

  webServer: {
    // `exec` prevents the shell Playwright launches from orphaning Deno when
    // the suite finishes or is interrupted.
    command:
      `exec deno run --config ../../../../deno.json -A server.ts --port ${PORT} --dir ../dist`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 60_000,
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
