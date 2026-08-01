/**
 * E2E test helpers for openElement docs site.
 *
 * Provides utilities for verifying custom element rendering, plus the shared
 * shadow-DOM walker used by specs that must pierce open shadow roots.
 */

import type { ElementHandle, Page } from '@playwright/test';

/**
 * Deep-query through open shadow roots; returns the first element matching
 * `selector`, or null when nothing matches.
 */
export async function deepQuery(
  page: Page,
  selector: string,
): Promise<ElementHandle<Element> | null> {
  const handle = await page.evaluateHandle((sel) => {
    const visit = (root: Document | ShadowRoot | Element): Element | null => {
      const direct = root.querySelector?.(sel);
      if (direct) return direct;
      const all = root.querySelectorAll?.('*') ?? [];
      for (const el of Array.from(all)) {
        if (el.shadowRoot) {
          const found = visit(el.shadowRoot);
          if (found) return found;
        }
      }
      return null;
    };
    return visit(document);
  }, selector);
  const element = handle.asElement();
  if (!element) {
    await handle.dispose();
    return null;
  }
  return element as ElementHandle<Element>;
}

/**
 * Collect all custom element tag names found in the page HTML.
 */
export function getCustomElementTags(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const tags = new Set<string>();
    const all = document.querySelectorAll('*');
    for (const el of all) {
      if (el.tagName.includes('-')) {
        tags.add(el.tagName.toLowerCase());
      }
    }
    return [...tags];
  });
}

/**
 * Re-export common assertions for convenience.
 */
export { expect } from '@playwright/test';
