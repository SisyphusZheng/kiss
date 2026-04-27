/**
 * @kissjs/core - Entry Generators
 * Pure functions that generate auto-entry code strings.
 * No Vite dependency — safe to import in tests.
 *
 * v0.3.0: Unified client entry generation — build.ts and tests
 * both use generateClientEntry, eliminating duplicate implementations.
 */

import type { PackageIslandMeta } from './types.js';

/** Island entry for client bundle generation */
export interface ClientIslandEntry {
  /** Custom element tag name */
  tagName: string;
  /** Absolute or relative module path for import */
  modulePath: string;
}

/**
 * Generate the client entry point file content.
 *
 * Imports all island components and registers them as custom elements.
 * Handles both local islands (absolute paths) and package islands
 * (JSR/npm module paths).
 */
export function generateClientEntry(islands: ClientIslandEntry[]): string {
  if (islands.length === 0) {
    return '// KISS Client Entry — No islands detected, zero client JS needed\n';
  }

  const imports = islands
    .map((island, i) => {
      return `import Island_${i} from '${island.modulePath}';`;
    })
    .join('\n');

  const registrations = islands
    .map((island, i) => {
      return `if (!customElements.get('${island.tagName}')) customElements.define('${island.tagName}', Island_${i});`;
    })
    .join('\n');

  return `// KISS Client Entry (auto-generated — KISS Architecture: Islands only)
// DO NOT EDIT — changes will be overwritten
${imports}

// Register all island custom elements
${registrations}
`;
}
