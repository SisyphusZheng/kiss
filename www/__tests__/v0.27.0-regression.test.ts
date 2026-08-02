/**
 * v0.27.0 Regression Tests — Build Output Integrity
 *
 * Prevents recurrence of the three production bugs discovered in v0.27.0:
 *   Bug 1: Sidebar disappears on docs pages (open-layout DSD missing)
 *   Bug 2: [object Object] in rendered HTML (VNode stringified)
 *   Bug 3: Search panel theme not following (dialog::backdrop isolation)
 *
 * Also guards against API surface regressions:
 *   - JSX must be available from the supported Element root
 *   - parse5 must NOT be a dependency
 *
 * Run: deno test www/__tests__/v0.27.0-regression.test.ts --allow-read --allow-run
 * Prerequisite: `deno task build`
 */

import { assert, assertEquals, assertFalse, assertStringIncludes } from '@std/assert';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const DIST = join(import.meta.dirname ?? '.', '..', 'dist');
const DOCS_PAGE = join(DIST, 'zh', 'guide', 'getting-started', 'index.html');
const HOME_PAGE = join(DIST, 'index.html');
const ARCHITECTURE_PAGE = join(DIST, 'zh', 'architecture', 'islands', 'index.html');
const REGISTRY_PAGE = join(DIST, 'zh', 'registry', 'index.html');

// ─── Helpers ────────────────────────────────────────────────────────

function readPage(path: string): string {
  if (!existsSync(path)) throw new Error(`Page not found: ${path}`);
  return readFileSync(path, 'utf-8');
}

// ─── Bug 1: Sidebar not missing ─────────────────────────────────────

Deno.test('v0.27.0 regression: docs-sidebar is present in guide pages', () => {
  const html = readPage(DOCS_PAGE);
  assertStringIncludes(html, 'docs-sidebar', 'Sidebar must be present in docs pages');
});

Deno.test('v0.27.0 regression: open-layout has DSD template', () => {
  const html = readPage(DOCS_PAGE);
  // Count shadowrootmode attributes — layout should contribute at least 1
  const count = (html.match(/shadowrootmode="open"/g) || []).length;
  assert(count >= 5, `Expected >= 5 DSD templates in docs page, got ${count}`);
});

Deno.test('v0.27.0 regression: open-search is present in output', () => {
  for (const page of [DOCS_PAGE, HOME_PAGE, ARCHITECTURE_PAGE]) {
    const html = readPage(page);
    assert(html.includes('<open-search'), `open-search missing in ${page}`);
  }
});

Deno.test('v0.27.0 regression: open-theme-toggle is present in output', () => {
  for (const page of [DOCS_PAGE, HOME_PAGE, ARCHITECTURE_PAGE]) {
    const html = readPage(page);
    assert(html.includes('<open-theme-toggle'), `open-theme-toggle missing in ${page}`);
  }
});

// ─── Bug 2: No [object Object] or [object Promise] ──────────────────

Deno.test('v0.27.0 regression: no [object Object] in rendered HTML', () => {
  for (const page of [DOCS_PAGE, HOME_PAGE, ARCHITECTURE_PAGE]) {
    const html = readPage(page);
    assertFalse(html.includes('[object Object]'), `[object Object] found in ${page}`);
  }
});

Deno.test('v0.27.0 regression: no [object Promise] in rendered HTML', () => {
  for (const page of [DOCS_PAGE, HOME_PAGE, ARCHITECTURE_PAGE]) {
    const html = readPage(page);
    assertFalse(html.includes('[object Promise]'), `[object Promise] found in ${page}`);
  }
});

// ─── Bug 3: No <dialog> in output ────────────────────────────────────

Deno.test('v0.27.0 regression: no <dialog> in rendered HTML', () => {
  for (const page of [DOCS_PAGE, HOME_PAGE, ARCHITECTURE_PAGE]) {
    const html = readPage(page);
    assertFalse(html.includes('<dialog'), `<dialog> found in ${page}`);
  }
});

// ─── API Surface: jsx NOT in root export ────────────────────────────

Deno.test('alpha.10 surface: JSX is exported from @openelement/element root', () => {
  const indexPath = join(
    import.meta.dirname ?? '.',
    '..',
    '..',
    'packages',
    'element',
    'src',
    'index.ts',
  );
  const src = readFileSync(indexPath, 'utf-8');
  for (const name of ['Fragment', 'jsx', 'jsxDEV', 'jsxs']) {
    assert(src.includes(name), `${name} should be exported from Element root`);
  }
});

// ─── parse5 not a dependency ─────────────────────────────────────────

Deno.test('alpha.10 surface: retired package directories stay deleted', () => {
  const packages = join(import.meta.dirname ?? '.', '..', '..', 'packages');
  for (const name of ['core', 'signal', 'router', 'protocol', 'content', 'ssg']) {
    assertFalse(existsSync(join(packages, name)), `retired package directory returned: ${name}`);
  }
});

// ─── Registry Hub iframe ─────────────────────────────────────────────

Deno.test('v0.40.0 cleanup: registry output is not built', () => {
  assertFalse(existsSync(REGISTRY_PAGE), 'registry page should not be generated in v0.40');
  const componentPage = join(DIST, 'en', 'registry', '@openelement~ui', 'open-card', 'index.html');
  assertFalse(
    existsSync(componentPage),
    'registry component page should not be generated in v0.40',
  );
});

// ─── Custom element count sanity ─────────────────────────────────────

Deno.test('v0.27.0 regression: open-layout tags not duplicated', () => {
  const html = readPage(DOCS_PAGE);
  // open-layout should appear exactly once as the wrapper (opening + closing)
  const opens = (html.match(/<open-layout/g) || []).length;
  const closes = (html.match(/<\/open-layout>/g) || []).length;
  assertEquals(opens, closes, 'Mismatched open-layout tags');
  assert(opens >= 1 && opens <= 3, `open-layout appears ${opens} times, expected 1-3`);
});
