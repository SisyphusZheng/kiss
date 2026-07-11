/**
 * @openelement/ssg/postprocess — SSG output post-processing helpers.
 */

import { assert, assertEquals, assertStringIncludes } from 'jsr:@std/assert@^1.0.0';
import {
  buildIslandChunkMap,
  buildSpeculationRulesJson,
  injectClientScript,
  injectCspMeta,
  injectDsdPolyfill,
  injectSpeculationRules,
  injectViewTransitionMeta,
  insertAfterHead,
} from '../src/postprocess.ts';
import { join } from 'node:path';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';

function tmpDir(): string {
  return mkdtempSync(join(tmpdir(), 'oe-postprocess-'));
}

Deno.test('insertAfterHead inserts after a bare <head>', () => {
  const html = '<html><head><title>x</title></head><body></body></html>';
  const out = insertAfterHead(html, '<meta name="x">');
  assertStringIncludes(out, '<head>\n  <meta name="x"><title>x</title>');
});

Deno.test('insertAfterHead handles <head> with attributes', () => {
  const html = '<html><head lang="en"><title>x</title></head><body></body></html>';
  const out = insertAfterHead(html, '<meta name="x">');
  assertStringIncludes(out, '<head lang="en">\n  <meta name="x">');
});

Deno.test('insertAfterHead synthesizes a head when missing', () => {
  const html = '<div>hello</div>';
  const out = insertAfterHead(html, '<meta name="x">');
  assertStringIncludes(out, '<head>\n  <meta name="x">\n</head>');
});

Deno.test('buildIslandChunkMap returns empty when client dir absent', () => {
  const root = tmpDir();
  try {
    assertEquals(buildIslandChunkMap(root, 'dist', ['foo']), {});
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

Deno.test('buildIslandChunkMap maps island tagNames from manifest', () => {
  const root = tmpDir();
  try {
    const clientDir = join(root, 'dist', 'client', '.vite');
    mkdirSync(clientDir, { recursive: true });
    writeFileSync(
      join(clientDir, 'manifest.json'),
      JSON.stringify({
        'islands/island-foo-abc123.js': { file: 'islands/island-foo-abc123.js' },
        'islands/island-bar-def456.js': { file: 'islands/island-bar-def456.js' },
        'other.js': { file: 'other.js' },
      }),
    );
    const map = buildIslandChunkMap(root, 'dist', ['foo', 'bar'], '/');
    assertEquals(map.foo, '/client/islands/island-foo-abc123.js');
    assertEquals(map.bar, '/client/islands/island-bar-def456.js');
    assertEquals(map.other, undefined);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

Deno.test('injectClientScript adds a module script before </body>', () => {
  const dir = tmpDir();
  try {
    writeFileSync(join(dir, 'index.html'), '<html><head></head><body></body></html>');
    injectClientScript(dir, '/client/islands/client.js');
    const out = readFileSync(join(dir, 'index.html'), 'utf-8');
    assertStringIncludes(out, '<script type="module" src="/client/islands/client.js">');
    assertStringIncludes(out, '</body>');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

Deno.test('injectCspMeta inserts escaped CSP meta after head', () => {
  const dir = tmpDir();
  try {
    writeFileSync(join(dir, 'index.html'), '<html><head></head><body></body></html>');
    injectCspMeta(dir, 'default-src \'self\'; report-uri "https://r.example"');
    const out = readFileSync(join(dir, 'index.html'), 'utf-8');
    assertStringIncludes(out, 'http-equiv="Content-Security-Policy"');
    assertStringIncludes(
      out,
      'content="default-src \'self\'; report-uri &quot;https://r.example&quot;"',
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

Deno.test('injectDsdPolyfill adds the explicit fallback once', () => {
  const dir = tmpDir();
  try {
    writeFileSync(join(dir, 'index.html'), '<html><head></head><body></body></html>');
    injectDsdPolyfill(dir);
    const out = readFileSync(join(dir, 'index.html'), 'utf-8');
    assertStringIncludes(out, 'data-openelement-dsd-fallback');
    injectDsdPolyfill(dir);
    assertEquals(
      (readFileSync(join(dir, 'index.html'), 'utf-8').match(/data-openelement-dsd-fallback/g) || [])
        .length,
      1,
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

Deno.test('injectViewTransitionMeta inserts the meta tag', () => {
  const dir = tmpDir();
  try {
    writeFileSync(join(dir, 'index.html'), '<html><head></head><body></body></html>');
    injectViewTransitionMeta(dir);
    const out = readFileSync(join(dir, 'index.html'), 'utf-8');
    assertStringIncludes(out, '<meta name="view-transition" content="same-origin">');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

Deno.test('injectSpeculationRules is a no-op for empty rules', () => {
  const dir = tmpDir();
  try {
    writeFileSync(join(dir, 'index.html'), '<html><head></head><body></body></html>');
    injectSpeculationRules(dir, '   ');
    const out = readFileSync(join(dir, 'index.html'), 'utf-8');
    assertEquals(out.includes('speculationrules'), false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

Deno.test('injectSpeculationRules injects a script tag', () => {
  const dir = tmpDir();
  try {
    writeFileSync(join(dir, 'index.html'), '<html><head></head><body></body></html>');
    injectSpeculationRules(dir, '{"prerender":[]}');
    const out = readFileSync(join(dir, 'index.html'), 'utf-8');
    assertStringIncludes(out, '<script type="speculationrules">');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

Deno.test('buildSpeculationRulesJson returns empty without routes or options', () => {
  assertEquals(buildSpeculationRulesJson({}), '');
});

Deno.test('buildSpeculationRulesJson honors explicit prerender/prefetch', () => {
  const json = buildSpeculationRulesJson({
    prerender: ['/about'],
    prefetch: ['/blog/*'],
  });
  const rules = JSON.parse(json);
  assertEquals(rules.prerender[0].where.href_matches, '/about');
  assertEquals(rules.prefetch[0].where.href_matches, '/blog/*');
});

Deno.test('buildSpeculationRulesJson applies two-tier heuristic', () => {
  const json = buildSpeculationRulesJson(
    {},
    [
      { path: '/', type: 'page' },
      { path: '/about', type: 'page' },
      { path: '/blog/post-1', type: 'page' },
      { path: '/api/x', type: 'api' },
    ],
  );
  const rules = JSON.parse(json);
  // Home + top-level prerendered; nested prefetched.
  assertEquals(
    rules.prerender.some((r: { source?: string; urls?: string[] }) => r.source === 'list'),
    true,
  );
  assertEquals(rules.prefetch[0].where.href_matches, '/blog/post-1/*');
  // API routes excluded from document rules.
  const about = rules.prerender.find((r: { where?: { not?: unknown } }) => r.where?.not);
  assert(about !== undefined, 'top-level prerender excludes api routes');
});
