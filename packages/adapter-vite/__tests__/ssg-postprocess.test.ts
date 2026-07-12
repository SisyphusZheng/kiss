/**
 * @openelement/adapter-vite - ssg-postprocess.ts tests (Deno)
 *
 * Tests the SSG post-processing functions using temp directories.
 */
import { assertEquals, assertExists, assertFalse } from 'jsr:@std/assert@^1.0.0';
import {
  buildIslandChunkMap,
  buildSpeculationRulesJson,
  injectClientScript,
  injectCspMeta,
  injectSpeculationRules,
  injectViewTransitionMeta,
} from '../src/internal/ssg/index.ts';

import { join } from 'node:path';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

function makeTempDir(): string {
  return Deno.makeTempDirSync({ prefix: 'open-test-' });
}

function cleanup(dir: string) {
  try {
    rmSync(dir, { recursive: true });
  } catch { /* ignore */ }
}

// ─── buildIslandChunkMap ──────────────────────────────────────

Deno.test('buildIslandChunkMap returns empty map for non-existent dir', () => {
  const result = buildIslandChunkMap('/nonexistent/path', 'dist', ['counter-island']);
  assertEquals(Object.keys(result).length, 0);
});

Deno.test('buildIslandChunkMap returns empty map when no client dir', () => {
  const tmp = makeTempDir();
  try {
    const outDir = join(tmp, 'dist');
    mkdirSync(outDir);
    // No client/ subdir
    const result = buildIslandChunkMap(tmp, outDir, ['counter-island']);
    assertEquals(Object.keys(result).length, 0);
  } finally {
    cleanup(tmp);
  }
});

Deno.test('buildIslandChunkMap returns empty map when no manifest', () => {
  const tmp = makeTempDir();
  try {
    // Create islands/ dir with chunk files but no manifest
    const islandsDir = join(tmp, 'dist', 'client', 'islands');
    mkdirSync(islandsDir, { recursive: true });
    writeFileSync(join(islandsDir, 'island-counter-island-abc123.js'), '// counter', 'utf-8');

    const result = buildIslandChunkMap(tmp, 'dist', ['counter-island']);
    // Without manifest, returns empty (no fallback scan)
    assertEquals(Object.keys(result).length, 0);
  } finally {
    cleanup(tmp);
  }
});

Deno.test('buildIslandChunkMap scans manifest.json for island chunks', () => {
  const tmp = makeTempDir();
  try {
    const viteDir = join(tmp, 'dist', 'client', '.vite');
    mkdirSync(viteDir, { recursive: true });

    const manifest = {
      'src/islands/counter.ts': { file: 'islands/island-counter-abc123.js' },
      'src/islands/theme.ts': { file: 'islands/island-theme-def456.js' },
      '.openElement-client-entry.ts': { file: 'islands/client.js' },
    };
    writeFileSync(join(viteDir, 'manifest.json'), JSON.stringify(manifest), 'utf-8');

    const result = buildIslandChunkMap(tmp, 'dist', ['counter-island', 'open-theme-toggle']);

    assertExists(result['counter-island']);
    assertExists(result['open-theme-toggle']);
    assertExists(result['counter-island'].includes('counter'));
    assertExists(result['open-theme-toggle'].includes('theme'));
  } finally {
    cleanup(tmp);
  }
});

Deno.test('buildIslandChunkMap respects basePath option', () => {
  const tmp = makeTempDir();
  try {
    const viteDir = join(tmp, 'dist', 'client', '.vite');
    mkdirSync(viteDir, { recursive: true });
    const manifest = {
      'src/islands/counter-island.ts': { file: 'islands/island-counter-island-abc.js' },
    };
    writeFileSync(join(viteDir, 'manifest.json'), JSON.stringify(manifest), 'utf-8');

    const result = buildIslandChunkMap(tmp, 'dist', ['counter-island'], '/my-app/');
    assertExists(result['counter-island'].startsWith('/my-app/'));
  } finally {
    cleanup(tmp);
  }
});

Deno.test('buildIslandChunkMap handles malformed manifest.json', () => {
  const tmp = makeTempDir();
  try {
    const viteDir = join(tmp, 'dist', 'client', '.vite');
    mkdirSync(viteDir, { recursive: true });
    writeFileSync(join(viteDir, 'manifest.json'), '{invalid json', 'utf-8');

    const result = buildIslandChunkMap(tmp, 'dist', ['counter-island']);
    // Malformed manifest returns empty map
    assertEquals(Object.keys(result).length, 0);
  } finally {
    cleanup(tmp);
  }
});

