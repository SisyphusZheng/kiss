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
const REQUEST_TIME_FIXTURE = join(__dirname, '../__fixtures__/request-time');

async function pathExists(path: string): Promise<boolean> {
  try {
    await Deno.stat(path);
    return true;
  } catch {
    return false;
  }
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

// v0.44 alpha.8 (ADR-0143): www/app still ships the legacy authoring surface
// (definePage render functions); it migrates in the www phase of the 0.44
// reentry. The adapter-side coverage this test carried — clean pure-static
// tree, zero-runtime delivery, trusted output — is meanwhile pinned by
// static-only-build.test.ts and v044-delivery/static-only-zero-runtime.test.ts
// against the migrated fixtures. Re-enable when www compiles.
Deno.test({
  name: 'SSG smoke: one-command build produces trusted www output',
  ignore: true,
  fn: async (t) => {
    await ensureDocsBuild();

    await t.step('phase 1 output exists with HTML and no leftover SSR bundle (#953)', async () => {
      // ADR 0011 + S2 fix: Phase 1 artifacts (_virtual_open-hono-entry-*.js)
      // are cleaned from dist/assets/ by closeBundle because they are build-time
      // only and must not be deployed to public static hosting.
      // #953: www declares no renderIntent 'dynamic' routes, so the build-time
      // SSR bundle (dist/server/entry.js) must be removed entirely — a
      // pure-static deployable tree has no dist/server.
      assertEquals(
        await pathExists(join(WWW_DIST, 'server')),
        false,
        'pure-static www build must not ship dist/server',
      );

      // ADR 0011: Build metadata is now in OpenElementBuildContext, not .openElement/build-metadata.json.
      // Verify the build produced real output instead.
      assert(existsSync(join(WWW_DIST, 'index.html')), 'index.html should exist after build');
    });

    /**
     * Collect the string literals that immediately follow an import statement
     * (`import("...")` / `from "..."`) — real module specifiers. Data strings
     * (e.g. code samples in doc pages like `import { marked } from 'npm:marked@^15'`)
     * never sit right after `import(`/`from`, so they are not collected; any other
     * string literal is skipped over whole, so its contents are never scanned.
     */
    function importSpecifierStrings(source: string): string[] {
      const found: string[] = [];
      let i = 0;
      while (i < source.length) {
        const ch = source[i];
        if (ch !== '"' && ch !== "'" && ch !== '`') {
          i++;
          continue;
        }
        let j = i - 1;
        while (j >= 0 && /\s/.test(source[j])) j--;
        const prefix = source.slice(Math.max(0, j - 8), j + 1);
        const quote = ch;
        if (!/import\($/.test(prefix) && !/\bfrom$/.test(prefix)) {
          i++;
          while (i < source.length) {
            if (source[i] === '\\') {
              i += 2;
            } else if (source[i] === quote) {
              i++;
              break;
            } else {
              i++;
            }
          }
          continue;
        }
        let k = i + 1;
        let value = '';
        while (k < source.length) {
          if (source[k] === '\\') {
            value += source[k + 1] ?? '';
            k += 2;
          } else if (source[k] === quote) {
            break;
          } else {
            value += source[k];
            k++;
          }
        }
        found.push(value);
        i = k + 1;
      }
      return found;
    }

    await t.step('server SSR bundle exports route metadata and renderRoute', async () => {
      // #953: the pure-static www tree no longer keeps its SSR bundle, so this
      // introspection runs against the request-time fixture instead — a project
      // with 'dynamic' routes, where dist/server is deployable output.
      const serverEntry = join(REQUEST_TIME_FIXTURE, 'dist/server/entry.js');
      if (!(await pathExists(serverEntry))) {
        const build = await new Deno.Command(Deno.execPath(), {
          args: ['task', 'fixture:request-time:build'],
          cwd: ROOT,
          stdout: 'inherit',
          stderr: 'inherit',
        }).output();
        assert(build.success, 'request-time fixture build failed');
      }
      const serverBundle = Deno.readTextFileSync(serverEntry);
      const specifiers = importSpecifierStrings(serverBundle);
      assertEquals(
        specifiers.includes('sanitize-html'),
        false,
        'SSR bundle must not leak a bare sanitize-html import',
      );
      assertEquals(
        specifiers.some((s) => s.startsWith('npm:')),
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
      >)('/', { lang: 'en' });
      assertStringIncludes(result.html, '<!DOCTYPE html>');
      assertStringIncludes(result.html, 'request-time fixture home');
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
  },
});
