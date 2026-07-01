#!/usr/bin/env -S deno run --allow-read --allow-write --allow-net --allow-env --allow-run
import { chromium, type Page } from 'npm:playwright@1.59.1';
import { join } from 'node:path';
import { ensureDir } from 'jsr:@std/fs@^1.0.0/ensure-dir';

interface StaticServer {
  origin: string;
  close(): Promise<void>;
}

const repoRoot = Deno.cwd();
const outputDir = join(repoRoot, 'test-results', 'visual-smoke');

const contentTypes: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};

function contentType(path: string): string {
  const dot = path.lastIndexOf('.');
  const ext = dot === -1 ? '' : path.slice(dot).toLowerCase();
  return contentTypes[ext] ?? 'application/octet-stream';
}

async function readCandidate(root: string, pathname: string): Promise<Response | null> {
  const safePath = decodeURIComponent(pathname);
  if (safePath.includes('..') || safePath.includes('\0')) {
    return new Response('Forbidden', { status: 403 });
  }

  const relativePath = safePath.replace(/^\/+/, '');
  const base = relativePath === '' ? '' : relativePath;
  const candidates = safePath.endsWith('/') ? [join(root, relativePath, 'index.html')] : [
    join(root, relativePath),
    join(root, `${base}.html`),
    join(root, relativePath, 'index.html'),
    join(root, 'index.html'),
  ];

  for (const candidate of candidates) {
    try {
      const body = await Deno.readFile(candidate);
      return new Response(body, { headers: { 'content-type': contentType(candidate) } });
    } catch {
      // Try the next candidate.
    }
  }
  return null;
}

function serveStatic(root: string): StaticServer {
  const server = Deno.serve({ port: 0, hostname: '127.0.0.1' }, async (request) => {
    const response = await readCandidate(root, new URL(request.url).pathname);
    return response ?? new Response('Not found', { status: 404 });
  });
  const addr = server.addr as Deno.NetAddr;
  return {
    origin: `http://127.0.0.1:${addr.port}`,
    close: () => server.shutdown(),
  };
}

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

async function assertBrandMark(page: Page, label: string): Promise<void> {
  const mark = await page.evaluate(() => {
    const visit = (root: Document | ShadowRoot | Element): Element | null => {
      const direct = root.querySelector?.('open-brand-mark');
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
    const element = visit(document);
    if (!element) return null;
    const box = element.getBoundingClientRect();
    const text = element.shadowRoot?.textContent?.trim() ?? '';
    return {
      width: box.width,
      height: box.height,
      text,
    };
  });

  if (!mark) throw new Error(`${label} does not render <open/> brand mark`);
  if (mark.width < 52 || mark.height < 24) {
    throw new Error(`${label} brand mark rendered too small: ${mark.width}x${mark.height}`);
  }
  if (!mark.text.includes('<open/>')) {
    throw new Error(`${label} brand mark text mismatch: ${mark.text}`);
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
  if (label.startsWith('docs')) await assertBrandMark(page, label);
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