Deno.test('buildIslandChunkMap skips manifest entries without file field', () => {
  const tmp = makeTempDir();
  try {
    const viteDir = join(tmp, 'dist', 'client', '.vite');
    mkdirSync(viteDir, { recursive: true });
    const manifest = {
      'src/something.ts': { css: ['style.css'] },
      'src/islands/counter.ts': { file: 'islands/island-counter-abc123.js' },
    };
    writeFileSync(join(viteDir, 'manifest.json'), JSON.stringify(manifest), 'utf-8');

    const result = buildIslandChunkMap(tmp, 'dist', ['counter']);
    assertExists(result['counter']);
  } finally {
    cleanup(tmp);
  }
});

Deno.test('buildIslandChunkMap: manifest entry.file with islands/ prefix has no double prefix', () => {
  const tmp = makeTempDir();
  try {
    const viteDir = join(tmp, 'dist', 'client', '.vite');
    mkdirSync(viteDir, { recursive: true });

    const manifest = {
      'app/islands/my-counter.ts': { file: 'islands/island-my-counter-abc123.js' },
    };
    writeFileSync(join(viteDir, 'manifest.json'), JSON.stringify(manifest), 'utf-8');

    const result = buildIslandChunkMap(tmp, 'dist', ['my-counter']);

    assertExists(result['my-counter']);
    assertFalse(
      result['my-counter'].includes('islands/islands/'),
      'Path must NOT have double islands/ prefix, got: ' + result['my-counter'],
    );
    assertExists(
      result['my-counter'].includes('client/islands/island-my-counter-abc123.js'),
      'Path should be client/islands/island-my-counter-abc123.js, got: ' + result['my-counter'],
    );
  } finally {
    cleanup(tmp);
  }
});

// ─── injectClientScript ──────────────────────────────────────

Deno.test('injectClientScript adds script tag to HTML files', () => {
  const tmp = makeTempDir();
  try {
    const htmlPath = join(tmp, 'index.html');
    writeFileSync(htmlPath, '<html><head></head><body><p>Hello</p></body></html>', 'utf-8');

    injectClientScript(tmp, '/client/islands/client.js');

    const content = readFileSync(htmlPath, 'utf-8');
    assertExists(content.includes('/client/islands/client.js'));
    assertExists(content.includes('<script type="module"'));
  } finally {
    cleanup(tmp);
  }
});

Deno.test('injectClientScript does not duplicate existing injection', () => {
  const tmp = makeTempDir();
  try {
    const scriptTag = '<script type="module" src="/client/islands/client.js"></script>';
    const htmlPath = join(tmp, 'index.html');
    writeFileSync(
      htmlPath,
      `<html><head></head><body>${scriptTag}<p>Hello</p></body></html>`,
      'utf-8',
    );

    injectClientScript(tmp, '/client/islands/client.js');

    const content = readFileSync(htmlPath, 'utf-8');
    const count = (content.match(/client\.js/g) || []).length;
    assertEquals(count <= 1, true);
  } finally {
    cleanup(tmp);
  }
});

Deno.test('injectClientScript recurses into subdirectories', () => {
  const tmp = makeTempDir();
  try {
    mkdirSync(join(tmp, 'blog'));
    writeFileSync(join(tmp, 'index.html'), '<html><body></body></html>', 'utf-8');
    writeFileSync(join(tmp, 'blog', 'post.html'), '<html><body></body></html>', 'utf-8');

    injectClientScript(tmp, '/client.js');

    assertExists(readFileSync(join(tmp, 'index.html'), 'utf-8').includes('/client.js'));
    assertExists(readFileSync(join(tmp, 'blog', 'post.html'), 'utf-8').includes('/client.js'));
  } finally {
    cleanup(tmp);
  }
});

// ─── injectCspMeta ──────────────────────────────────────────

