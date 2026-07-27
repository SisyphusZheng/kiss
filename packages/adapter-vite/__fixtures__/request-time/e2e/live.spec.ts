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

test.describe('action protocol (ADR-0120, 0.42.0-alpha.2)', () => {
  test('validation failure returns 422 with the echo (no JS needed)', async ({ request }) => {
    const response = await request.post('/form', { form: { message: '  ' } });
    expect(response.status()).toBe(422);
    const html = await response.text();
    expect(html).toContain('message is required');
  });

  test('valid submission is a 303 PRG redirect, never a 200 render', async ({ request }) => {
    const response = await request.post('/form', {
      form: { message: 'hello-action' },
      maxRedirects: 0,
    });
    expect(response.status()).toBe(303);
    expect(response.headers()['location']).toBe('/form?echoed=hello-action');
  });

  test('named action via formaction dispatches to ?/shout', async ({ request }) => {
    const response = await request.post('/form?/shout', {
      form: { message: 'hi there' },
      maxRedirects: 0,
    });
    expect(response.status()).toBe(303);
    expect(response.headers()['location']).toBe('/live?x=HI%20THERE');
  });

  test('unknown named action is a defined 404', async ({ request }) => {
    const response = await request.post('/form?/nope', { form: { message: 'x' } });
    expect(response.status()).toBe(404);
  });

  test('fetch callers receive the ActionResult union', async ({ request }) => {
    const failure = await request.post('/form', {
      form: { message: '' },
      headers: { 'x-openelement-action': 'true' },
    });
    expect(failure.status()).toBe(422);
    expect(await failure.json()).toEqual({
      type: 'failure',
      status: 422,
      data: { error: 'message is required', message: '' },
    });

    const success = await request.post('/form', {
      form: { message: 'hello' },
      headers: { 'x-openelement-action': 'true' },
      maxRedirects: 0,
    });
    const body = await success.json();
    expect(body.type).toBe('redirect');
    expect(body.location).toBe('/form?echoed=hello');
  });

  test('full form loop works with JavaScript disabled', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/form');
    await page.fill('#message', 'no-js-works');
    await page.click('#submit');
    await page.waitForURL('**/form?echoed=no-js-works');
    await expect(page.locator('#echo')).toHaveText('echo=no-js-works');

    await page.goto('/form');
    await page.click('#submit');
    await expect(page.locator('#error')).toHaveText('message is required');
    await context.close();
  });

  test('enhanced submit follows the ActionResult redirect without a native POST', async ({ page }) => {
    await page.goto('/form');
    await page.fill('#message', 'enhanced-path');
    await page.click('#submit');
    await page.waitForURL('**/form?echoed=enhanced-path');
    await expect(page.locator('#echo')).toHaveText('echo=enhanced-path');
  });
});
