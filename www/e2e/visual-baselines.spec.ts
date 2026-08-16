import { expect, test } from '@playwright/test';
import process from 'node:process';

// Pixel baselines are authored and reviewed on a stable workstation image.
// Linux CI still runs the complete semantic/functional E2E suite, but does not
// compare macOS font rasterization artifacts. Release and intentional visual
// review invoke this suite explicitly with OPEN_VISUAL_REGRESSION=1.
test.skip(
  !!process.env.CI && process.env.OPEN_VISUAL_REGRESSION !== '1',
  'Pixel baselines are an explicit visual-review gate, not a cross-OS push gate.',
);

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

// These locale pairs were byte-identical when #993 was audited. Both locale
// journeys still execute; they intentionally compare against one reviewed
// image so a future layout difference in either language fails the same gate.
const sharedLocaleBaselines = new Set([
  'dark-desktop-404',
  'dark-desktop-apilist',
  'dark-desktop-architecture-architecture',
  'dark-desktop-architecture-benchmark',
  'dark-desktop-architecture-comparison',
  'dark-desktop-architecture-design-system',
  'dark-desktop-architecture-dsd',
  'dark-desktop-architecture-islands',
  'dark-desktop-architecture-islands-deep',
  'dark-desktop-architecture-package-compatibility',
  'dark-desktop-architecture-standards-registry',
  'dark-desktop-blog-0001-keep-hono-vite-dev-server',
  'dark-desktop-changelog',
  'dark-desktop-contributing',
  'dark-desktop-docs',
  'dark-mobile-404',
  'dark-mobile-architecture-dsd',
  'dark-mobile-architecture-islands',
  'dark-mobile-architecture-islands-deep',
  'dark-mobile-architecture-package-compatibility',
  'dark-mobile-blog-0001-keep-hono-vite-dev-server',
  'dark-mobile-contributing',
  'dark-mobile-docs',
  'light-desktop-404',
  'light-desktop-apilist',
  'light-desktop-architecture-architecture',
  'light-desktop-architecture-benchmark',
  'light-desktop-architecture-comparison',
  'light-desktop-architecture-design-system',
  'light-desktop-architecture-dsd',
  'light-desktop-architecture-islands',
  'light-desktop-architecture-islands-deep',
  'light-desktop-architecture-package-compatibility',
  'light-desktop-architecture-standards-registry',
  'light-desktop-blog-0001-keep-hono-vite-dev-server',
  'light-desktop-changelog',
  'light-desktop-contributing',
  'light-desktop-docs',
  'light-mobile-architecture-islands',
  'light-mobile-architecture-islands-deep',
  'light-mobile-blog-0001-keep-hono-vite-dev-server',
  'light-mobile-contributing',
  'light-mobile-docs',
]);

for (const locale of ['en', 'zh'] as const) {
  for (const theme of ['dark', 'light'] as const) {
    for (const viewport of viewports) {
      test(`${locale} ${theme} ${viewport.name} current surface`, async ({ page, browserName }) => {
        test.skip(browserName !== 'chromium', 'Chromium owns the committed visual baseline.');
        await page.setViewportSize(viewport);
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.addInitScript((value) => localStorage.setItem('open-theme', value), theme);
        for (const route of currentRoutes) {
          const localized = locale === 'en'
            ? route
            : route === '/'
            ? `/${locale}/`
            : `/${locale}${route}`;
          await page.goto(localized, { waitUntil: 'networkidle' });
          await expect(page.locator('open-layout')).toBeVisible();
          await expect(page.locator('html')).toHaveAttribute('lang', locale);
          await expect(page.locator('open-layout')).toHaveAttribute('locale', locale);
          const routeName = route === '/' ? 'home' : route.slice(1).replaceAll('/', '-');
          const baselineKey = `${theme}-${viewport.name}-${routeName}`;
          const baselineLocale = sharedLocaleBaselines.has(baselineKey) ? 'shared' : locale;
          await expect(page).toHaveScreenshot(
            `${baselineLocale}-${baselineKey}.png`,
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