Deno.test('injectCspMeta adds CSP meta tag to HTML files', () => {
  const tmp = makeTempDir();
  try {
    const htmlPath = join(tmp, 'index.html');
    writeFileSync(htmlPath, '<html><head></head><body></body></html>', 'utf-8');

    injectCspMeta(tmp, "default-src 'self'");

    const content = readFileSync(htmlPath, 'utf-8');
    assertExists(content.includes('Content-Security-Policy'));
    assertExists(content.includes("default-src 'self'"));
  } finally {
    cleanup(tmp);
  }
});

Deno.test('injectCspMeta uses Report-Only header in report-only mode', () => {
  const tmp = makeTempDir();
  try {
    const htmlPath = join(tmp, 'index.html');
    writeFileSync(htmlPath, '<html><head></head><body></body></html>', 'utf-8');

    injectCspMeta(tmp, "default-src 'self'", true);

    const content = readFileSync(htmlPath, 'utf-8');
    assertExists(content.includes('Content-Security-Policy-Report-Only'));
    assertFalse(content.includes('"Content-Security-Policy"'));
  } finally {
    cleanup(tmp);
  }
});

Deno.test('injectCspMeta escapes quotes in policy', () => {
  const tmp = makeTempDir();
  try {
    const htmlPath = join(tmp, 'index.html');
    writeFileSync(htmlPath, '<html><head></head><body></body></html>', 'utf-8');

    injectCspMeta(tmp, "default-src 'self'; script-src 'unsafe-inline'");

    const content = readFileSync(htmlPath, 'utf-8');
    assertExists(content.includes('&quot;'));
  } finally {
    cleanup(tmp);
  }
});

Deno.test('injectCspMeta does not duplicate on repeated calls', () => {
  const tmp = makeTempDir();
  try {
    const htmlPath = join(tmp, 'index.html');
    writeFileSync(htmlPath, '<html><head></head><body></body></html>', 'utf-8');

    injectCspMeta(tmp, "default-src 'self'");
    injectCspMeta(tmp, "default-src 'self'");

    const content = readFileSync(htmlPath, 'utf-8');
    const count = (content.match(/Content-Security-Policy/g) || []).length;
    assertEquals(count, 1);
  } finally {
    cleanup(tmp);
  }
});

Deno.test('injectClientScript handles HTML without </body> tag', () => {
  const tmp = makeTempDir();
  try {
    const htmlPath = join(tmp, 'no-body.html');
    writeFileSync(htmlPath, '<html><head></head><p>No body close', 'utf-8');

    injectClientScript(tmp, '/client.js');

    const content = readFileSync(htmlPath, 'utf-8');
    assertExists(content.includes('/client.js'));
  } finally {
    cleanup(tmp);
  }
});

Deno.test('injectCspMeta handles HTML without <head> tag', () => {
  const tmp = makeTempDir();
  try {
    const htmlPath = join(tmp, 'no-head.html');
    writeFileSync(htmlPath, '<html><body><p>No head</p></body></html>', 'utf-8');

    injectCspMeta(tmp, "default-src 'self'");

    const content = readFileSync(htmlPath, 'utf-8');
    assertExists(content.includes('Content-Security-Policy'));
  } finally {
    cleanup(tmp);
  }
});

Deno.test('injectCspMeta handles HTML starting with <!DOCTYPE>', () => {
  const tmp = makeTempDir();
  try {
    const htmlPath = join(tmp, 'doctype.html');
    writeFileSync(htmlPath, '<!DOCTYPE html><html><body></body></html>', 'utf-8');

    injectCspMeta(tmp, "default-src 'self'");

    const content = readFileSync(htmlPath, 'utf-8');
    assertExists(content.includes('Content-Security-Policy'));
  } finally {
    cleanup(tmp);
  }
});

Deno.test('injectCspMeta warns when nonce=true', () => {
  const tmp = makeTempDir();
  try {
    const htmlPath = join(tmp, 'nonce.html');
    writeFileSync(htmlPath, '<html><head></head><body></body></html>', 'utf-8');

    const origWarn = console.warn;
    let warnMsg = '';
    console.warn = (...args: unknown[]) => {
      warnMsg = args.join(' ');
    };

    injectCspMeta(tmp, "default-src 'self'", false, true);

    console.warn = origWarn;
    assertExists(warnMsg.includes('nonce'), 'Should warn about nonce not supported');
  } finally {
    cleanup(tmp);
  }
});

