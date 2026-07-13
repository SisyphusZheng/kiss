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
      await expect(page.locator('h1')).toBeVisible();
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
      await expect(page.locator('open-page-hero open-artifact-panel')).toHaveCount(1);
    }
  });

  test('entry pages compose their body with shared section frames', async ({ page }) => {
    for (
      const route of [
        '/docs',
        '/apilist',
        '/roadmap',
        '/architecture/architecture',
        '/architecture/design-system',
      ]
    ) {
      await page.goto(route);
      expect(await page.locator('open-section-frame').count()).toBeGreaterThan(0);
    }
  });

  test('blog articles SSR their outline and deterministic navigation without mojibake', async ({ page }) => {
    await page.goto('/zh/blog/0001-keep-hono-vite-dev-server');
    const rail = page.locator('open-page-rail');
    await expect(rail).toBeVisible();
    expect(await rail.locator('a[href^="#"]').count()).toBeGreaterThan(0);
    await expect(page.locator('body')).not.toContainText(/鏂|鈫|鍗|杩|鏈/);
    await expect(page.locator('open-reading-shell').locator('nav[aria-label="Page navigation"]'))
      .toBeVisible();
  });

  test('mobile rail is a native details drawer', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/guide/getting-started');
    const details = page.locator('open-page-rail details');
    await expect(details).toBeVisible();
    await expect(details).not.toHaveAttribute('open', '');
    await details.locator('summary').click();
    await expect(details).toHaveAttribute('open', '');
  });

  test('reading information remains complete without IntersectionObserver or View Transitions', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, 'IntersectionObserver', {
        value: undefined,
        configurable: true,
      });
      Object.defineProperty(document, 'startViewTransition', {
        value: undefined,
        configurable: true,
      });
    });
    await page.goto('/guide/core-concepts');
    await expect(page.locator('open-reading-shell').locator('h1')).toContainText('Core Concepts');
    expect(await page.locator('open-page-rail a').count()).toBe(3);
  });

  test('non-home routes never load the WebGL atmosphere layer', async ({ page }) => {
    for (
      const route of [
        '/docs',
        '/apilist',
        '/roadmap',
        '/architecture/dsd',
        '/guide/getting-started',
        '/blog',
        '/changelog',
        '/404',
      ]
    ) {
      await page.goto(route);
      await expect(page.locator('open-cinematic-atmosphere')).toHaveCount(0);
    }
  });

  test('reading shell remains usable at 200 percent zoom', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/guide/getting-started');
    await page.evaluate(() => {
      document.documentElement.style.zoom = '2';
    });
    await expect(page.locator('open-reading-shell').locator('h1')).toBeVisible();
    await expect(page.locator('open-page-rail')).toBeVisible();
  });
});
