import { expect, test } from '@playwright/test';

test.describe('Search', () => {
  test('pagefind index is generated and non-empty', async ({ request }) => {
    const res = await request.get('/pagefind/pagefind-entry.json');
    expect(res.ok()).toBe(true);
    const entry = await res.json() as {
      languages?: Record<string, { page_count: number }>;
    };
    // The index derives from the built HTML, so stale/removed routes cannot
    // appear by construction; assert coverage instead of path liveness.
    const pageCount = Object.values(entry.languages ?? {})
      .reduce((total, lang) => total + lang.page_count, 0);
    expect(pageCount).toBeGreaterThan(0);
  });

  test('search island returns a live routing result', async ({ page, request }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(() => customElements.get('open-search'));
    await page.keyboard.press('Control+K');
    await page.locator('open-search').evaluate((el) => {
      const input = el.querySelector('input') as HTMLInputElement | null;
      input?.focus();
    });
    await page.keyboard.type('routing');
    // First search pays the Pagefind wasm/index load; allow extra time.
    await expect(page.locator('open-search').locator('.result').first()).toBeVisible({
      timeout: 15_000,
    });

    const href = await page.locator('open-search').evaluate((el) => {
      const link = el.querySelector('.result') as HTMLAnchorElement | null;
      return link?.getAttribute('href') ?? null;
    });
    expect(href).toBeTruthy();
    expect(href).not.toBe('/guide/routing');
    const res = await request.get(href!);
    expect(res.ok()).toBe(true);
  });

  test('search trigger focuses input and accepts real keyboard typing', async ({ page }) => {
    await page.goto('/guide/getting-started');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForFunction(() => customElements.get('open-search'));

    await page.getByRole('button', { name: 'Search' }).click();

    const search = page.locator('open-search');
    const input = search.locator('input');
    await expect(input).toBeFocused();

    await page.keyboard.type('routing');
    await expect(input).toHaveValue('routing');

    const firstResult = search.locator('.result').first();
    // First search pays the Pagefind wasm/index load; allow extra time.
    await expect(firstResult).toBeVisible({ timeout: 15_000 });
    const firstHref = await firstResult.getAttribute('href');
    expect(firstHref).toBeTruthy();
    expect(firstHref).not.toBe('/guide/routing');
  });

  test('search overlay is anchored to viewport when opened from layout header', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(() => customElements.get('open-search'));

    await page.locator('open-search').evaluate((el) => {
      const button = el.querySelector('button');
      button?.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    });

    const overlay = await page.locator('open-search').evaluate((el) => {
      const node = el.querySelector('.overlay');
      if (!node) return null;
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return {
        display: style.display,
        left: rect.left,
        right: rect.right,
        width: rect.width,
        viewportWidth: globalThis.innerWidth,
      };
    });

    expect(overlay).not.toBeNull();
    expect(overlay!.display).toBe('flex');
    expect(Math.abs(overlay!.left)).toBeLessThanOrEqual(1);
    expect(Math.abs(overlay!.right - overlay!.viewportWidth)).toBeLessThanOrEqual(1);
    expect(Math.abs(overlay!.width - overlay!.viewportWidth)).toBeLessThanOrEqual(1);
  });

  test('search initial HTML does not stringify computed signals', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(() => customElements.get('open-search'));

    const text = await page.locator('open-search').evaluate((el) =>
      el.querySelector('.results')?.textContent ?? ''
    );
    expect(text).not.toContain('[object Object]');
    expect(text).toContain('Type at least 2 characters to search');
  });

  test('search panel follows theme token changes', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(() => customElements.get('open-search'));

    const readPanelBackground = async () =>
      await page.locator('open-search').evaluate((el) => {
        const button = el.querySelector('button');
        button?.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
        const panel = el.querySelector('.panel');
        return panel ? getComputedStyle(panel).backgroundColor : '';
      });

    const darkBackground = await readPanelBackground();
    await page.locator('open-search').evaluate((el) => {
      const overlay = el.querySelector('.overlay');
      overlay?.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    });

    const beforeTheme = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'
    );
    const expectedTheme = beforeTheme === 'light' ? 'dark' : 'light';

    await page.locator('open-theme-toggle').evaluate((el) => {
      const button = el.shadowRoot?.querySelector('button');
      button?.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    });

    await page.waitForFunction(
      (theme) => document.documentElement.getAttribute('data-theme') === theme,
      expectedTheme,
    );
    const lightBackground = await readPanelBackground();

    expect(darkBackground).toBeTruthy();
    expect(lightBackground).toBeTruthy();
    expect(lightBackground).not.toBe(darkBackground);
  });

  test('search overlay closes when clicking the backdrop', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(() => customElements.get('open-search'));

    await page.locator('open-search').evaluate((el) => {
      const button = el.querySelector('button');
      button?.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    });

    let overlay = await page.locator('open-search').evaluate((el) => {
      const node = el.querySelector<HTMLElement>('.overlay');
      return node ? !node.hidden : false;
    });
    expect(overlay).toBe(true);

    await page.locator('open-search').evaluate((el) => {
      const node = el.querySelector('.overlay');
      node?.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    });

    overlay = await page.locator('open-search').evaluate((el) => {
      const node = el.querySelector<HTMLElement>('.overlay');
      return node ? !node.hidden : false;
    });
    expect(overlay).toBe(false);
  });
});
