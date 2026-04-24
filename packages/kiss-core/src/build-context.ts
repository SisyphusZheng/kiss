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

import type { ResolvedConfig } from 'vite'
import type { FrameworkOptions } from './types.js'

export class KissBuildContext {
  /** The generated Hono entry module code (virtual module content) */
  honoEntryCode: string = ''

  /** Island tag names discovered during route scanning */
  islandTagNames: string[] = []

  /** Whether the SSR+client build has completed */
  buildCompleted: boolean = false

  /** Whether the client-side build has been triggered (prevents re-entry across plugin instances) */
  clientBuildTriggered: boolean = false

  /** Vite resolved config (set in configResolved hook) */
  resolvedConfig: ResolvedConfig | null = null

  /** Resolved framework options with defaults applied */
  readonly options: FrameworkOptions

  constructor(options: FrameworkOptions) {
    this.options = options
  }

  /** Reset all mutable state (for watch mode / testing) */
  reset(): void {
    this.honoEntryCode = ''
    this.islandTagNames = []
    this.buildCompleted = false
    this.clientBuildTriggered = false
    this.resolvedConfig = null
  }
}
