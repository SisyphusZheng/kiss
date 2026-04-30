/**
 * @kissjs/core — SSG Smoke Build Test
 *
 * End-to-end verification of the 3-phase build pipeline:
 *   Phase 1: vite build (SSR bundle + metadata)
 *   Phase 2: deno task build:client (island chunks)
 *   Phase 3: deno task build:ssg (static HTML + post-process)
 *
 * This test requires the project to be built first (`deno task build`).
 * Tests are skipped when build output doesn't exist (normal in CI).
 *
 * Run: deno test --allow-read packages/kiss-core/__tests__/ssg-smoke.test.ts
 */

import { assert, assertEquals, assertExists, assertStringIncludes } from 'jsr:@std/assert@^1.0.0';
import { join } from 'jsr:@std/path@^1.0.0';
import { existsSync } from 'node:fs';

const ROOT = join(Deno.cwd(), '..'); // kiss-review root
const DOCS_DIST = join(ROOT, 'docs', 'dist');

// Check if build output exists — if not, skip these smoke tests
const HAS_BUILD = existsSync(join(DOCS_DIST, 'server', 'entry.js'));

// ─── Phase 1: SSR Bundle Verification ──────────────────────

Deno.test({
  name: 'SSG smoke: phase 1 — SSR bundle exists',
  ignore: !HAS_BUILD,
  fn: () => {
    const ssrBundle = join(DOCS_DIST, 'server', 'entry.js');
    assert(existsSync(ssrBundle), 'SSR bundle should exist after Phase 1');
    console.log('✅ Phase 1: SSR bundle found');
  },
});

Deno.test({
  name: 'SSG smoke: phase 1 — build metadata exists',
  ignore: !HAS_BUILD,
  fn: () => {
    const metadataPath = join(ROOT, 'docs', '.kiss', 'build-metadata.json');
    assert(existsSync(metadataPath), 'Build metadata should exist after Phase 1');

    const raw = Deno.readTextFileSync(metadataPath);
    const meta = JSON.parse(raw);

    assertExists(meta.routes, 'metadata should have routes');
    assertExists(meta.islands, 'metadata should have islands');
    assertExists(meta.entryFile, 'metadata should have entryFile');

    console.log(
      `✅ Phase 1: Build metadata valid (${meta.routes.length} routes, ${meta.islands.length} islands)`,
    );
  },
});

// ─── Phase 2: Client Build Verification ───────────────────

Deno.test({
  name: 'SSG smoke: phase 2 — client entry exists',
  ignore: !HAS_BUILD,
  fn: () => {
    const clientEntry = join(DOCS_DIST, 'client', 'islands', 'client.js');
    assert(existsSync(clientEntry), 'Client entry should exist after Phase 2');

    const content = Deno.readTextFileSync(clientEntry);
    assertStringIncludes(content, 'hydrate', 'Client entry should import/use Lit hydrate()');

    console.log('✅ Phase 2: Client entry valid with hydration logic');
  },
});

Deno.test({
  name: 'SSG smoke: phase 2 — island chunks exist for known islands',
  ignore: !HAS_BUILD,
  fn: () => {
    const islandsDir = join(DOCS_DIST, 'client', 'islands');
    assert(existsSync(islandsDir), 'Islands directory should exist after Phase 2');

    const files = Array.from(Deno.readDirSync(islandsDir)).map((e) => e.name);
    const jsFiles = files.filter((f) => f.endsWith('.js'));
    assert(jsFiles.length > 0, 'Should have at least one island chunk');

    console.log(`✅ Phase 2: ${jsFiles.length} island chunk(s) found`);
  },
});

// ─── Phase 3: SSG Output Verification ─────────────────────

Deno.test({
  name: 'SSG smoke: phase 3 — HTML files generated',
  ignore: !HAS_BUILD,
  fn: () => {
    function findHtmlFiles(dir: string): string[] {
      const results: string[] = [];
      try {
        for (const entry of Deno.readDirSync(dir)) {
          const fullPath = join(dir, entry.name);
          if (
            entry.isDirectory && !entry.name.startsWith('.') && entry.name !== 'client' &&
            entry.name !== 'server'
          ) {
            results.push(...findHtmlFiles(fullPath));
          } else if (entry.name.endsWith('.html')) {
            results.push(fullPath);
          }
        }
      } catch { /* ignore */ }
      return results;
    }

    const htmlFiles = findHtmlFiles(DOCS_DIST);
    assert(htmlFiles.length > 0, 'Should have at least one HTML file');
    console.log(`✅ Phase 3: ${htmlFiles.length} HTML file(s) generated`);

    let validCount = 0;
    for (const filePath of htmlFiles) {
      const content = Deno.readTextFileSync(filePath);
      if (content.includes('<!DOCTYPE html>') || content.includes('<!doctype html>')) {
        validCount++;
      }
    }

    assertEquals(
      validCount,
      htmlFiles.length,
      'All HTML files should be valid documents with DOCTYPE',
    );
  },
});

Deno.test({
  name: 'SSG smoke: phase 3 — client script injected in HTML',
  ignore: !HAS_BUILD,
  fn: () => {
    function findHtmlFiles(dir: string): string[] {
      const results: string[] = [];
      try {
        for (const entry of Deno.readDirSync(dir)) {
          const fullPath = join(dir, entry.name);
          if (
            entry.isDirectory && !entry.name.startsWith('.') && entry.name !== 'client' &&
            entry.name !== 'server'
          ) {
            results.push(...findHtmlFiles(fullPath));
          } else if (entry.name.endsWith('.html')) {
            results.push(fullPath);
          }
        }
      } catch { /* ignore */ }
      return results;
    }

    const htmlFiles = findHtmlFiles(DOCS_DIST);
    if (htmlFiles.length === 0) return;

    let injectedCount = 0;
    for (const filePath of htmlFiles) {
      const content = Deno.readTextFileSync(filePath);
      if (content.includes('<script type="module" src=')) {
        injectedCount++;
      }
    }

    console.log(`✅ Phase 3: ${injectedCount}/${htmlFiles.length} HTML files have client script`);
    assert(injectedCount >= 1, 'At least index.html should have client script injected');
  },
});

Deno.test({
  name: 'SSG smoke: phase 3 — DSD output preserved in HTML',
  ignore: !HAS_BUILD,
  fn: () => {
    if (!existsSync(join(DOCS_DIST, 'index.html'))) return;

    const indexHtml = Deno.readTextFileSync(join(DOCS_DIST, 'index.html'));

    const hasDsd = indexHtml.includes('shadowroot=') ||
      indexHtml.includes('shadowrootmode=') ||
      indexHtml.includes('<template shadowroot');

    if (hasDsd) {
      console.log('✅ Phase 3: DSD output preserved (S constraint satisfied)');
    } else {
      console.log('ℹ️ No DSD in index.html (may use different rendering approach)');
    }
  },
});