Deno.test('injectCspMeta skips non-HTML files', () => {
  const tmp = makeTempDir();
  try {
    const htmlPath = join(tmp, 'index.html');
    const txtPath = join(tmp, 'readme.txt');
    writeFileSync(htmlPath, '<html><head></head><body></body></html>', 'utf-8');
    writeFileSync(txtPath, 'Not HTML', 'utf-8');

    injectCspMeta(tmp, "default-src 'self'");

    const txtContent = readFileSync(txtPath, 'utf-8');
    assertEquals(txtContent, 'Not HTML', 'Non-HTML files should not be modified');
  } finally {
    cleanup(tmp);
  }
});

Deno.test('injectClientScript skips non-HTML files', () => {
  const tmp = makeTempDir();
  try {
    const htmlPath = join(tmp, 'index.html');
    const jsPath = join(tmp, 'app.js');
    writeFileSync(htmlPath, '<html><body></body></html>', 'utf-8');
    writeFileSync(jsPath, 'console.log("hi")', 'utf-8');

    injectClientScript(tmp, '/client.js');

    const jsContent = readFileSync(jsPath, 'utf-8');
    assertEquals(jsContent, 'console.log("hi")', 'JS files should not be modified');
  } finally {
    cleanup(tmp);
  }
});

// ─── injectViewTransitionMeta ─────────────────────────────────

Deno.test('injectViewTransitionMeta adds meta tag to HTML files', () => {
  const tmp = makeTempDir();
  try {
    const htmlPath = join(tmp, 'index.html');
    writeFileSync(htmlPath, '<html><head></head><body><p>Hello</p></body></html>', 'utf-8');

    injectViewTransitionMeta(tmp);

    const content = readFileSync(htmlPath, 'utf-8');
    assertExists(content.includes('view-transition'));
    assertExists(content.includes('same-origin'));
  } finally {
    cleanup(tmp);
  }
});

Deno.test('injectViewTransitionMeta does not duplicate on repeated calls', () => {
  const tmp = makeTempDir();
  try {
    const htmlPath = join(tmp, 'index.html');
    writeFileSync(htmlPath, '<html><head></head><body></body></html>', 'utf-8');

    injectViewTransitionMeta(tmp);
    injectViewTransitionMeta(tmp);

    const content = readFileSync(htmlPath, 'utf-8');
    const count = (content.match(/view-transition/g) || []).length;
    assertEquals(count, 1);
  } finally {
    cleanup(tmp);
  }
});

Deno.test('injectViewTransitionMeta recurses into subdirectories', () => {
  const tmp = makeTempDir();
  try {
    mkdirSync(join(tmp, 'guide'));
    writeFileSync(join(tmp, 'index.html'), '<html><head></head><body></body></html>', 'utf-8');
    writeFileSync(
      join(tmp, 'guide', 'page.html'),
      '<html><head></head><body></body></html>',
      'utf-8',
    );

    injectViewTransitionMeta(tmp);

    assertExists(readFileSync(join(tmp, 'index.html'), 'utf-8').includes('view-transition'));
    assertExists(
      readFileSync(join(tmp, 'guide', 'page.html'), 'utf-8').includes('view-transition'),
    );
  } finally {
    cleanup(tmp);
  }
});

Deno.test('injectViewTransitionMeta skips non-HTML files', () => {
  const tmp = makeTempDir();
  try {
    const htmlPath = join(tmp, 'index.html');
    const txtPath = join(tmp, 'readme.txt');
    writeFileSync(htmlPath, '<html><head></head><body></body></html>', 'utf-8');
    writeFileSync(txtPath, 'Not HTML', 'utf-8');

    injectViewTransitionMeta(tmp);

    const txtContent = readFileSync(txtPath, 'utf-8');
    assertEquals(txtContent, 'Not HTML');
  } finally {
    cleanup(tmp);
  }
});

Deno.test('injectViewTransitionMeta handles HTML without <head> tag', () => {
  const tmp = makeTempDir();
  try {
    const htmlPath = join(tmp, 'no-head.html');
    writeFileSync(htmlPath, '<html><body><p>No head</p></body></html>', 'utf-8');

    injectViewTransitionMeta(tmp);

    const content = readFileSync(htmlPath, 'utf-8');
    assertExists(content.includes('view-transition'));
  } finally {
    cleanup(tmp);
  }
});

