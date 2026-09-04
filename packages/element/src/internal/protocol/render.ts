/**
 * ./render.ts — Render pipeline types.
 *
 * Types for the compiled server-render contract: the render error shape shared
 * with the error protocol, the public renderDsd output, and the SSR admission
 * decision recorded by the adapter's island scanner.
 */

import type { ComponentLayer, HydrationStrategy } from './framework.ts';

export interface RenderError {
  code: string;
  severity: 'error' | 'warning';
  phase: string;
  tagName: string;
  message: string;
  recoverable: boolean;
}

export interface HydrationHint {
  tagName: string;
  layer: ComponentLayer;
  hydrate?: HydrationStrategy;
}

export interface RenderOutput {
  html: string;
  errors: RenderError[];
  metrics: DsdRenderMetrics;
  hydrationHints: HydrationHint[];
}

export interface DsdRenderMetrics {
  tagName: string;
  renderTimeMs: number;
  templateSize: number;
  layer: ComponentLayer;
  hasError: boolean;
  nestingDepth: number;
}

export interface SsrAdmissionDecision {
  tagName: string;
  /**
   * Module path of the island declaration. Empty for 'foreign' decisions:
   * a foreign tag is consumed in JSX but declares no module the build owns.
   */
  modulePath: string;
  /**
   * 'foreign' (#979, 0.43.0-alpha.2): a third-party WC tag discovered by the
   * foreign-tag scanner in page/island JSX — recorded for visibility only;
   * SSR still treats it as an opaque passthrough (renderPath 'client-only').
   */
  source: 'local' | 'package' | 'nested' | 'foreign';
  renderPath: 'ssr+client' | 'client-only' | 'rejected';
  reason: string;
}
