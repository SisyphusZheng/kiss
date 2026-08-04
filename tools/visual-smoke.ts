#!/usr/bin/env -S deno run --allow-read --allow-write --allow-net --allow-env --allow-run
import { chromium, type Page } from 'npm:playwright@1.59.1';
import { join } from '@std/path';
import { ensureDir } from '@std/fs';
import { serveStatic } from './lib/static-server.ts';
import { deepQueryFirstInPage } from './lib/shadow-walker.ts';

const repoRoot = Deno.cwd();
const outputDir = join(repoRoot, 'test-results', 'visual-smoke');

async function assertRenderable(page: Page, label: string): Promise<void> {
  await page.waitForLoadState('networkidle');
  const summary = await page.evaluate(() => {
    const body = document.body;
    const rect = body.getBoundingClientRect();
    const visibleText = (body.innerText || body.textContent || '').trim().replace(/\s+/g, ' ');
    const collectVisible = (root: Document | ShadowRoot | Element): number => {
      let count = 0;
      for (const el of Array.from(root.querySelectorAll('*'))) {
        const box = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        if (
          box.width > 0 && box.height > 0 && style.visibility !== 'hidden' &&
          style.display !== 'none'
        ) {
          count++;
        }
        if (el.shadowRoot) count += collectVisible(el.shadowRoot);
      }
      return count;
    };
    const visibleElements = collectVisible(document.body);
    return {
      width: rect.width,
      height: rect.height,
      htmlLength: document.documentElement.outerHTML.length,
      textLength: visibleText.length,
      visibleElements,
      title: document.title,
    };
  });

  if (summary.width < 320 || summary.height < 240) {
    throw new Error(`${label} rendered too small: ${summary.width}x${summary.height}`);
  }
  if (summary.textLength < 80 && summary.htmlLength < 2_000) {
    throw new Error(
      `${label} rendered too little content (${summary.textLength} text chars, ${summary.htmlLength} html chars)`,
    );
  }
  if (summary.visibleElements < 8) {
    throw new Error(`${label} rendered too few visible elements (${summary.visibleElements})`);
  }
}

async function assertBrandMark(page: Page, label: string, expectedText: string): Promise<void> {
  const mark: {
    width: number;
    height: number;
    text: string;
    accessibleName: string;
  } | null = await page.evaluate(
    `(() => {
      const element = (${deepQueryFirstInPage.toString()})(document, '[data-open-brand]');
      if (!element) return null;
      const box = element.getBoundingClientRect();
      const text = (element.shadowRoot?.textContent ?? element.textContent ?? '').trim();
      return {
        width: box.width,
        height: box.height,
        text,
        accessibleName: element.getAttribute('aria-label') ?? '',
      };
    })()`,
  );

  if (!mark) throw new Error(`${label} has no [data-open-brand]`);
  if (mark.width < 40 || mark.height < 20) {
    throw new Error(`${label} brand mark rendered too small: ${mark.width}x${mark.height}`);
  }
  if (!mark.text.includes(expectedText)) {
    throw new Error(`${label} brand text mismatch: expected ${expectedText}, got ${mark.text}`);
  }
  if (!mark.accessibleName) {
    throw new Error(`${label} brand mark has no accessible name`);
  }
}

async function smokePage(page: Page, label: string, url: string, screenshotName: string) {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });

  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await assertRenderable(page, label);
  if (label.startsWith('docs')) await assertBrandMark(page, label, '<open/>');
  if (label === 'Reader shell') await assertBrandMark(page, label, 'OpenReader');
  await page.screenshot({
    path: join(outputDir, screenshotName),
    fullPage: true,
  });

  const blockingErrors = errors.filter((message) =>
    !message.includes('Failed to load resource') &&
    !message.includes('favicon')
  );
  if (blockingErrors.length > 0) {
    throw new Error(`${label} console errors:\n${blockingErrors.join('\n')}`);
  }
}

async function main(): Promise<void> {
  await ensureDir(outputDir);
  const docs = serveStatic(join(repoRoot, 'www', 'dist'));
  const reader = serveStatic(join(repoRoot, 'examples', 'deno-desktop-reader', 'dist'));
  const browser = await chromium.launch();

  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await smokePage(page, 'docs site', `${docs.origin}/docs/`, 'docs-site.png');
    await smokePage(
      page,
      'docs API reference',
      `${docs.origin}/apilist/`,
      'docs-api-reference.png',
    );
    await smokePage(page, 'Reader shell', `${reader.origin}/`, 'reader-shell.png');
    console.log(`visual smoke passed; screenshots written to ${outputDir}`);
  } finally {
    await browser.close();
    await docs.close();
    await reader.close();
  }
}

if (import.meta.main) {
  await main();
}
