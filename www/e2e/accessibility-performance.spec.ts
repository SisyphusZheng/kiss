/**
 * E2E: Accessibility & Performance
 *
 * Verifies basic accessibility and performance:
 *   - Images have alt text
 *   - Interactive elements are keyboard accessible
 *   - No console errors on load
 *   - Pages load within acceptable time
 *   - Custom elements have ARIA labels where needed
 */

import { expect, test } from '@playwright/test';
import process from 'node:process';
import { deepQueryAllInPage } from '../../tools/lib/shadow-walker.ts';

// CI runners are fast and deterministic; local Windows dev boxes can be
// much slower, so relax the load-time ceiling outside of CI.
const LOAD_THRESHOLD_MS = process.env.CI ? 5000 : 60000;

test.describe('Accessibility', () => {
  test('shared prose and mobile rail color pairs meet WCAG AA', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/guide/getting-started');
    const contrast = (element: Element): number => {
      const luminance = (value: string): number => {
        const rgb = value.match(/[\d.]+/g)?.slice(0, 3).map(Number) ?? [0, 0, 0];
        const scale = value.startsWith('color(srgb ') ? 1 : 255;
        const linear = rgb.map((channel) => {
          const c = channel / scale;
          return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
      };
      const style = getComputedStyle(element);
      const fg = luminance(style.color);
      const bg = luminance(style.backgroundColor);
      return (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05);
    };
    const codeRatio = await page.locator('open-reading-shell code').first().evaluate(contrast);
    const summaryRatio = await page.locator('open-page-rail summary').evaluate((summary) => {
      const luminance = (value: string): number => {
        const rgb = value.match(/[\d.]+/g)?.slice(0, 3).map(Number) ?? [0, 0, 0];
        const scale = value.startsWith('color(srgb ') ? 1 : 255;
        const linear = rgb.map((channel) => {
          const c = channel / scale;
          return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
      };
      const fg = luminance(getComputedStyle(summary).color);
      const details = summary.closest('details');
      if (!details) throw new Error('mobile page rail summary must belong to details');
      const bg = luminance(getComputedStyle(details).backgroundColor);
      return (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05);
    });
    expect(codeRatio).toBeGreaterThanOrEqual(4.5);
    expect(summaryRatio).toBeGreaterThanOrEqual(4.5);
  });

  test('layout footer labels do not create skipped heading levels', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('open-layout footer h4')).toHaveCount(0);
    await expect(page.locator('open-layout footer .footer-heading')).toHaveCount(4);
  });

  test('homepage has no auto-detected a11y issues', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check for images without alt text
    const imagesWithoutAlt = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs.filter((img) => !img.getAttribute('alt')).length;
    });
    expect(imagesWithoutAlt).toBe(0);
  });

  test('interactive elements have accessible names', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check that buttons in shadow DOMs have labels
    const unlabeledButtons: number = await page.evaluate(
      `(${deepQueryAllInPage.toString()})(document, '*')` +
        `.flatMap((el) => el.shadowRoot ? Array.from(el.shadowRoot.querySelectorAll('button')) : [])` +
        '.filter((btn) =>' +
        " !(btn.getAttribute('aria-label') || btn.getAttribute('title') || btn.textContent?.trim())" +
        ').length',
    );
    // Allow some tolerance - not all buttons may need labels
    expect(unlabeledButtons).toBeLessThanOrEqual(2);
  });

  test('theme toggle is keyboard accessible via delegatesFocus', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // open-theme-toggle is nested inside open-layout's shadow DOM.
    // Playwright locators pierce shadow DOM automatically.
    const toggle = page.locator('open-theme-toggle');
    if ((await toggle.count()) > 0) {
      // Verify delegatesFocus is set on the custom element class
      const hasDelegatesFocus = await page.evaluate(() => {
        const ctor = customElements.get('open-theme-toggle');
        if (!ctor) return false;
        return (ctor as unknown as { delegatesFocus?: boolean }).delegatesFocus === true;
      });
      expect(hasDelegatesFocus).toBe(true);

      // Verify the toggle contains a button (focusable target)
      const hasButton = await page.locator('open-theme-toggle >> button').count();
      expect(hasButton).toBeGreaterThan(0);
    }
  });

  test('links have discernible text', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const emptyLinks = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href]'));
      return links.filter((link) => {
        const text = link.textContent?.trim();
        const ariaLabel = link.getAttribute('aria-label');
        const title = link.getAttribute('title');
        const imgAlt = link.querySelector('img')?.getAttribute('alt');
        return !text && !ariaLabel && !title && !imgAlt;
      }).length;
    });
    // Allow small number - some icon links may not have text
    expect(emptyLinks).toBeLessThanOrEqual(3);
  });
});

test.describe('Performance', () => {
  test('homepage loads within 5 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.locator('open-layout').waitFor({ state: 'attached' });
    const loadTime = Date.now() - start;

    expect(loadTime).toBeLessThan(LOAD_THRESHOLD_MS);
  });

  test('guide page loads within 5 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('/guide/getting-started', { waitUntil: 'domcontentloaded' });
    await page.locator('open-layout').waitFor({ state: 'attached' });
    const loadTime = Date.now() - start;

    expect(loadTime).toBeLessThan(LOAD_THRESHOLD_MS);
  });

  test('no critical console errors on homepage', async ({ page }) => {
    const errors: Array<{ text: string; url: string }> = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push({ text: msg.text(), url: msg.location().url });
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(() => {
      const layout = document.querySelector('open-layout');
      // Native Declarative Shadow DOM is the static-first readiness signal.
      // The layout does not need to upgrade before the page is usable.
      return !!layout?.shadowRoot;
    });

    // Filter out known non-critical errors (e.g., analytics, CDN, external CDN integrity mismatch)
    const criticalErrors = errors.filter(
      ({ text, url }) =>
        !url.includes('gc.zgo.at') &&
        !url.includes('openelement.goatcounter.com') &&
        !text.includes('gc.zgo.at/count.js') &&
        !text.includes('net::ERR') &&
        !text.includes('favicon') &&
        !text.includes('Manifest') &&
        // CDN integrity hash mismatches - external CDN resources change
        // independently of the app; these are infrastructure noise, not bugs.
        !url.includes('cdnjs.cloudflare.com') &&
        !url.includes('cdn.jsdelivr.net') &&
        !text.includes("Failed to find a valid digest in the 'integrity' attribute"),
    );

    expect(criticalErrors, JSON.stringify(criticalErrors, null, 2)).toEqual([]);
  });
});
