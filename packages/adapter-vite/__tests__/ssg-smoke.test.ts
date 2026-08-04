/**
 * @openelement/adapter-vite - SSG smoke build test
 *
 * End-to-end verification of the official one-command build path:
 *   deno task build
 *
 * The command still runs the internal three-phase pipeline, but users
 * should experience it as a single production build.
 */

import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { existsSync } from '@std/fs';
import { dirname, join, toFileUrl } from '@std/path';
import { walkHtmlFileEntries } from '../src/internal/html-files.ts';

const __dirname = import.meta.dirname!;
const ROOT = dirname(dirname(dirname(__dirname)));
const WWW_DIR = join(ROOT, 'www');
const WWW_DIST = join(WWW_DIR, 'dist');

function hasServerEntry(): boolean {
  // ADR 0011 + S2 fix: Phase 1 artifacts (_virtual_open-hono-entry-*.js)
  // are cleaned from dist/assets/ by closeBundle because they are build-time
  // only and must not be deployed to public static hosting.
  // The real SSR bundle is at dist/server/entry.js.
  return existsSync(join(WWW_DIST, 'server', 'entry.js'));
}

function hasIslandChunk(prefix: string): boolean {
  const islandsDir = join(WWW_DIST, 'client', 'islands');
  if (!existsSync(islandsDir)) return false;
  return [...Deno.readDirSync(islandsDir)].some((entry) =>
    entry.name.startsWith(prefix) && entry.name.endsWith('.js')
  );
}

/** Page HTML under dist/, excluding the client/ and server/ build artifacts. */
function findPageHtmlFiles(dir: string): string[] {
  return walkHtmlFileEntries(dir)
    .map((entry) => entry.absolutePath)
    .filter((path) => !/[\/\\](client|server)[\/\\]/.test(path));
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
    assert(hasServerEntry(), 'Server entry bundle should exist');

    // ADR 0011: Build metadata is now in OpenElementBuildContext, not .openElement/build-metadata.json.
    // Verify the build produced real output instead.
    assert(existsSync(join(WWW_DIST, 'index.html')), 'index.html should exist after build');
  });

  await t.step('server SSR bundle exports route metadata and renderRoute', async () => {
    const serverEntry = join(WWW_DIST, 'server', 'entry.js');
    const serverBundle = Deno.readTextFileSync(serverEntry);
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

    const mod = await import(`${toFileUrl(serverEntry).href}?t=${Date.now()}`) as Record<
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

    const content = Deno.readTextFileSync(clientEntry);
    assertEquals(content.includes('@lit-labs/ssr-client'), false);
    assertEquals(content.includes('defer-hydration'), false);
  });

  await t.step('phase 3 output contains HTML, DSD, clean URLs', () => {
    const htmlFiles = findPageHtmlFiles(WWW_DIST);
    assert(htmlFiles.length > 0, 'Should have generated HTML files');

    for (const filePath of htmlFiles) {
      const content = Deno.readTextFileSync(filePath);
      assertStringIncludes(content.toLowerCase(), '<!doctype html>');
    }

    const indexHtml = Deno.readTextFileSync(join(WWW_DIST, 'index.html'));
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
    const roadmapHtml = Deno.readTextFileSync(join(WWW_DIST, 'roadmap', 'index.html'));
    assertStringIncludes(roadmapHtml, 'Web Components-native');
    assertStringIncludes(roadmapHtml, '<open-layout');
  });
});
