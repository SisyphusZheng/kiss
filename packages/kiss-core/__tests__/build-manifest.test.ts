/**
 * @kissjs/core - build-manifest.ts tests (Deno)
 *
 * Tests build manifest scanning and formatting using temp directories.
 */
import { assertEquals, assertExists } from 'jsr:@std/assert@^1.0.0';
import { scanClientBuild, scanSSGOutput } from '../src/build-manifest.ts';

import { join } from 'node:path';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';

function makeTempDir(): string {
  const dir = join(tmpdir(), `kiss-test-${randomUUID().slice(0, 8)}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function cleanup(dir: string) {
  try { rmSync(dir, { recursive: true }); } catch { /* ignore */ }
}

// ─── scanClientBuild ─────────────────────────────────────────

Deno.test('scanClientBuild returns empty when no client dir', () => {
  const result = scanClientBuild('/nonexistent');
  assertEquals(result.islands.length, 0);
  assertEquals(result.clientEntry, null);
  assertEquals(result.totalJsBytes, 0);
});

Deno.test('scanClientBuild finds island chunks', () => {
  const tmp = makeTempDir();
  try {
    const islandsDir = join(tmp, 'dist', 'client', 'islands');
    mkdirSync(islandsDir, { recursive: true });

    // Create island chunk files
    writeFileSync(join(islandsDir, 'island-counter-abc123.js'), '// counter chunk 1024 bytes'.padEnd(1024, ' '), 'utf-8');
    writeFileSync(join(islandsDir, 'island-theme-def456.js'), '// theme chunk 512 bytes'.padEnd(512, ' '), 'utf-8');

    // Create client entry
    writeFileSync(join(islandsDir, 'client.js'), '// client entry 2048 bytes'.padEnd(2048, ' '), 'utf-8');

    // Create shared chunk (not island, not client entry)
    writeFileSync(join(islandsDir, 'vendor-abc.js'), '// vendor 4096 bytes'.padEnd(4096, ' '), 'utf-8');

    const result = scanClientBuild(tmp);

    assertEquals(result.islands.length >= 2, true); // At least 2 islands found
    assertExists(result.islands.find((i) => i.name === 'island-counter-abc123.js'));
    assertExists(result.islands.find((i) => i.name === 'island-theme-def456.js'));
    assertExists(result.clientEntry);
    assertEquals(result.clientEntry!.name, 'client.js');
    // total should include all .js in islands/
    assertExists(result.totalJsBytes > 7000);
  } finally { cleanup(tmp); }
});

Deno.test('scanClientBuild skips non-js files', () => {
  const tmp = makeTempDir();
  try {
    const islandsDir = join(tmp, 'dist', 'client', 'islands');
    mkdirSync(islandsDir, { recursive: true });

    writeFileSync(join(islandsDir, 'island-counter.js'), '// js file', 'utf-8');
    writeFileSync(join(islandsDir, 'counter.css'), '.css { }', 'utf-8'); // Should be skipped
    writeFileSync(join(islandsDir, 'README.md'), '# readme', 'utf-8');   // Should be skipped

    const result = scanClientBuild(tmp);
    assertEquals(result.islands.length, 1);
  } finally { cleanup(tmp); }
});

// ─── scanSSGOutput ──────────────────────────────────────────

Deno.test('scanSSGOutput returns empty when no dist', () => {
  const result = scanSSGOutput('/nonexistent');
  assertEquals(result.length, 0);
});

Deno.test('scanSSGOutput finds HTML files recursively', () => {
  const tmp = makeTempDir();
  try {
    const distDir = join(tmp, 'dist');
    mkdirSync(join(distDir, 'blog'));
    writeFileSync(join(distDir, 'index.html'), '<html></html>', 'utf-8');
    writeFileSync(join(distDir, 'about.html'), '<html></html>', 'utf-8');
    writeFileSync(join(distDir, 'blog', 'post.html'), '<html></html>', 'utf-8');
    // Non-HTML should be ignored
    writeFileSync(join(distDir, 'style.css'), '{}', 'utf-8');

    const result = scanSSGOutput(tmp); // default outDir='dist'

    assertEquals(result.length, 3);
    assertExists(result.find((f) => f.name === 'index.html'));
    assertExists(result.find((f) => f.name === 'about.html'));
    assertExists(result.find((f) => f.path.includes('post.html')));
  } finally { cleanup(tmp); }
});
