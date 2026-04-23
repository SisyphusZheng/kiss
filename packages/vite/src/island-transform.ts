/**
 * @hvl/vite - Island transform plugin
 * Detects island components and injects hydration markers.
 */

import type { Plugin } from 'vite'
import { fileToTagName } from './route-scanner.js'

const VIRTUAL_ISLAND_REGISTRY = '\0virtual:hvl-island-registry'

export function islandTransformPlugin(islandsDir: string): Plugin {
  const normalizedIslandsDir = islandsDir.replace(/\\/g, '/')

  return {
    name: 'hvl:island-transform',

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

      // Inject island markers and client-side registration
      const injected = `
// --- HVL Island Markers (auto-injected) ---
export const __island = true;
export const __tagName = '${tagName}';

// Client-side: auto-register Custom Element
if (typeof customElements !== 'undefined' && !customElements.get('${tagName}')) {
  // Will be defined after module evaluation
  const __HVL_IslandClass = typeof exports !== 'undefined' ? (exports.default || module.exports?.default) : undefined;
  if (__HVL_IslandClass) {
    customElements.define('${tagName}', __HVL_IslandClass);
  }
}
// --- End HVL Island Markers ---
`

      return code + '\n' + injected
    },
  }
}

/**
 * Generate the client-side island hydration script.
 * This is injected into the HTML for island hydration.
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

  return `<script type="module" data-hvl-hydrate>
// HVL Island Hydration Script
(function() {
  const islandLoaders = {
${islandDefs}
  };

  async function hydrateIsland(tagName, loader) {
    try {
      const mod = await loader();
      const ElementClass = mod.default;
      if (!ElementClass) {
        console.warn('[HVL] Island module has no default export:', tagName);
        return;
      }
      if (!customElements.get(tagName)) {
        customElements.define(tagName, ElementClass);
      }
      // Wait for upgrade of existing elements
      await customElements.whenDefined(tagName);
    } catch (error) {
      console.warn('[HVL] Island <' + tagName + '> hydration failed:', error);
      // Mark as failed — SSR HTML still visible
      document.querySelectorAll(tagName).forEach(el => {
        el.setAttribute('data-hvl-hydration-error', 'true');
      });
    }
  }

${strategyCode}
})();
</script>`
}
