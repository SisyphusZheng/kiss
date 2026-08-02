/**
 * E2E test helpers for openElement docs site.
 *
 * Provides utilities for verifying custom element rendering, plus the shared
 * shadow-DOM walker used by specs that must pierce open shadow roots. The
 * in-page walk logic lives in tools/lib/shadow-walker.ts (single source,
 * shared with tools/visual-smoke.ts); the wrappers below only marshal
 * selectors in and element handles out.
 */

import type { ElementHandle, Page } from '@playwright/test';
import { deepQueryAllInPage, deepQueryFirstInPage } from '../../tools/lib/shadow-walker.ts';

/**
 * Deep-query through open shadow roots; returns the first element matching
 * `selector`, or null when nothing matches.
 */
export async function deepQuery(
  page: Page,
  selector: string,
): Promise<ElementHandle<Element> | null> {
  const handle = await page.evaluateHandle(
    `(${deepQueryFirstInPage.toString()})(document, ${JSON.stringify(selector)})`,
  );
  const element = handle.asElement();
  if (!element) {
    await handle.dispose();
    return null;
  }
  return element as ElementHandle<Element>;
}

/**
 * Deep-query through open shadow roots; returns every element matching
 * `selector`, in document order (shadow content in place of its host).
 */
export async function deepQueryAll(
  page: Page,
  selector: string,
): Promise<ElementHandle<Element>[]> {
  const arrayHandle = await page.evaluateHandle(
    `(${deepQueryAllInPage.toString()})(document, ${JSON.stringify(selector)})`,
  );
  const properties = await arrayHandle.getProperties();
  const elements: ElementHandle<Element>[] = [];
  for (const property of properties.values()) {
    const element = property.asElement();
    if (element) {
      elements.push(element as ElementHandle<Element>);
    } else {
      await property.dispose();
    }
  }
  await arrayHandle.dispose();
  return elements;
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
