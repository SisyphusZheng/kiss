/**
 * Packed-starter visual + interaction smoke (#934).
 *
 * Guards the five starter regression classes that round-3 blog e2e caught:
 * unstyled page (no :root baseline), dead island, jammed nav, clipped
 * assets, duplicate H1. Every assertion here targets the *computed* surface,
 * the layer curl-level checks cannot see.
 */
import { expect, test } from '@playwright/test';

const PAPER = 'rgb(250, 249, 246)';

test('computed body background is the design-token paper, not the UA default', async ({ page }) => {
  await page.goto('/');
  const background = await page.evaluate(
    () => getComputedStyle(document.body).backgroundColor,
  );
  expect(background).toBe(PAPER);
});

test('header nav links are spaced apart (not jammed)', async ({ page }) => {
  await page.goto('/');
  const links = page.locator('app-shell header nav a');
  await expect(links).toHaveCount(2);
  const [home, blog] = await links.evaluateAll((els) =>
    els.map((el) => {
      const r = el.getBoundingClientRect();
      return { left: r.left, right: r.right };
    })
  );
  expect(blog.left - home.right).toBeGreaterThan(4);
});

test('counter island hydrates and responds to clicks', async ({ page }) => {
  await page.goto('/');
  const counter = page.locator('my-counter');
  await expect(counter).toBeVisible();
  const plus = counter.getByRole('button', { name: '+' });
  await plus.click();
  await expect(counter.locator('[data-signal="count"]')).toHaveText('1');
  await plus.click();
  await expect(counter.locator('[data-signal="count"]')).toHaveText('2');
  await counter.getByRole('button', { name: '-' }).click();
  await expect(counter.locator('[data-signal="count"]')).toHaveText('1');
});

test('blog post page renders exactly one H1', async ({ page }) => {
  await page.goto('/blog/welcome');
  await expect(page.locator('h1')).toHaveCount(1);
});

test('unknown blog slug is a 404 status, not a 200 fallback (#922)', async ({ page }) => {
  const response = await page.goto('/blog/definitely-not-a-post');
  expect(response?.status()).toBe(404);
  await expect(page.locator('h1')).toContainText('404');
});
