import { expect, test } from '@playwright/test';

const currentRoutes = [
  '/',
  '/docs',
  '/apilist',
  '/roadmap',
  '/changelog',
  '/contributing',
  '/404',
  '/blog',
  '/blog/0001-keep-hono-vite-dev-server',
  '/architecture/architecture',
  '/architecture/dsd',
  '/architecture/islands',
  '/architecture/islands-deep',
  '/architecture/design-system',
  '/architecture/comparison',
  '/architecture/package-compatibility',
  '/architecture/standards-registry',
  '/architecture/benchmark',
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

const viewports = [
  { name: 'desktop', width: 1440, height: 960 },
  { name: 'mobile', width: 390, height: 844 },
] as const;

for (const locale of ['en', 'zh'] as const) {
  for (const theme of ['dark', 'light'] as const) {
    for (const viewport of viewports) {
      test(`${locale} ${theme} ${viewport.name} current surface`, async ({ page, browserName }) => {
        test.skip(browserName !== 'chromium', 'Chromium owns the committed visual baseline.');
        await page.setViewportSize(viewport);
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.addInitScript((value) => localStorage.setItem('open-theme', value), theme);
        for (const route of currentRoutes) {
          const localized = route === '/' ? `/${locale}/` : `/${locale}${route}`;
          await page.goto(localized, { waitUntil: 'networkidle' });
          await expect(page.locator('open-layout')).toBeVisible();
          await expect(page).toHaveScreenshot(
            `${locale}-${theme}-${viewport.name}-${
              route === '/' ? 'home' : route.slice(1).replaceAll('/', '-')
            }.png`,
            {
              fullPage: false,
              animations: 'disabled',
              caret: 'hide',
            },
          );
        }
      });
    }
  }
}
