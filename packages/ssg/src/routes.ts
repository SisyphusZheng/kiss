/**
 * Route contracts for the SSG engine and generated entry descriptors.
 *
 * Data-contract home for route manifests and generated entry descriptors.
 * Implementation packages still own scanning, import-path generation, and
 * server-entry rendering.
 */

import type {
  CompatibilityClassification,
  HydrationStrategy,
  SsrAdmissionDecision,
} from '@openelement/core';

export type RouteKind = 'page' | 'api' | 'asset' | 'redirect';
export type RouteRenderingMode = 'auto' | 'static' | 'dynamic';
export type RouteStreamingMode = 'auto' | 'force' | false;
export type RouteRevalidate = false | number | `${number}s` | `${number}m` | `${number}h`;

export interface RouteRenderIntent {
  mode?: RouteRenderingMode;
  streaming?: RouteStreamingMode;
  revalidate?: RouteRevalidate;
}

export interface RouteProtocolEntry {
  id: string;
  path: string;
  kind: RouteKind;
  filePath?: string;
  renderIntent?: RouteRenderIntent;
}

export interface ImportDecl {
  from: string;
  names: string[];
  alias?: string;
}

export type CorsOriginConfig = string | string[] | { type: 'function'; body: string };

export interface CspConfig {
  policy?: string;
  nonce?: boolean;
  reportOnly?: boolean;
}

export interface MiddlewareDecl {
  kind: 'requestId' | 'logger' | 'cors' | 'securityHeaders' | 'csp';
  comment?: string;
  config?: {
    corsOrigin?: CorsOriginConfig;
    csp?: CspConfig;
  };
}

export interface ApiRouteDecl {
  kind: 'api';
  path: string;
  varName: string;
  filePath: string;
  importPath: string;
}

export interface PageRouteDecl {
  kind: 'page';
  path: string;
  varName: string;
  filePath: string;
  defaultTagName: string;
  tagName: string;
  importPath: string;
  isDynamic?: boolean;
  paramNames?: string[];
}

export type RouteDecl = ApiRouteDecl | PageRouteDecl;

export interface IslandDecl {
  tagName: string;
  modulePath: string;
  isPackage?: boolean;
  hydrate?: HydrationStrategy;
  ssr?: boolean;
  dsd?: boolean;
  source?: 'local' | 'package' | 'nested';
  reason?: string;
}

export interface SsrAdmissionPlan {
  renderableTags: string[];
  clientOnlyTags: string[];
  rejectedTags: string[];
  reasons: Record<string, string>;
  decisions: SsrAdmissionDecision[];
  cemClassifications?: CompatibilityClassification[];
}

export interface RendererDecl {
  varName: string;
  scope: string;
  importPath: string;
  depth: number;
}

export interface MiddlewareScopeDecl {
  varName: string;
  scope: string;
  importPath: string;
}

export interface DocumentConfig {
  lang: string;
  title: string;
  headExtras: string;
  allowHeadExtrasScripts: boolean;
}

export interface AppShellDecl {
  tagName: string;
  importPath: string;
  props: Record<string, unknown>;
}

export type ResolvedAppShell = false | AppShellDecl;

export interface AppShellPlan {
  default: ResolvedAppShell;
  layouts: Record<string, ResolvedAppShell>;
}

export interface EntryDescriptor {
  isSSG: boolean;
  imports: ImportDecl[];
  middleware: MiddlewareDecl[];
  apiRoutes: ApiRouteDecl[];
  pageRoutes: PageRouteDecl[];
  islands: IslandDecl[];
  ssrAdmissionPlan: SsrAdmissionPlan;
  cemClassifications?: CompatibilityClassification[];
  clientOnlyTags?: string[];
  renderers: RendererDecl[];
  middlewareScopes: MiddlewareScopeDecl[];
  document: DocumentConfig;
  appShell: AppShellPlan;
  upgradeStrategy?: HydrationStrategy;
  debugRoutes?: Array<{ path: string; type: string }>;
}
