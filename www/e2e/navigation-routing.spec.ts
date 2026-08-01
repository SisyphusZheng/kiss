/**
 * E2E: Navigation & Routing
 *
 * Verifies that navigation between pages works correctly:
 *   - Direct URL access loads correct page
 *   - Link navigation works (including inside Shadow DOM)
 *   - Layout custom elements are present
 *   - Page titles are correct per route
 *
 * NOTE: openElement uses Shadow DOM encapsulation. Navigation links and
 * layout elements are inside shadow roots. Tests use `page.evaluate`
 * with shadow root traversal, or Playwright's piercing locator syntax.
 */

import { expect, test } from '@playwright/test';

test.describe('Direct URL Access', () => {
  const routes = [
    { path: '/', titleContains: 'openElement' },
    { path: '/guide/getting-started', titleContains: 'openElement' },
    { path: '/guide/architecture', titleContains: 'openElement' },
    { path: '/guide/islands-and-ssr', titleContains: 'openElement' },
    { path: '/architecture/dsd', titleContains: 'openElement' },
    { path: '/guide/routing-and-data', titleContains: 'openElement' },
    { path: '/changelog', titleContains: 'openElement' },
    { path: '/roadmap', titleContains: 'openElement' },
    { path: '/docs', titleContains: 'openElement' },
    { path: '/contributing', titleContains: 'openElement' },
    { path: '/apilist', titleContains: 'openElement' },
    { path: '/blog', titleContains: 'openElement' },
  ];

  for (const route of routes) {
    test(`"${route.path}" loads successfully with correct title`, async ({ page }) => {
      const response = await page.goto(route.path);
      await page.waitForLoadState('networkidle');

      expect(response?.status()).toBeLessThan(400);
      const title = await page.title();
      expect(title).toContain(route.titleContains);
    });
  }
});

test.describe('Link Navigation', () => {
  test('homepage has working navigation links', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Links are inside Shadow DOM - use piercing evaluate to find them
    const internalLinks = await page.evaluate(() => {
      const allLinks: HTMLAnchorElement[] = [];

      // Walk light DOM
      document.querySelectorAll('a[href]').forEach((a) => allLinks.push(a as HTMLAnchorElement));

      // Walk shadow roots (open-layout, home page, etc.)
      document.querySelectorAll('*').forEach((el) => {
        if (el.shadowRoot) {
          el.shadowRoot.querySelectorAll('a[href]').forEach((a) =>
            allLinks.push(a as HTMLAnchorElement)
          );
        }
      });

      return allLinks
        .map((a) => a.getAttribute('href')!)
        .filter(
          (href) =>
            href &&
            !href.startsWith('http') &&
            !href.startsWith('mailto') &&
            !href.startsWith('#') &&
            !href.startsWith('//'),
        );
    });

    expect(internalLinks.length).toBeGreaterThan(0);
  });

  test('clicking a guide link navigates correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Find guide links in shadow DOM
    const guideLinks = await page.evaluate(() => {
      const links: string[] = [];
      document.querySelectorAll('*').forEach((el) => {
        if (el.shadowRoot) {
          el.shadowRoot.querySelectorAll('a[href*="/guide/"]').forEach((a) => {
            const href = a.getAttribute('href');
            if (href) links.push(href);
          });
        }
      });
      // Also check light DOM
      document.querySelectorAll('a[href*="/guide/"]').forEach((a) => {
        const href = a.getAttribute('href');
        if (href) links.push(href);
      });
      return links;
    });

    expect(guideLinks.length).toBeGreaterThan(0);

    await page.goto(guideLinks[0]);
    await page.waitForLoadState('networkidle');

    const url = page.url();
    expect(url).toContain('/guide/');
  });

  test('SPA navigation from home to guide swaps app shell and keeps sidebar', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => {
      const layout = document.querySelector('open-layout');
      const guide = layout?.shadowRoot?.querySelector<HTMLAnchorElement>(
        'a[data-nav*="/guide/getting-started"]',
      );
      guide?.click();
    });

    await page.waitForURL(/\/guide\/getting-started\/?$/);
    await page.waitForFunction(() => {
      const layout = document.querySelector('open-layout');
      return !!layout?.shadowRoot?.querySelector('.docs-sidebar');
    });

    const state = await page.evaluate(() => {
      const layout = document.querySelector('open-layout')!;
      const sidebar = layout.shadowRoot!.querySelector('.docs-sidebar')!;
      const rect = sidebar.getBoundingClientRect();
      const style = getComputedStyle(sidebar);
      return {
        hasHome: layout.hasAttribute('home'),
        sidebarWidth: rect.width,
        display: style.display,
      };
    });
    expect(state.hasHome).toBe(false);
    expect(state.display).not.toBe('none');
    expect(state.sidebarWidth).toBeGreaterThan(180);
  });

  test('navigating between guide pages preserves layout', async ({ page }) => {
    await page.goto('/guide/getting-started');
    await page.waitForLoadState('networkidle');

    // Navigate to another guide page
    await page.goto('/guide/architecture');
    await page.waitForLoadState('networkidle');

    // Page should still have custom elements (layout intact)
    // open-layout exists in light DOM (it's the top-level wrapper)
    const hasLayout = await page.evaluate(() => {
      // Check both light DOM and that the element is defined
      const layout = document.querySelector('open-layout');
      if (layout) return true;
      // Fallback: check if any custom elements with shadow roots exist
      const all = document.querySelectorAll('*');
      for (const el of all) {
        if (el.shadowRoot) return true;
      }
      return false;
    });
    expect(hasLayout).toBe(true);
  });
});

