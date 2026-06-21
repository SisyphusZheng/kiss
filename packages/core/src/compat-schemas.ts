/**
 * @openelement/core — Compatibility & validation schemas.
 *
 * Types for CEM compatibility classification, manifest validation,
 * and build-time diagnostic reporting. Consumed by compat-check,
 * dsd-report generation, and CI gates.
 *
 * @see ADR-0094: Core Type Consolidation — Eliminate types.ts
 */

// --- Compatibility tier — sourced from protocol --------------------

import type { CompatibilityClassification, CompatibilityTier } from './schemas.js';
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
