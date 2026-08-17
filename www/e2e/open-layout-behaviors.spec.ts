import { expect, test } from '@playwright/test';

test.describe('open-layout behavior boundaries', () => {
  test('mobile menu synchronizes overlay state and main inertness', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/architecture/islands-deep');

    const layout = page.locator('open-layout');
    const main = layout.locator('.layout-main');
    await layout.locator('.mobile-menu-btn').click();
    await expect(layout).toHaveAttribute('menu-open', '');
    await expect(main).toHaveAttribute('inert', '');

    await layout.locator('.mobile-backdrop').click({ position: { x: 350, y: 100 } });
    await expect(layout).not.toHaveAttribute('menu-open');
    await expect(main).not.toHaveAttribute('inert');
  });

  test('scroll behavior toggles only the header presentation state', async ({ page }) => {
    await page.goto('/architecture/islands-deep');
    const header = page.locator('open-layout').locator('.app-header');
    await expect(header).not.toHaveClass(/scrolled/);
    await page.mouse.wheel(0, 500);
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0);
    await expect(header).toHaveClass(/scrolled/);
  });
});
