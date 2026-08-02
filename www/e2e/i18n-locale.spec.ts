/**
 * E2E: Internationalization (i18n)
 *
 * Verifies that the i18n system works correctly:
 *   - Default locale (en) pages are accessible at root
 *   - The default English locale uses canonical unprefixed routes
 *   - Chinese locale pages are accessible at /zh/
 *   - Locale switcher works
 *   - Pages have correct lang attribute per locale
 */

import { expect, type Page, test } from '@playwright/test';
import { deepQuery, deepQueryAll } from './helpers.js';

async function readDeepLayoutState(page: Page) {
  const layout = await deepQuery(page, 'open-layout');
  const layoutState = await layout?.evaluate((el) => {
    const switchLink = el.shadowRoot?.querySelector('.lang-switch');
    return {
      layoutLocale: el.getAttribute('locale'),
      switchHref: switchLink?.getAttribute('href'),
      switchText: switchLink?.textContent?.trim(),
    };
  });
  return {
    htmlLang: await page.evaluate(() => document.documentElement.lang),
    layoutLocale: layoutState?.layoutLocale,
    switchHref: layoutState?.switchHref,
    switchText: layoutState?.switchText,
    title: await page.title(),
  };
}

test.describe('Locale Routes', () => {
  test('default root loads English locale', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    expect(await page.getAttribute('html', 'lang')).toBe('en');
  });

  test('canonical guide route loads the default English locale', async ({ page }) => {
    await page.goto('/guide/getting-started');
    await page.waitForLoadState('networkidle');

    const lang = await page.getAttribute('html', 'lang');
    expect(lang).toBe('en');
  });

  test('/zh/ loads Chinese locale', async ({ page }) => {
    await page.goto('/zh/');
    await page.waitForLoadState('networkidle');

    const lang = await page.getAttribute('html', 'lang');
    expect(lang).toBe('zh');
  });

  test('canonical English guide page loads correctly', async ({ page }) => {
    await page.goto('/guide/getting-started');
    await page.waitForLoadState('networkidle');

    const lang = await page.getAttribute('html', 'lang');
    expect(lang).toBe('en');

    const title = await page.title();
    expect(title).toBeTruthy();
  });

  test('zh guide page loads correctly', async ({ page }) => {
    await page.goto('/zh/guide/getting-started');
    await page.waitForLoadState('networkidle');

    const lang = await page.getAttribute('html', 'lang');
    expect(lang).toBe('zh');

    // The guide tsx routes are the single source of truth for both locales;
    // the zh render must contain real Chinese copy, not the English fallback.
    await expect(page.locator('open-reading-shell').locator('h1')).toContainText('快速开始');
    await expect(page.locator('guide-getting-started-page')).toContainText('安装');
  });
});

test.describe('Locale Switcher', () => {
  test('open-layout has locale attribute', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const state = await readDeepLayoutState(page);
    expect(state.layoutLocale).toMatch(/^(en|zh)$/);
  });

  test('open-layout supports locale switching via locales attribute', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const state = await readDeepLayoutState(page);
    expect(state.layoutLocale).toMatch(/^(en|zh)$/);
    expect(state.switchHref).toBeTruthy();
  });

  test('switching locale via URL changes page language', async ({ page }) => {
    // Start on Chinese page
    await page.goto('/zh/guide/getting-started');
    await page.waitForLoadState('networkidle');
    const zhLang = await page.getAttribute('html', 'lang');
    expect(zhLang).toBe('zh');

    // Navigate to English version
    await page.goto('/guide/getting-started');
    await page.waitForLoadState('networkidle');
    const enLang = await page.getAttribute('html', 'lang');
    expect(enLang).toBe('en');
  });

  test('native locale switch updates document and layout state', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const before = await readDeepLayoutState(page);

    const layout = await deepQuery(page, 'open-layout');
    await layout?.evaluate((el) => {
      const link = el.shadowRoot?.querySelector('.lang-switch') as HTMLAnchorElement | null;
      link?.click();
    });
    await page.waitForURL(/\/zh\/?$/);
    await expect.poll(async () => {
      const lang = await page.evaluate(() => document.documentElement.lang);
      const current = await deepQuery(page, 'open-layout');
      const locale = await current?.evaluate((el) => el.getAttribute('locale'));
      return lang === 'zh' && locale === 'zh';
    }).toBe(true);
    const after = await readDeepLayoutState(page);

    expect(after.htmlLang).toBe('zh');
    expect(after.layoutLocale).toBe('zh');
    expect(before.switchHref).toMatch(/\/zh\/?$/);
    expect(after.title).toBeTruthy();
  });
});

test.describe('i18n SSG Output', () => {
  test('both locale versions of blog exist', async ({ page }) => {
    // Check Chinese blog
    const zhRes = await page.goto('/zh/blog');
    expect(zhRes?.ok()).toBe(true);

    // Check English blog
    const enRes = await page.goto('/blog');
    expect(enRes?.ok()).toBe(true);
  });

  test('English blog post pages contain no /zh/ links', async ({ page }) => {
    const res = await page.goto('/blog/0001-keep-hono-vite-dev-server');
    expect(res?.status()).toBeLessThan(400);
    await page.waitForLoadState('networkidle');

    const links = await deepQueryAll(page, 'a[href]');
    const hrefs = await Promise.all(links.map((link) => link.getAttribute('href')));
    // The header language switcher legitimately links to the zh locale;
    // the regression was post content/navigation linking into /zh/blog.
    const zhHrefs = hrefs.filter((href) => href?.startsWith('/zh/blog'));
    expect(zhHrefs).toEqual([]);
  });

  test('both locale versions of changelog exist', async ({ page }) => {
    const zhRes = await page.goto('/zh/changelog');
    expect(zhRes?.ok()).toBe(true);

    const enRes = await page.goto('/changelog');
    expect(enRes?.ok()).toBe(true);
  });

  test('both locale versions of roadmap exist', async ({ page }) => {
    const zhRes = await page.goto('/zh/roadmap');
    expect(zhRes?.ok()).toBe(true);

    const enRes = await page.goto('/roadmap');
    expect(enRes?.ok()).toBe(true);
  });
});