Deno.test('injectViewTransitionMeta still injects when body text mentions view-transition', () => {
  // Regression: changelog page content contains "view-transition" as text,
  // which previously caused the injection to be skipped.
  // Fix: check for '<meta name="view-transition"' instead of 'view-transition'.
  const tmp = makeTempDir();
  try {
    const htmlPath = join(tmp, 'changelog.html');
    writeFileSync(
      htmlPath,
      '<html><head></head><body><p>We added view-transition support in v0.9.2</p></body></html>',
      'utf-8',
    );

    injectViewTransitionMeta(tmp);

    const content = readFileSync(htmlPath, 'utf-8');
    // Should have the meta tag injected (not skipped because of body text)
    const matchCount = (content.match(/<meta name="view-transition"/g) || []).length;
    assertEquals(matchCount, 1);
  } finally {
    cleanup(tmp);
  }
});

// ─── buildSpeculationRulesJson ────────────────────────────────

Deno.test('buildSpeculationRulesJson returns empty string for no options and no routes', () => {
  const result = buildSpeculationRulesJson({});
  assertEquals(result, '');
});

Deno.test('buildSpeculationRulesJson generates heuristic prerender rules from routes', () => {
  const result = buildSpeculationRulesJson({}, [
    { path: '/', type: 'page' },
    { path: '/about', type: 'page' },
    { path: '/api/data', type: 'api' },
    { path: '/blog/:slug', type: 'page' },
  ]);

  const parsed = JSON.parse(result);
  // Heuristic mode generates prerender rules (not prefetch)
  assertExists(parsed.prerender);
  // Home page should be in prerender
  assertExists(
    parsed.prerender.some((r: { where: { href_matches?: string } }) =>
      r.where && !r.where.href_matches
    ),
  );
  // Top-level page with wildcard (document rule - has where.href_matches)
  assertExists(
    parsed.prerender.some((r: { where?: { href_matches: string } }) =>
      r.where?.href_matches === '/about/*'
    ),
  );
  // Home page should be a list rule (source + urls, no where)
  assertExists(
    parsed.prerender.some((r: { source?: string; urls?: string[] }) =>
      r.source === 'list' && r.urls?.includes('/')
    ),
  );
  // Dynamic routes (with :) should be excluded
  assertFalse(result.includes('/blog/:slug'));
});

Deno.test('buildSpeculationRulesJson generates user-provided prerender rules', () => {
  const result = buildSpeculationRulesJson({
    prerender: ['/guide/*'],
  });

  const parsed = JSON.parse(result);
  assertExists(parsed.prerender);
  assertEquals(parsed.prerender[0].where.href_matches, '/guide/*');
});

Deno.test('buildSpeculationRulesJson generates user-provided prefetch rules', () => {
  const result = buildSpeculationRulesJson({
    prefetch: ['/about', '/blog/*'],
  });

  const parsed = JSON.parse(result);
  assertExists(parsed.prefetch);
  assertEquals(parsed.prefetch.length, 2);
});

Deno.test('buildSpeculationRulesJson applies exclusion to user rules', () => {
  const result = buildSpeculationRulesJson({
    prerender: ['/guide/*'],
    exclude: ['/api/*'],
  });

  const parsed = JSON.parse(result);
  assertExists(parsed.prerender[0].where.not);
});

Deno.test('buildSpeculationRulesJson sets eagerness when not moderate', () => {
  const result = buildSpeculationRulesJson({
    prerender: ['/guide/*'],
    eagerness: 'immediate',
  });

  const parsed = JSON.parse(result);
  assertEquals(parsed.prerender[0].eagerness, 'immediate');
});

Deno.test('buildSpeculationRulesJson omits eagerness when moderate (default)', () => {
  const result = buildSpeculationRulesJson({
    prerender: ['/guide/*'],
    eagerness: 'moderate',
  });

  const parsed = JSON.parse(result);
  assertEquals(parsed.prerender[0].eagerness, undefined);
});

Deno.test('buildSpeculationRulesJson excludes API routes in heuristic mode', () => {
  const result = buildSpeculationRulesJson({}, [
    { path: '/', type: 'page' },
    { path: '/api/data', type: 'api' },
  ]);

  const parsed = JSON.parse(result);
  // Heuristic mode generates prerender, not prefetch
  assertExists(parsed.prerender);
  // Only one static page (/) -> no exclusions needed
  assertEquals(parsed.prerender.length, 1);
});

