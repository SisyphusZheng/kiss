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

// These locale pairs were byte-identical when #993 was audited; both locale
// journeys still execute and intentionally compared against one reviewed
// image. That premise is dead: zh translations now ship per-route (a 2026-08
// audit of dist HTML found every formerly-shared route rendering distinct
// zh content — docs ~11%, comparison ~65%), so each locale owns its own
// reviewed baseline. A route whose en/zh renders ever converge again can
// rejoin a shared set deliberately, not by tolerance accident.
//
// /contributing rejoined deliberately (2026-08-23): its copy is English-only
// by design, so en/zh render byte-identically and per-locale baselines are
// pure duplication (the duplicate-baseline gate rejects them).
const sharedLocaleBaselines = new Set<string>([
  'dark-desktop-contributing',
  'dark-mobile-contributing',
  'light-desktop-contributing',
  'light-mobile-contributing',
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
