/**
 * @openelement/adapter-vite - SSG smoke build test
 *
 * End-to-end verification of the official one-command build path:
 *   deno task build
 *
 * The command still runs the internal three-phase pipeline, but users
 * should experience it as a single production build.
 */

import { assert, assertEquals, assertStringIncludes } from 'jsr:@std/assert@^1.0.0';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { existsSync, readdirSync, readFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = dirname(dirname(dirname(__dirname)));
const WWW_DIR = join(ROOT, 'www');
const WWW_DIST = join(WWW_DIR, 'dist');

function hasSsrBundle(): boolean {
  // ADR 0011 + S2 fix: Phase 1 artifacts (_virtual_open-hono-entry-*.js)
  // are cleaned from dist/assets/ by closeBundle because they are build-time
  // only and must not be deployed to public static hosting.
  // The real SSR bundle is at dist/server/entry.js.
  return hasServerEntry();
}

function hasServerEntry(): boolean {
  return existsSync(join(WWW_DIST, 'server', 'entry.js'));
}

function hasIslandChunk(prefix: string): boolean {
  const islandsDir = join(WWW_DIST, 'client', 'islands');
  if (!existsSync(islandsDir)) return false;
  return readdirSync(islandsDir).some((file) => file.startsWith(prefix) && file.endsWith('.js'));
}

function findHtmlFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (
      entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'client' &&
      entry.name !== 'server'
    ) {
      results.push(...findHtmlFiles(fullPath));
    } else if (entry.name.endsWith('.html')) {
      results.push(fullPath);
    }
  }
  return results;
}

async function ensureDocsBuild(): Promise<void> {
  // Always do a fresh build — caching across CI runs hides regressions
  const command = new Deno.Command(Deno.execPath(), {
    args: ['task', 'build'],
    cwd: ROOT,
    stdout: 'piped',
    stderr: 'piped',
  });
  const output = await command.output();
  const stdout = new TextDecoder().decode(output.stdout);
  const stderr = new TextDecoder().decode(output.stderr);
  assertEquals(output.code, 0, `${stdout}\n${stderr}`);
}

Deno.test('SSG smoke: one-command build produces trusted www output', async (t) => {
  await ensureDocsBuild();

  await t.step('phase 1 output exists with SSR bundle and HTML', () => {
    assert(hasSsrBundle(), 'SSR bundle should exist');
    assert(hasServerEntry(), 'Server entry bundle should exist');

    // ADR 0011: Build metadata is now in OpenElementBuildContext, not .openElement/build-metadata.json.
    // Verify the build produced real output instead.
    assert(existsSync(join(WWW_DIST, 'index.html')), 'index.html should exist after build');
  });

  await t.step('server SSR bundle exports route metadata and renderRoute', async () => {
    const serverEntry = join(WWW_DIST, 'server', 'entry.js');
    const serverBundle = readFileSync(serverEntry, 'utf-8');
    assertEquals(
      /from\s+["']sanitize-html["']/.test(serverBundle),
      false,
      'SSR bundle must not leak a bare sanitize-html import',
    );
    assertEquals(
      /(?:from\s+|import\s*\()["']npm:/.test(serverBundle),
      false,
      'SSR bundle must be portable to Node and must not leak npm: imports',
    );

    const mod = await import(`${pathToFileURL(serverEntry).href}?t=${Date.now()}`) as Record<
      string,
      unknown
    >;
    assert(typeof mod.default === 'object', 'SSR bundle should export the Hono app');
    assertEquals(typeof mod.renderRoute, 'function');
    assert(Array.isArray(mod.routeInfo), 'SSR bundle should export routeInfo');

    const result = await (mod.renderRoute as (
      path: string,
      opts?: Record<string, unknown>,
    ) => Promise<
      {
        html: string;
        errors: unknown[];
        hydrationHints: unknown[];
        componentCount: number;
        renderTimeMs: number;
      }
    >)('/roadmap', { lang: 'en' });
    assertStringIncludes(result.html, '<!DOCTYPE html>');
    assertStringIncludes(result.html, 'Web Components-native');
    assertStringIncludes(result.html, '<open-layout');
  });

  await t.step('phase 2 output exists without legacy SSR client runtime', () => {
    const manifestPath = join(WWW_DIST, 'client', '.vite', 'manifest.json');
    const clientEntry = join(WWW_DIST, 'client', 'islands', 'client.js');
    assert(existsSync(manifestPath), 'Client manifest should exist');
    assert(existsSync(clientEntry), 'Client entry should exist');

    const content = readFileSync(clientEntry, 'utf-8');
    assertEquals(content.includes('@lit-labs/ssr-client'), false);
    assertEquals(content.includes('defer-hydration'), false);
  });

  await t.step('phase 3 output contains HTML, DSD, clean URLs', () => {
    const htmlFiles = findHtmlFiles(WWW_DIST);
    assert(htmlFiles.length > 0, 'Should have generated HTML files');

    for (const filePath of htmlFiles) {
      const content = readFileSync(filePath, 'utf-8');
      assertStringIncludes(content.toLowerCase(), '<!doctype html>');
    }

    const indexHtml = readFileSync(join(WWW_DIST, 'index.html'), 'utf-8');
    assert(
      indexHtml.includes('shadowrootmode="open"') || indexHtml.includes('<template shadowroot'),
      'SSG output should preserve Declarative Shadow DOM',
    );
    assertStringIncludes(indexHtml, '<open-layout');
    assertEquals(
      hasIslandChunk('open-layout-'),
      false,
      'Static site layout must not ship as a UI island',
    );
    assert(existsSync(join(WWW_DIST, 'roadmap', 'index.html')), 'Clean URL output should exist');
    assertEquals(
      existsSync(join(WWW_DIST, 'en', 'roadmap', 'index.html')),
      false,
      'default locale must not overwrite or duplicate the canonical output',
    );
    const roadmapHtml = readFileSync(join(WWW_DIST, 'roadmap', 'index.html'), 'utf-8');
    assertStringIncludes(roadmapHtml, 'Web Components-native');
    assertStringIncludes(roadmapHtml, '<open-layout');
  });
});
