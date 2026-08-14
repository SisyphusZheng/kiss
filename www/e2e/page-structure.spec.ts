import { expect, test } from '@playwright/test';

const readingRoutes = [
  '/guide/getting-started',
  '/guide/routing-and-data',
  '/architecture/dsd',
  '/architecture/islands-deep',
  '/architecture/package-compatibility',
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
  '/guide/migration',
  '/guide/security',
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
      // The rail links render async after the shell upgrades; poll instead
      // of sleeping a fixed interval.
      await expect(rail.locator('a').first()).toBeVisible();
    });
  }

  test('changelog carries a timeline hero and a railed reading surface', async ({ page }) => {
    await page.goto('/changelog');
    await expect(page.locator('open-page-hero[variant="timeline"]')).toHaveCount(1);
    await expect(page.locator('open-reading-shell[rail]')).toHaveCount(1);
  });

  test('404 remains a compact recovery scene without WebGL', async ({ page }) => {
    await page.goto('/404');
    await expect(page.locator('open-cinematic-atmosphere')).toHaveCount(0);
    const scene = page.locator('page-404');
    await expect(scene.locator('h1')).toHaveText('404');
    await expect(scene).toContainText('Lost in the shadow DOM.');
    await expect(scene.locator('open-button[href="/"]')).toHaveCount(1);
    await expect(scene.locator('open-button[href="/docs"]')).toHaveCount(1);
  });

  test('docs landing is a v4 manual index with four entrances', async ({ page }) => {
    await page.goto('/docs');
    await expect(page.locator('page-docs h1')).toContainText('MANUAL.');
    const entrances = page.locator('page-docs .entrance');
    await expect(entrances).toHaveCount(4);
    await expect(entrances.first()).toHaveAttribute('href', '/guide/getting-started');
  });

  test('blog index is a v4 dispatch journal with a featured band', async ({ page }) => {
    await page.goto('/blog');
    await expect(page.locator('blog-index-page h1')).toHaveText('Dispatches.');
    await expect(page.locator('blog-index-page .featured')).toHaveAttribute('href', /\/blog\/.+/);
    expect(await page.locator('blog-index-page .row').count()).toBeGreaterThan(0);
  });

  test('contributing is a v4 lab page with terminal, checklist and help rows', async ({ page }) => {
    await page.goto('/contributing');
    await expect(page.locator('page-contributing h1')).toContainText('BUILD IT');
    await expect(page.locator('page-contributing open-code-block')).toHaveCount(1);
    expect(await page.locator('page-contributing .checklist li').count()).toBeGreaterThan(0);
    expect(await page.locator('page-contributing .help-row').count()).toBe(3);
  });

  test('entry pages use the shared hero and inspectable artifact panel', async ({ page }) => {
    for (
      const route of [
        '/apilist',
        '/roadmap',
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

  test('design-system lab components render non-empty shadow roots', async ({ page }) => {
    await page.goto('/architecture/design-system');
    for (const tag of ['open-lab-stage', 'open-lab-panel', 'open-standards-visual']) {
      const rendered = await page.locator(tag).evaluateAll(
        (els) => els.filter((el) => (el.shadowRoot?.childElementCount ?? 0) > 0).length,
      );
      expect(rendered).toBeGreaterThan(0);
    }
  });

  test('roadmap standards visual renders a non-empty shadow root', async ({ page }) => {
    await page.goto('/roadmap');
    const rendered = await page.locator('open-standards-visual').evaluateAll(
      (els) => els.filter((el) => (el.shadowRoot?.childElementCount ?? 0) > 0).length,
    );
    expect(rendered).toBeGreaterThan(0);
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
