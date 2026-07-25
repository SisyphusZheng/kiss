/**
 * E2E: Theme System
 *
 * Verifies the dark/light theme toggle:
 *   - Theme toggle element is present
 *   - Clicking toggle switches theme
 *   - Theme state is persisted to localStorage
 *   - Initial theme follows prefers-color-scheme when nothing is saved
 *   - data-theme attribute is updated on document
 */

import { expect, type Page, test } from '@playwright/test';

async function clickThemeToggle(page: Page): Promise<void> {
  await page.evaluate(() => {
    const visit = (root: Document | ShadowRoot | Element): Element | null => {
      const direct = root.querySelector?.('open-theme-toggle');
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
    const toggle = visit(document);
    const btn = toggle?.shadowRoot?.querySelector('button') as HTMLButtonElement | null;
    btn?.click();
  });
}

async function waitForThemeChange(page: Page, before: string | null): Promise<void> {
  await page.waitForFunction((prev) => {
    return document.documentElement.getAttribute('data-theme') !== prev;
  }, before);
}

/**
 * Wait for <open-theme-toggle> to be fully upgraded:
 * DSD hydration + _initTheme() must complete before clicks work.
 * We wait for the component to have a data-theme attribute,
 * which is set by _initTheme() during onDsdHydrated().
 *
 * NOTE: <open-theme-toggle> lives inside <open-layout>'s shadow DOM,
 * so we must query through the shadow root to find it.
 */
async function waitForToggleReady(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const visit = (root: Document | ShadowRoot | Element): Element | null => {
      const direct = root.querySelector?.('open-theme-toggle');
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
    return visit(document)?.hasAttribute('data-theme') === true;
  }, { timeout: 10000 });
}

test.describe('Theme Toggle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await waitForToggleReady(page);
  });

  test('theme toggle element exists', async ({ page }) => {
    const exists = await page.evaluate(() => {
      const visit = (root: Document | ShadowRoot | Element): Element | null => {
        const direct = root.querySelector?.('open-theme-toggle');
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
      return visit(document) !== null;
    });
    expect(exists).toBe(true);
  });

  test('theme toggle has shadow root', async ({ page }) => {
    const hasShadowRoot = await page.evaluate(() => {
      const visit = (root: Document | ShadowRoot | Element): Element | null => {
        const direct = root.querySelector?.('open-theme-toggle');
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
      return visit(document)?.shadowRoot !== null;
    });
    expect(hasShadowRoot).toBe(true);
  });

  test('clicking theme toggle changes data-theme on document', async ({ page }) => {
    const themeBefore = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-theme');
    });

    // Click the toggle button via evaluate to guarantee the shadow DOM
    // button is clicked regardless of Playwright's shadow DOM piercing.
    await clickThemeToggle(page);

    await waitForThemeChange(page, themeBefore);
    const themeAfter = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-theme');
    });
    expect(themeAfter).not.toBe(themeBefore);
  });

  test('theme is persisted to localStorage after toggle', async ({ page }) => {
    await clickThemeToggle(page);

    // Check localStorage
    const stored = await page.evaluate(() => {
      return localStorage.getItem('open-theme');
    });
    expect(stored).toMatch(/^(light|dark)$/);
  });

  test('multiple toggles cycle between dark and light', async ({ page }) => {
    const themeBefore = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-theme');
    });

    await clickThemeToggle(page);
    await waitForThemeChange(page, themeBefore);
    const themeAfter1 = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-theme');
    });
    expect(themeAfter1).not.toBe(themeBefore);

    await clickThemeToggle(page);
    await waitForThemeChange(page, themeAfter1);
    const themeAfter2 = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-theme');
    });
    expect(themeAfter2).toBe(themeBefore);
  });

  test('homepage surface colors follow the active theme', async ({ page }) => {
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      globalThis.dispatchEvent(
        new CustomEvent('open:theme-change', {
          detail: { theme: 'dark' },
        }),
      );
    });

    const dark = await page.evaluate(() => {
      return {
        canvas: getComputedStyle(document.body).backgroundImage,
        surface: getComputedStyle(document.body).backgroundColor,
      };
    });

    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
      globalThis.dispatchEvent(
        new CustomEvent('open:theme-change', {
          detail: { theme: 'light' },
        }),
      );
    });

    const light = await page.evaluate(() => {
      return {
        canvas: getComputedStyle(document.body).backgroundImage,
        surface: getComputedStyle(document.body).backgroundColor,
      };
    });

    expect(dark.canvas).not.toBe(light.canvas);
    expect(dark.surface).not.toBe(light.surface);
  });
});

test.describe('Theme initialization', () => {
  // theme-init.js runs synchronously in <head> before first paint: with no
  // saved theme the initial data-theme must follow prefers-color-scheme
  // exactly. A dark first paint that later flips to light is the FOUC this
  // contract exists to prevent, so both directions are asserted strictly.
  test('initial theme is light when prefers-color-scheme is light and nothing is saved', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    const theme = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-theme');
    });
    expect(theme).toBe('light');
  });

  test('initial theme is dark when prefers-color-scheme is dark and nothing is saved', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    const theme = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-theme');
    });
    expect(theme).toBe('dark');
  });
});
