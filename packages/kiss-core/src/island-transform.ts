/**
 * @kiss/vite - Island transform plugin
 * Detects island components and injects hydration markers.
 *
 * Phase 1 fix: The original CJS-style registration code
 * (`exports.default || module.exports?.default`) doesn't work in ESM.
 * Now we use a simple, correct approach: the hydration script (generated
 * by generateHydrationScript) handles ALL customElements.define() calls.
 * The transform only injects metadata markers (__island, __tagName).
 *
 * This is the "minimal augmentation" approach:
 * - SSR transform: only inject metadata (zero runtime overhead)
 * - Hydration script: handles registration (standard customElements API)
 * - No framework runtime between SSR and hydration
 *
 * Web Standards alignment:
 * - Uses standard customElements.define() API
 * - No framework runtime — just native Custom Elements v1
 * - Declarative Shadow DOM provides the fallback (Level 0)
 */

import type { Plugin } from 'vite'
import { fileToTagName } from './route-scanner.js'

export function islandTransformPlugin(islandsDir: string): Plugin {
  const normalizedIslandsDir = islandsDir.replace(/\\/g, '/')

  return {
    name: 'kiss:island-transform',

    transform(code, id) {
      const normalizedId = id.replace(/\\/g, '/')

      // Only transform files in the islands directory
      if (!normalizedId.includes(`/${normalizedIslandsDir}/`)) return null

      // Extract tag name from file name
      const parts = normalizedId.split('/')
      const fileName = parts[parts.length - 1]
      const tagName = fileToTagName(fileName)

      // Validate tag name (must contain a hyphen for Custom Elements)
      if (!tagName.includes('-')) {
        this.warn(
          `Island file "${fileName}" must export a Custom Element with a hyphenated tag name. ` +
            `Got: "${tagName}". Skipping island registration.`
        )
        return null
      }

      // Inject only metadata markers. The hydration script handles
      // customElements.define() — no registration code here.
      // This keeps the transform lightweight and ESM-safe.
      const injected = `
// --- KISS Island Markers (auto-injected by @kiss/vite) ---
export const __island = true;
export const __tagName = '${tagName}';
// --- End KISS Island Markers ---
`

      return code + '\n' + injected
    },
  }
}

/**
 * Generate the client-side island hydration script.
 * This is injected into the HTML for island hydration.
 *
 * This is the ONLY place where customElements.define() is called for islands.
 * It uses standard dynamic import() to load island modules and register them.
 *
 * Progressive enhancement: SSR HTML (with DSD) is visible even if
 * this script fails. The island components degrade to static HTML.
 */
export function generateHydrationScript(
  islands: Array<{ tagName: string; modulePath: string }>,
  strategy: 'eager' | 'lazy' | 'idle' | 'visible' = 'lazy'
): string {
  if (islands.length === 0) return ''

  const islandDefs = islands
    .map(
      i =>
        `  '${i.tagName}': () => import('${i.modulePath}')`
    )
    .join(',\n')

  const strategyCode = {
    eager: `
      // Eager: hydrate all islands immediately
      for (const [tagName, loader] of Object.entries(islandLoaders)) {
        hydrateIsland(tagName, loader);
      }
    `,
    lazy: `
      // Lazy: hydrate on requestIdleCallback
      const hydrateAll = () => {
        for (const [tagName, loader] of Object.entries(islandLoaders)) {
          hydrateIsland(tagName, loader);
        }
      };
      if ('requestIdleCallback' in window) {
        requestIdleCallback(hydrateAll);
      } else {
        setTimeout(hydrateAll, 200);
      }
    `,
    idle: `
      // Idle: wait for page to be idle
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          for (const [tagName, loader] of Object.entries(islandLoaders)) {
            hydrateIsland(tagName, loader);
          }
        });
      } else {
        window.addEventListener('load', () => {
          for (const [tagName, loader] of Object.entries(islandLoaders)) {
            hydrateIsland(tagName, loader);
          }
        });
      }
    `,
    visible: `
      // Visible: hydrate when island scrolls into view
      const observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const tagName = entry.target.tagName.toLowerCase();
            if (islandLoaders[tagName]) {
              hydrateIsland(tagName, islandLoaders[tagName]);
              observer.unobserve(entry.target);
            }
          }
        }
      });
      for (const tagName of Object.keys(islandLoaders)) {
        document.querySelectorAll(tagName).forEach(el => observer.observe(el));
      }
    `,
  }[strategy]

  return `<script type="module" data-kiss-hydrate>
// KISS Island Hydration Script
// Progressive enhancement: SSR HTML is visible even if this fails.
(function() {
  const islandLoaders = {
${islandDefs}
  };

  async function hydrateIsland(tagName, loader) {
    try {
      const mod = await loader();
      const ElementClass = mod.default;
      if (!ElementClass) {
        console.warn('[KISS] Island module has no default export:', tagName);
        return;
      }
      if (!customElements.get(tagName)) {
        customElements.define(tagName, ElementClass);
      }
      // Wait for upgrade of existing elements
      await customElements.whenDefined(tagName);
    } catch (error) {
      console.warn('[KISS] Island <' + tagName + '> hydration failed:', error);
      // Progressive enhancement: SSR HTML still visible
      document.querySelectorAll(tagName).forEach(el => {
        el.setAttribute('data-kiss-hydration-error', 'true');
      });
    }
  }

${strategyCode}
})();
</script>`
}
