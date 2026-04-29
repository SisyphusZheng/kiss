/**
 * @kissjs/core - Kiss Build Context
 *
 * Shared mutable state for all KISS Vite plugins.
 * Replaces the closure-captured variables (honoEntryCode, scannedIslandTagNames, etc.)
 * with a single object that's explicitly passed around.
 *
 * Benefits:
 * - Each build gets a fresh context (safe for concurrent builds / tests)
 * - Plugins read/write state through the same object (no hidden coupling)
 * - State is resettable (for testing and watch mode)
 */

import type { Alias, ResolvedConfig } from 'vite';
import type { FrameworkOptions, PackageIslandMeta } from './types.js';

export class KissBuildContext {
  /** The generated Hono entry module code (virtual module content) */
  honoEntryCode: string = '';

  /** Island tag names discovered during route scanning (local islands) */
  islandTagNames: string[] = [];

  /** Package islands discovered from npm/JSR packages */
  packageIslands: PackageIslandMeta[] = [];

  /** Whether the SSR+client build has completed */
  buildCompleted: boolean = false;

  /** Vite resolved config (set in configResolved hook) */
  resolvedConfig: ResolvedConfig | null = null;

  /**
   * User-provided resolve.alias in its original format.
   * Vite accepts both Record<string, string> and Alias[].
   * Saved during the config() hook so SSG can pass it to the internal Vite SSR server.
   * (config.resolve.alias is Vite's internal Alias[] after resolution, which is
   * NOT compatible with createServer's resolve.alias input format.)
   */
  userResolveAlias: Record<string, string> | Alias[] | null = null;

  /** Resolved framework options with defaults applied */
  readonly options: FrameworkOptions;

  constructor(options: FrameworkOptions) {
    this.options = options;
  }

  /** Reset all mutable state (for watch mode / testing) */
  reset(): void {
    this.honoEntryCode = '';
    this.islandTagNames = [];
    this.packageIslands = [];
    this.buildCompleted = false;
    this.resolvedConfig = null;
    this.userResolveAlias = null;
  }
}
