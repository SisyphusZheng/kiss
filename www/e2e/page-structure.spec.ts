import { expect, test } from '@playwright/test';

const readingRoutes = [
  '/guide/getting-started',
  '/guide/routing-and-data',
  '/architecture/dsd',
  '/architecture/islands-deep',
  '/architecture/package-compatibility',
  '/contributing',
];

const guideRoutes = [
  '/guide/getting-started',
  '/guide/core-concepts',
  '/guide/architecture',
  '/guide/comparison',
  '/guide/routing-and-data',
  '/guide/mdx',
  '/guide/api',
  '/guide/configuration',
  '/guide/error-handling',
  '/guide/islands-and-ssr',
  '/guide/deployment',
  '/guide/testing',
];

const architectureRoutes = [
  '/architecture/dsd',
  '/architecture/comparison',
  '/architecture/islands',
  '/architecture/islands-deep',
  '/architecture/package-compatibility',
  '/architecture/benchmark',
  '/architecture/standards-registry',
];

test.describe('Unified page structure', () => {
  for (const route of readingRoutes) {
    test(`${route} uses the WWW reading shell`, async ({ page }) => {
      await page.goto(route);
      await expect(page.locator('open-reading-shell')).toHaveCount(1);
      await expect(page.locator('open-reading-shell').locator('h1')).toBeVisible();
    });
  }

  for (const route of [...guideRoutes, ...architectureRoutes]) {
    test(`${route} has a railed, keyboard-readable section outline`, async ({ page }) => {
      await page.goto(route);
      const rail = page.locator('open-reading-shell[rail] open-page-rail');
      await expect(rail).toHaveCount(1);
      await expect(rail).toBeVisible();
      await page.waitForTimeout(50);
      expect(await rail.locator('a').count()).toBeGreaterThan(0);
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
    await expect(page.locator('open-page-hero[variant="error"]')).toHaveCount(1);
  });

  test('entry pages use the shared hero and inspectable artifact panel', async ({ page }) => {
    for (
      const route of [
        '/docs',
        '/apilist',
        '/roadmap',
        '/blog',
        '/contributing',
        '/architecture/architecture',
        '/architecture/design-system',
      ]
    ) {
      await page.goto(route);
      await expect(page.locator('open-page-hero')).toHaveCount(1);
      await expect(page.locator('open-artifact-panel')).toHaveCount(1);
    }
  });
});
