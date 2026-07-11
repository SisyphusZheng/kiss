/**
 * ./index.ts — Render pipeline types.
 *
 * Types for the DSD rendering pipeline: component models, render inputs/outputs,
 * metrics, diagnostics, build reports, ISR records, and DOM simulation.
 */

import type { VNode } from './vnode.ts';
import type { ComponentLayer, HydrationStrategy, StrategySource } from './framework.ts';
import type { CemCompatibilityReport } from './manifest.ts';

export type RenderPhase = 'instantiate' | 'render' | 'nested' | 'style' | 'serialize';
export type RenderErrorSeverity = 'error' | 'warning';

export interface RenderError {
  code: string;
  severity: RenderErrorSeverity;
  phase: string;
  tagName: string;
  message: string;
  recoverable: boolean;
}

export interface RenderInput {
  tagName: string;
  componentClass: CustomElementConstructor;
  props: Record<string, unknown>;
  dsdOptions?: DsdOptions;
  nestingDepth: number;
}

export interface HydrationHint {
  tagName: string;
  layer: ComponentLayer;
  strategy?: HydrationStrategy;
}

export interface RenderOutput {
  html: string;
  errors: RenderError[];
  metrics: DsdRenderMetrics;
  hydrationHints: HydrationHint[];
}

export interface RenderHooks {
  beforeRender?: (input: RenderInput) => void;
  afterRender?: (output: RenderOutput) => void;
  onError?: (error: RenderError) => void;
}

export interface DsdOptions {
  delegatesFocus?: boolean;
  clonable?: boolean;
  serializable?: boolean;
  slotAssignment?: 'named' | 'manual';
  customElementRegistry?: boolean;
  layer?: ComponentLayer;
}

export interface DsdRenderMetrics {
  tagName: string;
  renderTimeMs: number;
  templateSize: number;
  layer: ComponentLayer;
  hasError: boolean;
  nestingDepth: number;
}

// Core-specific extensions
export type RenderErrorCode =
  | 'OPEN_ELEMENT_RENDER_INSTANTIATE_FAILED'
  | 'OPEN_ELEMENT_RENDER_INVALID_OUTPUT'
  | 'OPEN_ELEMENT_RENDER_RENDER_FAILED'
  | 'OPEN_ELEMENT_RENDER_NESTED_FAILED'
  | 'OPEN_ELEMENT_RENDER_STYLE_FAILED'
  | 'OPEN_ELEMENT_RENDER_SERIALIZE_FAILED';

// --- DSD component constructor ------------------------------------

import type { StyleSheetLike } from './style-sheet.ts';

export interface DsdComponentConstructor extends CustomElementConstructor {
  styles?: StyleSheetLike | StyleSheetLike[];
  tagName?: string;
  renderMode?: 'shadow' | 'light';
  observedAttributes?: string[];
}

// --- DSD component model ------------------------------------------

export interface DsdComponent {
  render(): VNode | null;
  connectedCallback?(): void;
  layer?: ComponentLayer;
  [key: string]: unknown;
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
  cemCompatibility?: CemCompatibilityReport;
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
