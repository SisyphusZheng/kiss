/** Host-agnostic route and asset contracts shared by app and build drivers. */
export type OpenElementRouteKind = 'page' | 'api';

export interface OpenElementRouteNode {
  kind: OpenElementRouteKind;
  path: string;
  filePath?: string;
  importPath?: string;
  tagName?: string;
  paramNames?: string[];
  children?: OpenElementRouteNode[];
  meta?: Record<string, unknown>;
}

export interface OpenElementRouteGraph {
  routes: OpenElementRouteNode[];
  basePath: string;
}

export interface CreateRouteGraphOptions {
  routes: OpenElementRouteNode[];
  basePath?: string;
}

export type OpenElementRouteGraphFactory = (
  options: CreateRouteGraphOptions,
) => OpenElementRouteGraph;

export interface OpenElementAssetManifestEntry {
  fileName: string;
  href: string;
  kind: 'script' | 'style' | 'asset';
  sizeBytes?: number;
  integrity?: string;
}

export interface OpenElementAssetManifest {
  basePath: string;
  entries: OpenElementAssetManifestEntry[];
}
