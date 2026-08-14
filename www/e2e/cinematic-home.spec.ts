import { expect, test } from '@playwright/test';

test.describe('Cinematic homepage', () => {
  test('keeps the product story and starter available without animation', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expect(page.getByText('THE WEB,', { exact: true })).toBeVisible();
    await expect(page.getByText('Start building', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('The server writes HTML.')).toBeVisible();
    await expect(
      page.getByText('deno run -A --minimum-dependency-age 0 npm:@openelement/create my-app'),
    ).toBeVisible();
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
    const initialColor = await mark.evaluate((element) => getComputedStyle(element).color);
    // theme-init follows prefers-color-scheme, so the initial theme varies by
    // environment; toggle to the opposite of the current theme instead of
    // assuming a fixed starting point.
    await page.evaluate(() => {
      const current = document.documentElement.getAttribute('data-theme') === 'light'
        ? 'dark'
        : 'light';
      document.documentElement.setAttribute('data-theme', current);
    });
    const toggledColor = await mark.evaluate((element) => getComputedStyle(element).color);
    expect(toggledColor).not.toBe(initialColor);
  });

  test('view-source hero and scroll scenes work without hijacking scroll', async ({ page }) => {
    await page.goto('/');
    const home = page.locator('open-home-page');
    await expect(home.locator('.hero-ghost')).toHaveCount(1);
    await expect(home.locator('.marquee span').first()).toBeVisible();
    await expect(home.locator('.spec-strip .spec-cell')).toHaveCount(5);
    const strategies = home.locator('.strategy');
    await expect(strategies).toHaveCount(4);
    await expect(strategies.nth(1).locator('.tag-default')).toHaveText('DEFAULT');
    await strategies.nth(1).scrollIntoViewIfNeeded();
    await expect.poll(() =>
      strategies.nth(1).evaluate((element) => Number(getComputedStyle(element).opacity))
    ).toBeGreaterThan(0.5);
    const rows = home.locator('.output-row');
    await expect(rows).toHaveCount(3);
    await rows.nth(1).scrollIntoViewIfNeeded();
    await expect(rows.nth(1)).toHaveClass(/active/);
  });
});
