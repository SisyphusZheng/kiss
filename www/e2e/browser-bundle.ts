/**
 * Bundle a repo TypeScript module into a single ES-module string that a
 * browser probe can import (via a Blob URL) inside page.evaluate.
 *
 * The built www site does not ship the app router/SPA modules, so e2e specs
 * that must exercise their real behavior — not a test-side re-implementation
 * — bundle the actual sources in memory with the project's own Vite.
 */

import { build } from 'vite';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

// The SPA/router sources import '@openelement/element' at runtime (`createLogger`,
// and JSX via jsx-runtime). The e2e bare bundle runs with `configFile: false`, so it
// does not inherit the workspace alias that the real www build gets from
// adapter-vite's Vite plugin. Mirror that alias here so Rolldown can resolve the
// package from source. See www/vite.config.ts and packages/adapter-vite workspace-alias.
const ELEMENT_ENTRY = fileURLToPath(new URL('../../packages/element/src/index.ts', import.meta.url));
const ELEMENT_DIR = fileURLToPath(new URL('../../packages/element/src', import.meta.url));

const bundleCache = new Map<string, Promise<string>>();

/** Bundle `entry` (a file: URL) as an unminified ES module, cached per run. */
export function bundleModuleForBrowser(entry: URL): Promise<string> {
  const key = entry.href;
  let cached = bundleCache.get(key);
  if (!cached) {
    cached = (async () => {
      const result = await build({
        logLevel: 'silent',
        configFile: false,
        resolve: {
          alias: {
            '@openelement/element': ELEMENT_ENTRY,
            '@openelement/element/jsx-runtime': resolve(ELEMENT_DIR, 'jsx-runtime.ts'),
          },
        },
        esbuild: { jsx: 'automatic', jsxImportSource: '@openelement/element' },
        build: {
          write: false,
          minify: false,
          lib: { entry: fileURLToPath(entry), formats: ['es'], name: 'e2eProbe' },
        },
      });
      const outputs = (Array.isArray(result) ? result : [result]).flatMap((single) =>
        'output' in single ? single.output : []
      );
      const code = outputs
        .map((chunk) => (chunk.type === 'chunk' ? chunk.code : ''))
        .filter(Boolean)
        .join('\n');
      if (!code) throw new Error(`[e2e] empty browser bundle for ${key}`);
      return code;
    })();
    bundleCache.set(key, cached);
  }
  return cached;
}
