/**
 * Playwright configuration for the @openelement/ui dogfood qualification
 * fixture (#1226, v0.44 Beta.2).
 *
 * Tests run against the built fixture app
 * (packages/adapter-vite/__fixtures__/ui-dogfood/dist), served statically by
 * e2e/server.ts.
 *
 * Prerequisites:
 *   deno task fixture:ui-dogfood:build
 *
 * Run: deno task fixture:ui-dogfood:e2e
 */
import { defineConfig } from '@playwright/test';
import process from 'node:process';

const PORT = Number(process.env.UI_DOGFOOD_E2E_PORT ?? 4197);
const baseURL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: '.',
  testMatch: '*.spec.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
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
      `exec deno run --config ../../../../../deno.json -A server.ts --port ${PORT} --dir ../dist`,
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
