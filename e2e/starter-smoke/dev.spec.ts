/**
 * Dev-mode smoke (#951) — runs against `deno task dev` (vite dev server),
 * not the production build:
 *
 * #951: dev used to 500 on /client/islands/client.js (the URL was treated as
 * a file path), so islands never hydrated in dev. The dev server now serves
 * the generated client entry at that URL and the SSR entry injects the
 * matching <script> tag.
 *
 * Prerequisites:
 *   deno run -A e2e/starter-smoke/setup.ts
 *
 * Run: deno task test:starter-smoke:dev
 */
import { expect, test } from '@playwright/test';

test('dev serves the island client entry (#951)', async ({ request }) => {
  const response = await request.get('/client/islands/client.js');
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('javascript');
  const body = await response.text();
  expect(body).toContain('createIslandScheduler');
  expect(body).toContain('my-counter');
});

test('dev island hydrates and handles clicks (#951)', async ({ page }) => {
  await page.goto('/');
  // The island script tag must be in the dev HTML and the module must load:
  // my-counter hydrates on idle, so wait for the definition first.
  await page.waitForFunction(() => Boolean(globalThis.customElements.get('my-counter')));
  const counter = page.locator('my-counter');
  await expect(counter.locator('[data-signal="count"]')).toHaveText('0');
  await counter.getByRole('button', { name: '+' }).click();
  await expect(counter.locator('[data-signal="count"]')).toHaveText('1');
});
