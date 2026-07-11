/**
 * E2E: Internationalization (i18n)
 *
 * Verifies that the i18n system works correctly:
 *   - Default locale (zh) pages are accessible at root
 *   - English locale pages are accessible at /en/
 *   - Chinese locale pages are accessible at /zh/
 *   - Locale switcher works
 *   - Pages have correct lang attribute per locale
 */

import { expect, type Page, test } from '@playwright/test';

async function readDeepLayoutState(page: Page) {
  return await page.evaluate(() => {
    const visit = (root: Document | ShadowRoot | Element): Element | null => {
      const direct = root.querySelector?.('open-layout');
      if (direct) return direct;
      const all = root.querySelectorAll?.('*') ?? [];
      for (const el of Array.from(all)) {
        if (el.shadowRoot) {
          const found = visit(el.shadowRoot);
          if (found) return found;
        }
      }
      return null;
    };
    const layout = visit(document);
    const switchLink = layout?.shadowRoot?.querySelector('.lang-switch');
    return {
      htmlLang: document.documentElement.lang,
      layoutLocale: layout?.getAttribute('locale'),
      switchHref: switchLink?.getAttribute('href'),
      switchText: switchLink?.textContent?.trim(),
      title: document.title,
    };
  });
}

test.describe('Locale Routes', () => {
  test('default root loads Chinese locale', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Root should serve zh locale (default)
    const bodyText = await page.textContent('body');
    // The Chinese homepage should have Chinese text
    expect(bodyText).toBeTruthy();
  });

  test('/en/ loads English locale', async ({ page }) => {
    await page.goto('/en/');
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

  test('en guide page loads correctly', async ({ page }) => {
    await page.goto('/en/guide/getting-started');
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
    await page.goto('/en/guide/getting-started');
    await page.waitForLoadState('networkidle');
    const enLang = await page.getAttribute('html', 'lang');
    expect(enLang).toBe('en');
  });

  test('native locale switch updates document and layout state', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const before = await readDeepLayoutState(page);

    await page.evaluate(() => {
      const visit = (root: Document | ShadowRoot | Element): Element | null => {
        const direct = root.querySelector?.('open-layout');
        if (direct) return direct;
        const all = root.querySelectorAll?.('*') ?? [];
        for (const el of Array.from(all)) {
          if (el.shadowRoot) {
            const found = visit(el.shadowRoot);
            if (found) return found;
          }
        }
        return null;
      };
      const layout = visit(document);
      const link = layout?.shadowRoot?.querySelector('.lang-switch') as HTMLAnchorElement | null;
      link?.click();
    });
    await page.waitForURL(/\/zh\/?$/);
    await page.waitForFunction(() => {
      const visit = (root: Document | ShadowRoot | Element): Element | null => {
        const direct = root.querySelector?.('open-layout');
        if (direct) return direct;
        const all = root.querySelectorAll?.('*') ?? [];
        for (const el of Array.from(all)) {
          if (el.shadowRoot) {
            const found = visit(el.shadowRoot);
            if (found) return found;
          }
        }
        return null;
      };
      const layout = visit(document);
      return document.documentElement.lang === 'zh' &&
        layout?.getAttribute('locale') === 'zh';
    });
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
    const zhRes = await page.goto('/blog');
    expect(zhRes?.ok()).toBe(true);

    // Check English blog
    const enRes = await page.goto('/en/blog');
    expect(enRes?.ok()).toBe(true);
  });

  test('both locale versions of changelog exist', async ({ page }) => {
    const zhRes = await page.goto('/changelog');
    expect(zhRes?.ok()).toBe(true);

    const enRes = await page.goto('/en/changelog');
    expect(enRes?.ok()).toBe(true);
  });

  test('both locale versions of roadmap exist', async ({ page }) => {
    const zhRes = await page.goto('/roadmap');
    expect(zhRes?.ok()).toBe(true);

    const enRes = await page.goto('/en/roadmap');
    expect(enRes?.ok()).toBe(true);
  });
});