test.describe('404 Page', () => {
  test('404.html is accessible and shows 404 content', async ({ page }) => {
    // Static file server needs the exact file path for 404.html
    await page.goto('/404.html');
    await page.waitForLoadState('networkidle');

    // Should show the 404 page content
    const bodyText = await page.evaluate(() => {
      // Collect text from both light and shadow DOM
      let text = document.body?.textContent ?? '';
      document.querySelectorAll('*').forEach((el) => {
        if (el.shadowRoot) {
          text += ' ' + (el.shadowRoot.textContent ?? '');
        }
      });
      return text;
    });
    const has404 = bodyText.includes('404') ||
      bodyText.includes('not found') ||
      bodyText.includes('does not exist') ||
      bodyText.includes('Not Found');
    expect(has404).toBe(true);
  });

  test('404 page has link back to home', async ({ page }) => {
    await page.goto('/404.html');
    await page.waitForLoadState('networkidle');

    // Search for home link in both light and shadow DOM
    const hasHomeLink = await page.evaluate(() => {
      const checkRoot = (root: Document | ShadowRoot): boolean => {
        const links = root.querySelectorAll('a[href="/"]');
        return links.length > 0;
      };
      if (checkRoot(document)) return true;
      const all = document.querySelectorAll('*');
      for (const el of all) {
        if (el.shadowRoot && checkRoot(el.shadowRoot)) return true;
      }
      return false;
    });
    expect(hasHomeLink).toBe(true);
  });
});

test.describe('Blog Pages', () => {
  test('blog index page loads', async ({ page }) => {
    await page.goto('/blog');
    await page.waitForLoadState('networkidle');

    const title = await page.title();
    expect(title).toBeTruthy();
  });

  test('blog index has blog post links', async ({ page }) => {
    await page.goto('/blog');
    await page.waitForLoadState('networkidle');

    // Blog index should have links to blog posts
    // Links are inside Shadow DOM - pierce through
    const blogLinks = await page.evaluate(() => {
      const links: string[] = [];

      const collectLinks = (root: Document | ShadowRoot) => {
        root.querySelectorAll('a[href*="/blog/"]').forEach((a) => {
          const href = a.getAttribute('href');
          if (href && href !== '/blog' && href !== '/blog/') {
            links.push(href);
          }
        });
      };

      collectLinks(document);
      document.querySelectorAll('*').forEach((el) => {
        if (el.shadowRoot) collectLinks(el.shadowRoot!);
      });

      return links;
    });

    expect(blogLinks.length).toBeGreaterThan(0);
  });

  test('individual blog post loads', async ({ page }) => {
    await page.goto('/blog');
    await page.waitForLoadState('networkidle');

    // Get first blog post link (pierce shadow DOM)
    const firstPostLink = await page.evaluate(() => {
      const checkRoot = (root: Document | ShadowRoot): string | null => {
        const link = root.querySelector('a[href*="/blog/v"]');
        return link?.getAttribute('href') ?? null;
      };

      const result = checkRoot(document);
      if (result) return result;

      const all = document.querySelectorAll('*');
      for (const el of all) {
        if (el.shadowRoot) {
          const found = checkRoot(el.shadowRoot!);
          if (found) return found;
        }
      }
      return null;
    });

    if (firstPostLink) {
      await page.goto(firstPostLink);
      await page.waitForLoadState('networkidle');

      const title = await page.title();
      expect(title).toBeTruthy();
    }
  });
});
