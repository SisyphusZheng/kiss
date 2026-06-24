/**
 * @openelement/protocol - CEM manifest and compatibility contract types.
 */

import type { ComponentLayer, HydrationStrategy } from './framework.js';

// --- Manifest descriptors (CEM-compatible) ------------------------

export interface OpenElementAttribute {
  name: string;
  type?: string;
  default?: string;
  description?: string;
  reflects?: boolean;
  fieldName?: string;
}

export interface OpenElementMember {
  name: string;
  kind: 'field' | 'method' | 'property';
  type?: string;
  default?: string;
  description?: string;
  privacy?: 'public' | 'protected' | 'private';
  static?: boolean;
  readonly?: boolean;
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

export interface OpenElementCssProperty {
  name: string;
  default?: string;
  description?: string;
  type?: string;
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

export interface OpenElementPackageExtensions {
  openElementVersion?: string;
  adapter?: string;
  hasStylesheet?: boolean;
  cssPrefix?: string;
}

export interface OpenElementExport {
  name: string;
  path?: string;
  description?: string;
}

export interface OpenElementDeclaration {
  tagName: string;
  className?: string;
  superclassName?: string;
  attributes?: OpenElementAttribute[];
  members?: OpenElementMember[];
  events?: OpenElementEvent[];
  slots?: OpenElementSlot[];
  cssProperties?: OpenElementCssProperty[];
  cssParts?: OpenElementCssPart[];
  openElement?: OpenElementExtensions;
  description?: string;
}

export interface OpenElementModule {
  path: string;
  exports?: OpenElementExport[];
  declarations?: string[];
}

/** CEM-compatible package manifest */
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
  modules?: OpenElementModule[];
  openElement?: OpenElementPackageExtensions;
}

// --- Compatibility ------------------------------------------------

import type { CompatibilityClassification, CompatibilityTier } from './framework.js';
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

// --- Manifest validation ------------------------------------------

export interface ValidationDiagnostic {
  code: string;
  severity: 'error' | 'warning';
  message: string;
  tagName?: string;
  filePath?: string;
  fix?: string;
}

export interface ValidatedTag {
  tagName: string;
  valid: boolean;
  compatibility: CompatibilityTier;
  modulePath?: string;
  className?: string;
  ssr?: boolean;
  dsd?: boolean;
}

export interface ManifestValidationReport {
  packageName?: string;
  version?: string;
  valid: boolean;
  schemaVersion?: string;
  compatibility: CompatibilityTier;
  errors: ValidationDiagnostic[];
  warnings: ValidationDiagnostic[];
  tags: ValidatedTag[];
}
