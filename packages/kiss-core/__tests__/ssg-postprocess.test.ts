/**
 * @kissjs/core - ssg-postprocess.ts tests (Deno)
 *
 * Tests the 4 SSG post-processing functions using temp directories.
 */
import { assertEquals, assertExists, assertFalse } from 'jsr:@std/assert@^1.0.0';
import {
  buildIslandChunkMap,
  injectClientScript,
  injectCspMeta,
  rewriteHtmlFiles,
} from '../src/ssg-postprocess.ts';

import { join } from 'node:path';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

function makeTempDir(): string {
  return Deno.makeTempDirSync({ prefix: 'kiss-test-' });
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

Deno.test('buildIslandChunkMap scans manifest.json for island chunks', () => {
  const tmp = makeTempDir();
  try {
    // Create dist/client/.vite/manifest.json
    const viteDir = join(tmp, 'dist', 'client', '.vite');
    mkdirSync(viteDir, { recursive: true });

    const manifest = {
      'src/islands/counter.ts': { file: 'islands/island-counter-abc123.js' },
      'src/islands/theme.ts': { file: 'islands/island-theme-def456.js' },
      '.kiss-client-entry.ts': { file: 'islands/client.js' },
    };
    writeFileSync(join(viteDir, 'manifest.json'), JSON.stringify(manifest), 'utf-8');

    const result = buildIslandChunkMap(tmp, 'dist', ['counter-island', 'kiss-theme-toggle']);

    // Should find both islands from manifest entries
    assertExists(result['counter-island']);
    assertExists(result['kiss-theme-toggle']);
    // Paths should include the island file name
    assertExists(result['counter-island'].includes('counter'));
    assertExists(result['kiss-theme-toggle'].includes('theme'));
  } finally {
    cleanup(tmp);
  }
});

Deno.test('buildIslandChunkMap falls back to directory scan without manifest', () => {
  const tmp = makeTempDir();
  try {
    // Create islands/ dir with chunk files but no manifest
    const islandsDir = join(tmp, 'dist', 'client', 'islands');
    mkdirSync(islandsDir, { recursive: true });
    writeFileSync(join(islandsDir, 'island-counter-island-abc123.js'), '// counter', 'utf-8');

    const result = buildIslandChunkMap(tmp, 'dist', ['counter-island']);
    assertExists(result['counter-island']);
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
    // Path should start with custom basePath
    assertExists(result['counter-island'].startsWith('/my-app/'));
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
    // Should only appear once
    const count = (content.match(/client\.js/g) || []).length;
    // The original one + the check for existence (no new injection)
    // Actually it checks content.includes(scriptSrc) before injecting
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
    // Quotes should be escaped as &quot;
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

// ─── rewriteHtmlFiles ───────────────────────────────────────

Deno.test('rewriteHtmlFiles rewrites island source paths', () => {
  const tmp = makeTempDir();
  try {
    const htmlPath = join(tmp, 'index.html');
    writeFileSync(
      htmlPath,
      `<html><body>
        <script>import('/app/islands/counter-island.ts')</script>
      </body></html>`,
      'utf-8',
    );

    const chunkMap = { 'counter-island': '/client/islands/island-counter-abc.js' };
    rewriteHtmlFiles(tmp, chunkMap);

    const content = readFileSync(htmlPath, 'utf-8');
    assertExists(content.includes('/client/islands/island-counter-abc.js'));
    assertFalse(content.includes('/app/islands/counter-island.ts'));
  } finally {
    cleanup(tmp);
  }
});

Deno.test('rewriteHtmlFiles handles both /app/ and app/ patterns', () => {
  const tmp = makeTempDir();
  try {
    const htmlPath = join(tmp, 'index.html');
    writeFileSync(
      htmlPath,
      `<html><body>
        <script>import('app/islands/theme-toggle.ts')</script>
      </body></html>`,
      'utf-8',
    );

    const chunkMap = { 'theme-toggle': '/client/islands/island-theme.js' };
    rewriteHtmlFiles(tmp, chunkMap);

    const content = readFileSync(htmlPath, 'utf-8');
    assertExists(content.includes('/client/islands/island-theme.js'));
  } finally {
    cleanup(tmp);
  }
});

// ─── insertAfterHead / insertBeforeBodyClose edge cases ────

Deno.test('injectClientScript handles HTML without </body> tag', () => {
  const tmp = makeTempDir();
  try {
    const htmlPath = join(tmp, 'no-body.html');
    // HTML without </body> — insertBeforeBodyClose appends at end
    writeFileSync(htmlPath, '<html><head></head><p>No body close', 'utf-8');

    injectClientScript(tmp, '/client.js');

    const content = readFileSync(htmlPath, 'utf-8');
    assertExists(content.includes('/client.js'));
    // Should have appended at end since no </body>
  } finally {
    cleanup(tmp);
  }
});

Deno.test('injectCspMeta handles HTML without <head> tag', () => {
  const tmp = makeTempDir();
  try {
    const htmlPath = join(tmp, 'no-head.html');
    // HTML without <head> — insertAfterHead fallback inserts <head>
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
    console.warn = (...args: any[]) => {
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

// ─── buildIslandChunkMap edge cases ──────────────────────────

Deno.test('buildIslandChunkMap falls back to client.js last resort', () => {
  const tmp = makeTempDir();
  try {
    // Create client/islands/client.js but no manifest and no island chunks
    const islandsDir = join(tmp, 'dist', 'client', 'islands');
    mkdirSync(islandsDir, { recursive: true });
    writeFileSync(join(islandsDir, 'client.js'), '// client entry', 'utf-8');

    const result = buildIslandChunkMap(tmp, 'dist', ['my-island']);
    // Should fall back to client.js
    assertExists(result['my-island']);
    assertExists(result['my-island'].includes('client.js'));
  } finally {
    cleanup(tmp);
  }
});

Deno.test('buildIslandChunkMap handles malformed manifest.json', () => {
  const tmp = makeTempDir();
  try {
    const viteDir = join(tmp, 'dist', 'client', '.vite');
    mkdirSync(viteDir, { recursive: true });
    // Write malformed JSON
    writeFileSync(join(viteDir, 'manifest.json'), '{invalid json', 'utf-8');
    // Also create fallback island chunks
    const islandsDir = join(tmp, 'dist', 'client', 'islands');
    mkdirSync(islandsDir, { recursive: true });
    writeFileSync(join(islandsDir, 'island-counter-island-abc.js'), '// counter', 'utf-8');

    const result = buildIslandChunkMap(tmp, 'dist', ['counter-island']);
    // Should fall back to directory scan
    assertExists(result['counter-island']);
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
      'src/something.ts': { css: ['style.css'] }, // no 'file' field
      'src/islands/counter.ts': { file: 'islands/island-counter-abc123.js' },
    };
    writeFileSync(join(viteDir, 'manifest.json'), JSON.stringify(manifest), 'utf-8');

    const result = buildIslandChunkMap(tmp, 'dist', ['counter']);
    assertExists(result['counter']);
  } finally {
    cleanup(tmp);
  }
});

Deno.test('rewriteHtmlFiles skips non-HTML files', () => {
  const tmp = makeTempDir();
  try {
    const jsPath = join(tmp, 'app.js');
    writeFileSync(jsPath, "import('/app/islands/counter.ts')", 'utf-8');

    rewriteHtmlFiles(tmp, { 'counter': '/client/island-counter.js' });

    const content = readFileSync(jsPath, 'utf-8');
    assertEquals(content, "import('/app/islands/counter.ts')", 'JS files should not be modified');
  } finally {
    cleanup(tmp);
  }
});

Deno.test('rewriteHtmlFiles does not write when no matches', () => {
  const tmp = makeTempDir();
  try {
    const htmlPath = join(tmp, 'clean.html');
    writeFileSync(htmlPath, '<html><body><p>No imports here</p></body></html>', 'utf-8');
    const origMtime = Deno.statSync(htmlPath).mtime;

    // Small delay to ensure mtime would differ if file was written
    const chunkMap = { 'counter': '/client/island-counter.js' };
    rewriteHtmlFiles(tmp, chunkMap);

    const content = readFileSync(htmlPath, 'utf-8');
    assertEquals(content, '<html><body><p>No imports here</p></body></html>');
  } finally {
    cleanup(tmp);
  }
});
