/**
 * @openelement/adapter-vite — Island transform Vite plugin.
 *
 * Thin wrapper around @openelement/core/island-transform.
 * The core logic is a pure function with zero Vite dependency;
 * this file only adapts it to the Vite Plugin interface.
 */

import type { Plugin } from 'vite';
import { transformIslandSource } from '@openelement/core';

/** Vite plugin that injects `__island` and `__tagName` markers into island components */
export function islandTransformPlugin(islandsDir: string): Plugin {
  const normalizedDir = islandsDir.replace(/\\/g, '/');

  return {
    name: 'open:island-transform',

    transform(code, id) {
      try {
        const result = transformIslandSource(code, {
          islandsDir: normalizedDir,
          filePath: id.replace(/\\/g, '/'),
        });

        if (result.islands.length === 0) return null;

        return result.code;
      } catch (e) {
        // Route errors through Vite's this.error() for proper build failure reporting
        this.error((e as Error).message);
      }
    },
  };
}
