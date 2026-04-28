/**
 * @kissjs/core - Island transform plugin
 * Detects island components and injects hydration markers.
 *
 * v0.3.0: This plugin ONLY injects __island and __tagName metadata markers.
 * Hydration is handled by the Vite-built client entry (entry-generators.ts),
 * which uses Lit's hydrate() from @lit-labs/ssr-client (bundled by Vite).
 *
 * The old generateHydrationScript() that produced inline <script> tags
 * has been removed — inline scripts can't import @lit-labs/ssr-client
 * (bare module specifier), and the inline hydrateElement() was not a
 * real Lit hydration (just DSD polyfill + removeAttribute).
 *
 * Web Standards alignment:
 * - Uses standard customElements.define() API
 * - No framework runtime — just native Custom Elements v1
 * - Declarative Shadow DOM provides the fallback (Level 0)
 */

import type { Plugin } from 'vite';
import { fileToTagName } from './route-scanner.js';

/** Vite plugin that injects `__island` and `__tagName` markers into island components */
export function islandTransformPlugin(islandsDir: string): Plugin {
  const normalizedIslandsDir = islandsDir.replace(/\\/g, '/');

  return {
    name: 'kiss:island-transform',

    transform(code, id) {
      const normalizedId = id.replace(/\\/g, '/');

      // Only transform files in the islands directory
      if (!normalizedId.includes(`/${normalizedIslandsDir}/`)) return null;

      // Extract tag name from file name
      const parts = normalizedId.split('/');
      const fileName = parts[parts.length - 1];
      const tagName = fileToTagName(fileName);

      // Validate tag name (must contain a hyphen for Custom Elements)
      if (!tagName.includes('-')) {
        this.warn(
          `Island file "${fileName}" must export a Custom Element with a hyphenated tag name. ` +
            `Got: "${tagName}". Skipping island registration.`,
        );
        return null;
      }

      // Inject only metadata markers. The Vite-built client entry handles
      // customElements.define() + Lit hydrate() — no registration code here.
      // This keeps the transform lightweight and ESM-safe.
      const injected = `
// --- KISS Island Markers (auto-injected by @kissjs/core) ---
export const __island = true;
export const __tagName = '${tagName}';
// --- End KISS Island Markers ---
`;

      return code + '\n' + injected;
    },
  };
}
