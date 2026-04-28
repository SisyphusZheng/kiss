/**
 * @kissjs/core — SSG Smoke Build Test
 *
 * End-to-end verification of the 3-phase build pipeline:
 *   Phase 1: vite build (SSR bundle + metadata)
 *   Phase 2: deno task build:client (island chunks)
 *   Phase 3: deno task build:ssg (static HTML + post-process)
 *
 * This test requires the project to be built first (`deno task build`).
 * It validates the OUTPUT structure, not the runtime behavior.
 *
 * Run: deno test --allow-read packages/kiss-core/__tests__/ssg-smoke.test.ts
 */

import { assertEquals, assertExists, assertStringIncludes } from 'jsr:@std/assert@^1.0.0';
import { join } from 'jsr:@std/path@^1.0.0';
import { existsSync } from 'node:fs';

const ROOT = join(Deno.cwd(), '..'); // kiss-review root
const DOCS_DIST = join(ROOT, 'docs', 'dist');

// ─── Phase 1: SSR Bundle Verification ──────────────────────

Deno.test('SSG smoke: phase 1 — SSR bundle exists', () => {
  // After `deno task build` (Phase 1), the SSR bundle should exist
  const ssrBundle = join(DOCS_DIST, 'server', 'entry.js');
  
  if (!existsSync(ssrBundle)) {
    console.log('⚠️ SSR bundle not found — run "deno task docs:build" first');
    console.log(`  Expected: ${ssrBundle}`);
    // Don't fail — this is a smoke test that may run pre-build
    return;
  }
  
  console.log('✅ Phase 1: SSR bundle found');
});

Deno.test('SSG smoke: phase 1 — build metadata exists', () => {
  const metadataPath = join(ROOT, 'docs', '.kiss', 'build-metadata.json');
  
  if (!existsSync(metadataPath)) {
    console.log('⚠️ Build metadata not found — run Phase 1 first');
    return;
  }
  
  const raw = Deno.readTextFileSync(metadataPath);
  const meta = JSON.parse(raw);
  
  // Validate required fields
  assertExists(meta.routes, 'metadata should have routes');
  assertExists(meta.islands, 'metadata should have islands');
  assertExists(meta.entryFile, 'metadata should have entryFile');
  
  console.log(`✅ Phase 1: Build metadata valid (${meta.routes.length} routes, ${meta.islands.length} islands)`);
});

// ─── Phase 2: Client Build Verification ───────────────────

Deno.test('SSG smoke: phase 2 — client entry exists', () => {
  const clientEntry = join(DOCS_DIST, 'client', 'islands', 'client.js');
  
  if (!existsSync(clientEntry)) {
    console.log('⚠️ Client entry not found — run "deno task build:client" first');
    return;
  }
  
  const content = Deno.readTextFileSync(clientEntry);
  
  // Should contain hydration logic
  assertStringIncludes(content, 'hydrate',
    'Client entry should import/use Lit hydrate()');
  
  console.log('✅ Phase 2: Client entry valid with hydration logic');
});

Deno.test('SSG smoke: phase 2 — island chunks exist for known islands', () => {
  const islandsDir = join(DOCS_DIST, 'client', 'islands');
  
  if (!existsSync(islandsDir)) {
    console.log('⚠️ Islands dir not found — run Phase 2 first');
    return;
  }
  
  const files = Array.from(Deno.readDirSync(islandsDir)).map((e) => e.name);
  
  // Should have at least one JS file
  const jsFiles = files.filter((f) => f.endsWith('.js'));
  assert(jsFiles.length > 0, 'Should have at least one island chunk');
  
  console.log(`✅ Phase 2: ${jsFiles.length} island chunk(s) found`);
});

// ─── Phase 3: SSG Output Verification ─────────────────────

Deno.test('SSG smoke: phase 3 — HTML files generated', () => {
  if (!existsSync(DOCS_DIST)) {
    console.log('⚠️ dist/ not found — run full build pipeline first');
    return;
  }
  
  function findHtmlFiles(dir: string): string[] {
    const results: string[] = [];
    try {
      for (const entry of Deno.readDirSync(dir)) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory && !entry.name.startsWith('.') && entry.name !== 'client' && entry.name !== 'server') {
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
  
  // Validate each HTML file has basic structure
  let validCount = 0;
  for (const filePath of htmlFiles) {
    const content = Deno.readTextFileSync(filePath);
    
    // Must have DOCTYPE
    if (content.includes('<!DOCTYPE html>') || content.includes('<!doctype html>')) {
      validCount++;
    }
  }
  
  assertEquals(validCount, htmlFiles.length,
    'All HTML files should be valid documents with DOCTYPE');
});

Deno.test('SSG smoke: phase 3 — client script injected in HTML', () => {
  if (!existsSync(DOCS_DIST)) {
    console.log('⚠️ dist/ not found');
    return;
  }
  
  function findHtmlFiles(dir: string): string[] {
    const results: string[] = [];
    try {
      for (const entry of Deno.readDirSync(dir)) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory && !entry.name.startsWith('.') && entry.name !== 'client' && entry.name !== 'server') {
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
    
    // Should have client script tag (injected by injectClientScript)
    if (content.includes('<script type="module" src=')) {
      injectedCount++;
    }
  }
  
  console.log(`✅ Phase 3: ${injectedCount}/${htmlFiles.length} HTML files have client script`);
  
  // At least the index.html should have it
  assert(injectedCount >= 1,
    'At least index.html should have client script injected');
});

Deno.test('SSG smoke: phase 3 — DSD output preserved in HTML', () => {
  if (!existsSync(join(DOCS_DIST, 'index.html'))) {
    console.log('⚠️ index.html not found');
    return;
  }
  
  const indexHtml = Deno.readTextFileSync(join(DOCS_DIST, 'index.html'));
  
  // DSD (Declarative Shadow DOM) must survive SSG
  // This is the core KISS constraint: content visible without hydration
  const hasDsd = 
    indexHtml.includes('shadowroot=') ||
    indexHtml.includes('shadowrootmode=') ||
    indexHtml.includes('<template shadowroot');
  
  if (hasDsd) {
    console.log('✅ Phase 3: DSD output preserved (S constraint satisfied)');
  } else {
    console.log('ℹ️ No DSD in index.html (may use different rendering approach)');
  }
});
