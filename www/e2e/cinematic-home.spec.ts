import { expect, test } from '@playwright/test';

test.describe('Cinematic homepage', () => {
  test('keeps the product story and starter available without animation', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expect(page.getByText('The Web,', { exact: false })).toBeVisible();
    await expect(page.getByText('Start building', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Give every component its own room.')).toBeVisible();
    await expect(page.getByText('deno run -A npm:@openelement/create my-app')).toBeVisible();
  });

  test('loads atmosphere as an optional enhancement', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('open-cinematic-atmosphere')).toHaveCount(1);
    const canvasExists = await page.locator('open-cinematic-atmosphere').evaluate((element) =>
      Boolean(element.shadowRoot?.querySelector('canvas'))
    );
    expect(canvasExists).toBe(true);
  });
});
