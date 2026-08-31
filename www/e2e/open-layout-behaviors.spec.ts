import { expect, test } from '@playwright/test';

test.describe('open-layout behavior boundaries', () => {
  test('mobile menu uses the native details disclosure', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/architecture/islands-deep');

    const layout = page.locator('open-layout');
    const menu = layout.locator('details.mobile-menu');
    await expect(menu).not.toHaveAttribute('open', '');
    await menu.locator('summary').click();
    await expect(menu).toHaveAttribute('open', '');
    await expect(menu.locator('nav a').first()).toBeVisible();
  });

  test('scrolling does not install the removed imperative shell state', async ({ page }) => {
    await page.goto('/architecture/islands-deep');
    const layout = page.locator('open-layout');
    await page.mouse.wheel(0, 500);
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0);
    await expect(layout).not.toHaveAttribute('menu-open');
    await expect(layout.locator('.layout-main')).not.toHaveAttribute('inert');
  });
});
