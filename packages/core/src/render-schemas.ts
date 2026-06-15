/**
 * @openelement/core — Render pipeline types.
 *
 * Types for the DSD rendering pipeline: component models, render inputs/outputs,
 * metrics, diagnostics, build reports, ISR records, and DOM simulation.
 * Consumed by render-dsd.ts, render-dsd-stream.ts, dsd-collector.ts,
 * adapter-registry.ts, and DSD build reporting.
 *
 * @see ADR-0094: Core Type Consolidation — Eliminate types.ts
 */

import type { VNode } from './vnode.js';
import type { ComponentLayer, HydrationStrategy, StrategySource } from './schemas.js';

export type { ComponentLayer, HydrationStrategy, StrategySource };

// Import + re-export shared renderer types from protocol
import type {
  DsdOptions,
  DsdRenderMetrics,
  HydrationHint,
  RendererProtocol,
  RenderError,
  RenderErrorSeverity,
  RenderHooks,
  RenderInput,
  RenderOutput,
  RenderPhase,
} from '@openelement/protocol/renderer';
export type {
  DsdOptions,
  DsdRenderMetrics,
  HydrationHint,
  RendererProtocol,
  RenderError,
  RenderErrorSeverity,
  RenderHooks,
  RenderInput,
  RenderOutput,
  RenderPhase,
};

// Core-specific extensions
export type RenderErrorCode =
  | 'LESS_RENDER_INSTANTIATE_FAILED'
  | 'LESS_RENDER_INVALID_OUTPUT'
  | 'LESS_RENDER_RENDER_FAILED'
  | 'LESS_RENDER_NESTED_FAILED'
  | 'LESS_RENDER_STYLE_FAILED'
  | 'LESS_RENDER_SERIALIZE_FAILED';

// --- DSD component constructor (moved from dsd-element.ts) -------

export interface DsdComponentConstructor extends CustomElementConstructor {
  styles?:
    | import('./style-sheet.js').StyleSheetLike
    | import('./style-sheet.js').StyleSheetLike[];
  tagName?: string;
  renderMode?: 'shadow' | 'light';
  observedAttributes?: string[];
}

// --- DSD component model -----------------------------------------

export interface DsdComponent {
  render(): VNode | null;
  connectedCallback?(): void;
  layer?: ComponentLayer;
  [key: string]: unknown;
}

export interface DsdReport {
  totalComponents: number;
  dsdComponents: number;
  hydratedComponents: number;
  pureIslands: number;
  totalDsdSize: number;
  maxNestingDepth: number;
}

// --- DSD diagnostics & summaries ---------------------------------

export interface DsdPageDiagnostics {
  path: string;
  errors: RenderError[];
  hydrationHints: HydrationHint[];
  componentCount: number;
  renderTimeMs: number;
}

export interface DsdMetricsSummary {
  totalComponents: number;
  totalRenderTimeMs: number;
  avgRenderTimeMs: number;
  totalTemplateSize: number;
  maxNestingDepth: number;
  errorComponentCount: number;
}

export interface DsdHydrationHintSummary {
  totalHints: number;
  interactiveCount: number;
  pureIslandCount: number;
}

export interface DsdHydrationStrategySummary {
  load: number;
  idle: number;
  visible: number;
  only: number;
  clientOnlyExcluded: number;
}

// --- Manifest decisions ------------------------------------------

export interface ManifestDecision {
  tagName: string;
  packageName: string;
  ssr: boolean;
  dsd: boolean;
  hydrate?: string;
  strategySource?: StrategySource;
  renderPath: 'ssr+client' | 'client-only';
  reason?: string;
  source?: 'local' | 'package' | 'nested';
}

export interface SsrAdmissionDecision {
  tagName: string;
  modulePath: string;
  source: 'local' | 'package' | 'nested';
  renderPath: 'ssr+client' | 'client-only' | 'rejected';
  reason: string;
}

// --- Build report ------------------------------------------------

export interface DsdBuildReport {
  reportVersion: string;
  timestamp: string;
  totalPages: number;
  totalErrors: number;
  renderErrors: DsdPageDiagnostics[];
  metricsSummary: DsdMetricsSummary;
  hydrationHintSummary: DsdHydrationHintSummary;
  hydrationStrategySummary?: DsdHydrationStrategySummary;
  manifestDecisions?: ManifestDecision[];
  admissionDecisions?: SsrAdmissionDecision[];
  cemCompatibility?: import('./compat-schemas.js').CemCompatibilityReport;
  domSimulation?: DomSimulationReport;
  isrRoutes?: IsrRouteRecord[];
}

// --- ISR record --------------------------------------------------

export interface IsrRouteRecord {
  path: string;
  revalidate: number;
  cacheKey: string;
}

// --- DOM simulation ----------------------------------------------

export interface DomSimulationReport {
  enabled: boolean;
  strategy: string;
  attemptedCount: number;
  succeededCount: number;
  failedCount: number;
  timeoutCount: number;
  attempts: DomSimulationAttempt[];
}

export interface DomSimulationAttempt {
  tagName: string;
  success: boolean;
  renderTimeMs: number;
  byteSize?: number;
  error?: string;
  timedOut: boolean;
  fallback: 'client-only' | 'none';
}
