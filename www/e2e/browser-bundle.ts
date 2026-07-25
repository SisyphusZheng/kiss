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
