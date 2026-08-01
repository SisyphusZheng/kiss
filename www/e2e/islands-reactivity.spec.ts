/**
 * E2E: Island Reactivity
 *
 * Verifies that currently rendered island components are available without
 * fixed sleeps. The homepage no longer renders the historical home-console island, so
 * this suite follows the current layout shell instead:
 *   - open-layout owns a native Declarative Shadow DOM root
 *   - layout header islands are present inside the shell
 *   - island client script is present
 */

import { expect, type Page, test } from '@playwright/test';

async function waitForLayoutReady(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const layout = document.querySelector('open-layout');
    return !!layout?.shadowRoot;
  });
}

test.describe('Layout Island Shell', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('layout element exists in DOM', async ({ page }) => {
    await expect(page.locator('open-layout')).toHaveCount(1);
  });

  test('layout has a native shadow root', async ({ page }) => {
    await waitForLayoutReady(page);

    const hasShadowRoot = await page.evaluate(() => {
      const layout = document.querySelector('open-layout');
      return layout?.shadowRoot !== null;
    });
    expect(hasShadowRoot).toBe(true);
  });

  test('layout header islands are rendered inside the static shell', async ({ page }) => {
    await waitForLayoutReady(page);

    const headerIslands = await page.locator('open-layout').evaluate((layout) => {
      const root = layout.shadowRoot;
      return {
        search: !!root?.querySelector('open-search'),
        themeToggle: !!root?.querySelector('open-theme-toggle'),
        brand: !!root?.querySelector('.logo-glyph'),
      };
    });

    expect(headerIslands).toEqual({
      search: true,
      themeToggle: true,
      brand: true,
    });
  });
});

test.describe('Island Script Loading', () => {
  test('island client script is loaded', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.waitForFunction(() => {
      const scripts = Array.from(
        document.querySelectorAll<HTMLScriptElement>('script[type="module"]'),
      );
      return scripts.some((s) => s.src?.includes('client') || s.src?.includes('island'));
    });

    const loaded = await page.evaluate(() => {
      const scripts = Array.from(
        document.querySelectorAll<HTMLScriptElement>('script[type="module"]'),
      );
      return scripts.some((s) => s.src?.includes('client') || s.src?.includes('island'));
    });
    expect(loaded).toBe(true);
  });

  test('component shadow roots remain available after island load', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await waitForLayoutReady(page);

    const upgradedCount = await page.evaluate(() => {
      let count = 0;
      const all = document.querySelectorAll('*');
      for (const el of all) {
        if (el.shadowRoot) count++;
      }
      return count;
    });
    expect(upgradedCount).toBeGreaterThan(0);
  });
});
