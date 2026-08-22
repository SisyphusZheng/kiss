import { expect, test } from '@playwright/test';
import { deepQuery } from './helpers.js';

test.describe('Docs Layout Structure', () => {
  test('getting started renders as a linear article with copyable code', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/guide/getting-started');
    await page.waitForLoadState('networkidle');

    // The guide section is Markdown-authored long-form (#1087 pilot), not a
    // card grid: article body with heading sections and code blocks.
    const article = await deepQuery(page, '.article-content');
    expect(article).toBeTruthy();
    const headings = await page.locator('guide-getting-started-page h2').count();
    expect(headings).toBeGreaterThan(0);
    await expect(page.locator('guide-getting-started-page open-code-block').first()).toBeVisible();
  });
});
