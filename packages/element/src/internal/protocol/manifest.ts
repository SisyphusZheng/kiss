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

export interface OpenElementExtensions {
  ssr?: boolean;
  dsd?: boolean;
  layer?: ComponentLayer;
  hydrate?: HydrationStrategy;
  module?: string;
  export?: string;
}

export interface OpenElementDeclaration {
  tagName: string;
  className?: string;
  superclassName?: string;
  attributes?: OpenElementAttribute[];
  events?: OpenElementEvent[];
  slots?: OpenElementSlot[];
  cssParts?: OpenElementCssPart[];
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
