import { expect, test } from '@playwright/test';

const readingRoutes = [
  '/guide/getting-started',
  '/guide/routing-and-data',
  '/architecture/dsd',
  '/architecture/islands-deep',
  '/architecture/package-compatibility',
  '/contributing',
];

test.describe('Unified page structure', () => {
  for (const route of readingRoutes) {
    test(`${route} uses the WWW reading shell`, async ({ page }) => {
      await page.goto(route);
      await expect(page.locator('open-reading-shell')).toHaveCount(1);
      await expect(page.locator('open-reading-shell').locator('h1')).toBeVisible();
    });
  }

  test('changelog carries a timeline hero and a railed reading surface', async ({ page }) => {
    await page.goto('/changelog');
    await expect(page.locator('open-page-hero[variant="timeline"]')).toHaveCount(1);
    await expect(page.locator('open-reading-shell[rail]')).toHaveCount(1);
  });

  test('404 remains a compact recovery scene without WebGL', async ({ page }) => {
    await page.goto('/404');
    await expect(page.locator('open-brand-mark').last()).toBeVisible();
    await expect(page.locator('open-cinematic-atmosphere')).toHaveCount(0);
  });
});
