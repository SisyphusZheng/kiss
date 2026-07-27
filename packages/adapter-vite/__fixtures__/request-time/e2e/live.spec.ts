/**
 * Request-time rendering E2E (0.42.0-alpha.1).
 *
 * Proves that renderIntent: { mode: 'dynamic' } routes are rendered per
 * request (not prerendered), that islands hydrate on request-time pages
 * exactly like on static pages, and that static routes are untouched.
 */
import { expect, test } from '@playwright/test';

test.describe('request-time rendering', () => {
  test('GET /live renders loader data per request', async ({ request }) => {
    const first = await request.get('/live?x=42');
    expect(first.ok()).toBe(true);
    const firstHtml = await first.text();
    expect(firstHtml).toContain('x=42');

    const second = await request.get('/live?x=99');
    expect(second.ok()).toBe(true);
    const secondHtml = await second.text();
    expect(secondHtml).toContain('x=99');
    expect(secondHtml).not.toContain('x=42');

    // Per-request proof: the nonce increments between requests, so the two
    // responses cannot both come from a prerendered file.
    const firstNonce = /nonce=(\d+)/.exec(firstHtml)?.[1];
    const secondNonce = /nonce=(\d+)/.exec(secondHtml)?.[1];
    expect(firstNonce).toBeTruthy();
    expect(secondNonce).toBeTruthy();
    expect(Number(secondNonce)).toBeGreaterThan(Number(firstNonce));
  });

  test('counter island hydrates on the request-time page', async ({ page }) => {
    await page.goto('/live?x=42');
    const button = page.locator('live-counter #increment');
    const count = page.locator('live-counter #count');
    await expect(button).toBeVisible();
    await button.click();
    await expect(count).toHaveText('1');
    await button.click();
    await expect(count).toHaveText('2');
  });

  test('GET / serves the prerendered static page', async ({ page, request }) => {
    const response = await request.get('/');
    expect(response.ok()).toBe(true);
    const html = await response.text();
    expect(html).toContain('request-time fixture home');

    await page.goto('/');
    await expect(page.locator('#home-marker')).toHaveText('request-time fixture home');
  });

  test('action route builds and responds to POST', async ({ request }) => {
    const response = await request.post('/form', {
      form: { message: 'hello-action' },
    });
    expect(response.ok()).toBe(true);
    const html = await response.text();
    expect(html).toContain('echo=hello-action');
  });
});
