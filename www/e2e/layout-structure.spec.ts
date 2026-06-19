import { expect, test } from '@playwright/test';

test.describe('Docs Layout Structure', () => {
  test('getting started uses framework docs grid styles on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/guide/getting-started');
    await page.waitForLoadState('networkidle');

    const display = await page.evaluate(() => {
      const visit = (root: Document | ShadowRoot | Element): Element | null => {
        const direct = root.querySelector?.('.guide-grid');
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
      const grid = visit(document);
      return grid ? getComputedStyle(grid).display : null;
    });

    expect(display).toBe('grid');
  });
});
