import { expect, test } from '@playwright/test';
import { deepQuery } from './helpers.js';

test.describe('Docs Layout Structure', () => {
  test('getting started uses framework docs grid styles on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/guide/getting-started');
    await page.waitForLoadState('networkidle');

    const grid = await deepQuery(page, '.guide-grid');
    const display = await grid?.evaluate((el) => getComputedStyle(el).display);

    expect(display).toBe('grid');
  });
});