Deno.test('buildSpeculationRulesJson returns empty string when no static pages', () => {
  const result = buildSpeculationRulesJson({}, [
    { path: '/api/data', type: 'api' },
    { path: '/blog/:slug', type: 'page' },
  ]);

  assertEquals(result, '');
});

// ─── injectSpeculationRules ───────────────────────────────────

Deno.test('injectSpeculationRules adds script tag to HTML files', () => {
  const tmp = makeTempDir();
  try {
    const htmlPath = join(tmp, 'index.html');
    writeFileSync(htmlPath, '<html><head></head><body></body></html>', 'utf-8');

    const rulesJson = JSON.stringify(
      { prefetch: [{ where: { href_matches: '/about/*' } }] },
      null,
      2,
    );
    injectSpeculationRules(tmp, rulesJson);

    const content = readFileSync(htmlPath, 'utf-8');
    assertExists(content.includes('speculationrules'));
    assertExists(content.includes('/about/*'));
  } finally {
    cleanup(tmp);
  }
});

Deno.test('injectSpeculationRules does nothing with empty rules', () => {
  const tmp = makeTempDir();
  try {
    const htmlPath = join(tmp, 'index.html');
    writeFileSync(htmlPath, '<html><head></head><body></body></html>', 'utf-8');

    injectSpeculationRules(tmp, '');

    const content = readFileSync(htmlPath, 'utf-8');
    assertFalse(content.includes('speculationrules'));
  } finally {
    cleanup(tmp);
  }
});

Deno.test('injectSpeculationRules does not duplicate on repeated calls', () => {
  const tmp = makeTempDir();
  try {
    const htmlPath = join(tmp, 'index.html');
    writeFileSync(htmlPath, '<html><head></head><body></body></html>', 'utf-8');

    const rulesJson = JSON.stringify({ prefetch: [{ where: { href_matches: '/' } }] }, null, 2);
    injectSpeculationRules(tmp, rulesJson);
    injectSpeculationRules(tmp, rulesJson);

    const content = readFileSync(htmlPath, 'utf-8');
    const count = (content.match(/speculationrules/g) || []).length;
    assertEquals(count, 1);
  } finally {
    cleanup(tmp);
  }
});

Deno.test('injectSpeculationRules recurses into subdirectories', () => {
  const tmp = makeTempDir();
  try {
    mkdirSync(join(tmp, 'blog'));
    writeFileSync(join(tmp, 'index.html'), '<html><head></head><body></body></html>', 'utf-8');
    writeFileSync(
      join(tmp, 'blog', 'post.html'),
      '<html><head></head><body></body></html>',
      'utf-8',
    );

    const rulesJson = JSON.stringify({ prefetch: [{ where: { href_matches: '/*' } }] }, null, 2);
    injectSpeculationRules(tmp, rulesJson);

    assertExists(readFileSync(join(tmp, 'index.html'), 'utf-8').includes('speculationrules'));
    assertExists(
      readFileSync(join(tmp, 'blog', 'post.html'), 'utf-8').includes('speculationrules'),
    );
  } finally {
    cleanup(tmp);
  }
});

Deno.test('injectSpeculationRules still injects when body text mentions speculationrules', () => {
  // Regression: changelog page content contains "speculationrules" as text,
  // which previously caused the injection to be skipped.
  // Fix: check for '<script type="speculationrules"' instead of 'speculationrules'.
  const tmp = makeTempDir();
  try {
    const htmlPath = join(tmp, 'changelog.html');
    writeFileSync(
      htmlPath,
      '<html><head></head><body><p>We added speculationrules support in v0.9.2</p></body></html>',
      'utf-8',
    );

    const rulesJson = JSON.stringify({ prefetch: [{ where: { href_matches: '/*' } }] }, null, 2);
    injectSpeculationRules(tmp, rulesJson);

    const content = readFileSync(htmlPath, 'utf-8');
    // Should have the script tag injected (not skipped because of body text)
    const matchCount = (content.match(/<script type="speculationrules"/g) || []).length;
    assertEquals(matchCount, 1);
  } finally {
    cleanup(tmp);
  }
});
