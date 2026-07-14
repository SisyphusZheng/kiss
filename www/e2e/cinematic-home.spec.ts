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

  test('renders a transparent theme-aware logo linked to the current locale home', async ({ page }) => {
    await page.goto('/zh/guide/getting-started');
    const logo = page.locator('open-layout').locator('a.logo');
    await expect(logo).toBeVisible();
    await expect(logo).toHaveAttribute('href', '/zh/');
    await expect.poll(() => logo.evaluate((element) => getComputedStyle(element).backgroundImage))
      .toBe('none');
    const mark = logo.locator('.logo-glyph');
    await expect(mark).toBeVisible();
    const darkColor = await mark.evaluate((element) => getComputedStyle(element).color);
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
    const lightColor = await mark.evaluate((element) => getComputedStyle(element).color);
    expect(lightColor).not.toBe(darkColor);
  });

  test('drives the native film timeline without hijacking scroll', async ({ page }) => {
    await page.goto('/');
    const home = page.locator('open-home-page');
    await page.evaluate(() => scrollTo({ top: innerHeight * 2, behavior: 'instant' }));
    await expect.poll(() =>
      home.evaluate((element) =>
        Number(
          getComputedStyle(element.shadowRoot!.querySelector('.cinematic-v2')!).getPropertyValue(
            '--film-progress',
          ),
        )
      )
    ).toBeGreaterThan(0);
    const vinyl = home.locator('.vinyl');
    await expect(home.locator('.vinyl-wordmark')).toBeVisible();
    const rotated = await vinyl.evaluate((element) => getComputedStyle(element).transform);
    expect(rotated).not.toBe('none');
  });
});
