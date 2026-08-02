/**
 * manifest.ts - CEM manifest and compatibility contract types.
 */

import type { ComponentLayer, HydrationStrategy } from './framework.ts';

// --- Manifest descriptors (CEM-compatible) ------------------------

export interface OpenElementAttribute {
  name: string;
  type?: string;
  default?: string;
  description?: string;
  reflects?: boolean;
  fieldName?: string;
}

export interface OpenElementEvent {
  name: string;
  type?: string;
  description?: string;
}

export interface OpenElementSlot {
  name: string;
  description?: string;
}

export interface OpenElementCssPart {
  name: string;
  description?: string;
}

export type WebComponentAuthoringKind = 'basic-element' | 'third-party-wc';

export type WebComponentRenderCapability = 'ssr-dsd' | 'client-only' | 'unsupported';

export interface WebComponentContract {
  /** Default OpenElement Basic Element path, or explicit third-party WC interop. */
  authoring: WebComponentAuthoringKind;
  /** What the framework may do with this component during build/render. */
  render: WebComponentRenderCapability;
  /** Whether metadata came from OpenElement source, package manifest, or CEM. */
  metadataSource?: 'openElement' | 'manifest' | 'cem';
  /** Human-facing diagnostic for conservative or unsupported paths. */
  reason?: string;
}

export interface OpenElementExtensions {
  ssr?: boolean;
  dsd?: boolean;
  layer?: ComponentLayer;
  hydrate?: HydrationStrategy;
  module?: string;
  export?: string;
  contract?: WebComponentContract;
}

export interface OpenElementDeclaration {
  tagName: string;
  className?: string;
  superclassName?: string;
  attributes?: OpenElementAttribute[];
  events?: OpenElementEvent[];
  slots?: OpenElementSlot[];
  cssParts?: OpenElementCssPart[];
  contract?: WebComponentContract;
  openElement?: OpenElementExtensions;
  description?: string;
}

/** Package manifest of component declarations (not CEM-compatible; see packages/ui README). */
export interface OpenElementPackageManifest {
  schemaVersion: string;
  packageName: string;
  version: string;
  description?: string;
  author?: string;
  license?: string;
  homepage?: string;
  repository?: string;
  declarations: OpenElementDeclaration[];
}

// --- Compatibility ------------------------------------------------

import type { CompatibilityClassification, CompatibilityTier } from './framework.ts';
export type { CompatibilityClassification, CompatibilityTier };

export interface CemCompatibilityReport {
  totalClassified: number;
  ssrCapableCount: number;
  clientOnlyCount: number;
  rejectedCount: number;
  experimentalDomCount: number;
  classifications: CompatibilityClassification[];
  summary: string;
}
