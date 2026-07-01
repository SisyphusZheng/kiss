/**
 * @openelement/protocol - Island contracts.
 */

import type { HydrationStrategy } from './framework.ts';

export interface IslandMeta {
  tagName: string;
  layer: string;
  isIsland: boolean;
  ssr?: boolean;
  dsd: boolean;
}

export interface IslandOptions {
  /** Hydration strategy:
   *   - 'load': load immediately when module is imported
   *   - 'idle': defer to requestIdleCallback (default)
   *   - 'visible': use IntersectionObserver to defer until element is visible
   *   - 'only': client-only render, no DSD/SSR output
   */
  strategy?: HydrationStrategy;

  /** Optional tag name override. If provided, used instead of the first argument. */
  tagName?: string;

  /**
   * Whether to use DSD for SSR rendering of this island.
   * @default true
   */
  dsd?: boolean;

  /**
   * Whether this island may be admitted into server rendering.
   */
  ssr?: boolean;
}

// --- Island transform types ---------------------------------------

export interface IslandTransformOptions {
  /** Directory containing island files (e.g. "app/islands") */
  islandsDir: string;
  /** Absolute or relative file path of the source being processed */
  filePath: string;
}

export interface IslandTransformResult {
  /** Transformed source code with markers */
  code: string;
  /** Detected island entries */
  islands: Array<{ tagName: string; filePath: string }>;
  /** Optional source map */
  map?: string;
}
