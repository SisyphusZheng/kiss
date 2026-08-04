/**
 * ./render.ts — Render pipeline types.
 *
 * Types for the DSD rendering pipeline: component models, render inputs/outputs,
 * metrics, diagnostics, build reports, ISR records, and DOM simulation.
 */

import type { VNode } from './vnode.ts';
import type { ComponentLayer, HydrationStrategy } from './framework.ts';

export type RenderPhase = 'instantiate' | 'render' | 'nested' | 'style' | 'serialize';

export interface RenderError {
  code: string;
  severity: 'error' | 'warning';
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

export interface SsrAdmissionDecision {
  tagName: string;
  modulePath: string;
  source: 'local' | 'package' | 'nested';
  renderPath: 'ssr+client' | 'client-only' | 'rejected';
  reason: string;
}
