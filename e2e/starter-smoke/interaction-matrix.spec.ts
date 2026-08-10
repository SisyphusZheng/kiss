/**
 * Client-side interaction matrix for the starter surface (#936).
 *
 * The starter's own routes (contact form loop, counter island, in-app nav)
 * exercised the way a user would. Tests 1-2 are the #937/#938 repros and
 * were RED against the published alpha.15 stack; Wave 1 turns them green.
 */
import { expect, test } from '@playwright/test';

test.describe('form loop', () => {
  // #937/#938 repros — RED on the published alpha.15 stack. Wave 1 turns
  // these green by removing the test.fixme() marks.
  test('enhanced submit morphs #thanks without a full reload (#937)', async ({ page }) => {
    await page.goto('/contact');
    await page.evaluate(() => {
      (window as unknown as { __morphDoc?: number }).__morphDoc = 1;
    });
    await page.getByPlaceholder('you@example.com').fill('ada@example.com');
    await page.getByRole('button', { name: 'Subscribe' }).click();
    await expect(page.locator('#thanks')).toBeVisible({ timeout: 10_000 });
    const marker = await page.evaluate(
      () => (window as unknown as { __morphDoc?: number }).__morphDoc,
    );
    expect(marker).toBe(1);
  });

  test('validation failure morphs #error without a full reload (#937)', async ({ page }) => {
    await page.goto('/contact');
    await page.evaluate(() => {
      (window as unknown as { __morphDoc2?: number }).__morphDoc2 = 1;
    });
    await page.getByPlaceholder('you@example.com').fill('not-an-email');
    await page.getByRole('button', { name: 'Subscribe' }).click();
    await expect(page.locator('#error')).toBeVisible({ timeout: 10_000 });
    const marker = await page.evaluate(
      () => (window as unknown as { __morphDoc2?: number }).__morphDoc2,
    );
    expect(marker).toBe(1);
  });

  test('no-JS native POST is accepted, PRG lands on #thanks (#938)', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/contact');
    await page.getByPlaceholder('you@example.com').fill('grace@example.com');
    await page.getByRole('button', { name: 'Subscribe' }).click();
    await expect(page).toHaveURL(/subscribed=grace%40example\.com/);
    await expect(page.locator('#thanks')).toBeVisible();
    await context.close();
  });
});

test.describe('hydration timing', () => {
  test.skip('click before idle hydration is not lost (capture/replay eval #942)', async ({ page }) => {
    await page.goto('/');
    const counter = page.locator('my-counter');
    // Fire the click before the idle callback has a chance to run.
    await page.evaluate(async () => {
      const el = document.querySelector('my-counter')!;
      el.shadowRoot!.querySelectorAll('button')[1].click();
      await new Promise((r) => setTimeout(r, 100));
    });
    await expect(counter.locator('[data-signal="count"]')).toHaveText('1');
  });
});

test.describe('navigation', () => {
  test.fixme('island state survives back/forward (bfcache, #943)', async ({ page }) => {
    await page.goto('/');
    await page.locator('my-counter').getByRole('button', { name: '+' }).click();
    await expect(page.locator('my-counter [data-signal="count"]')).toHaveText('1');
    await page.goto('/blog');
    await page.goBack();
    await page.waitForLoadState('load');
    await expect(page.locator('my-counter [data-signal="count"]')).toHaveText('1');
    await page.locator('my-counter').getByRole('button', { name: '+' }).click();
    await expect(page.locator('my-counter [data-signal="count"]')).toHaveText('2');
  });

  test.fixme('scroll position is restored on back navigation (#943)', async ({ page }) => {
    await page.goto('/blog');
    await page.evaluate(() => globalThis.scrollTo(0, 600));
    await page.waitForTimeout(300);
    await page.goto('/');
    await page.goBack();
    await page.waitForLoadState('load');
    const y = await page.evaluate(() => globalThis.scrollY);
    expect(y).toBeGreaterThan(400);
  });
});
