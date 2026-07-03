import { expect, test } from '@playwright/test';

test.describe('Search', () => {
  test('generated search index has only live route paths', async ({ request }) => {
    const res = await request.get('/search-index.json');
    expect(res.ok()).toBe(true);
    const entries = await res.json() as Array<{ path: string }>;
    const stale = ['/guide/routing', '/guide/ssg', '/guide/dsd', '/guide/islands'];
    expect(entries.map((entry) => entry.path)).not.toEqual(expect.arrayContaining(stale));

    for (const entry of entries.slice(0, 20)) {
      const route = await request.get(entry.path);
      expect(route.status(), `${entry.path} should be generated`).toBeLessThan(400);
    }
  });

  test('search island returns a live routing result', async ({ page, request }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(() => customElements.get('open-search'));
    await page.keyboard.press('Control+K');
    await page.locator('open-search').evaluate((el) => {
      const input = el.shadowRoot?.querySelector('input') as HTMLInputElement | null;
      input?.focus();
    });
    await page.keyboard.type('routing');
    await expect(page.locator('open-search').locator('.result').first()).toBeVisible();

    const href = await page.locator('open-search').evaluate((el) => {
      const link = el.shadowRoot?.querySelector('.result') as HTMLAnchorElement | null;
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
    await expect(firstResult).toBeVisible();
    const firstHref = await firstResult.getAttribute('href');
    expect(firstHref).toBeTruthy();
    expect(firstHref).not.toBe('/guide/routing');
  });

  test('search overlay is anchored to viewport when opened from layout header', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(() => customElements.get('open-search'));

    await page.locator('open-search').evaluate((el) => {
      const button = el.shadowRoot?.querySelector('button');
      button?.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    });

    const overlay = await page.locator('open-search').evaluate((el) => {
      const node = el.shadowRoot?.querySelector('.overlay');
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
      el.shadowRoot?.querySelector('.results')?.textContent ?? ''
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
        const button = el.shadowRoot?.querySelector('button');
        button?.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
        const panel = el.shadowRoot?.querySelector('.panel');
        return panel ? getComputedStyle(panel).backgroundColor : '';
      });

    const darkBackground = await readPanelBackground();
    await page.locator('open-search').evaluate((el) => {
      const overlay = el.shadowRoot?.querySelector('.overlay');
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
      const button = el.shadowRoot?.querySelector('button');
      button?.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    });

    let overlay = await page.locator('open-search').evaluate((el) => {
      const node = el.shadowRoot?.querySelector('.overlay');
      return node?.classList.contains('open') ?? false;
    });
    expect(overlay).toBe(true);

    await page.locator('open-search').evaluate((el) => {
      const node = el.shadowRoot?.querySelector('.overlay');
      node?.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    });

    overlay = await page.locator('open-search').evaluate((el) => {
      const node = el.shadowRoot?.querySelector('.overlay');
      return node?.classList.contains('open') ?? false;
    });
    expect(overlay).toBe(false);
  });
});
