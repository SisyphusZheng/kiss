/**
 * OpenElement SSG driver contracts.
 *
 * The SSG engine owns route, render, asset, and filesystem concepts. Hono and
 * Vite are official default drivers that adapt those concepts to concrete
 * tooling.
 */

import type {
  OpenElementAssetManifest,
  OpenElementAssetManifestEntry,
  OpenElementRouteGraph,
  OpenElementRouteKind,
  OpenElementRouteNode,
} from '@openelement/app/model';
import type { RouteEntry } from '@openelement/protocol/framework';
import type { HonoEntryOptions } from './entry-renderer.ts';
import { generateHonoEntryCode } from './entry-renderer.ts';

export interface HonoSsgRequestDriver {
  name: 'hono';
  routeGraph(routes: RouteEntry[], basePath?: string): OpenElementRouteGraph;
  entryCode(routes: RouteEntry[], options?: HonoEntryOptions): string;
}

export interface ViteSsgAssetDriver {
  name: 'vite';
  assetManifest(input: ViteManifestLike, basePath?: string): OpenElementAssetManifest;
}

export type ViteManifestLike = Record<
  string,
  {
    file?: string;
    css?: string[];
    assets?: string[];
  }
>;

export function createHonoRequestDriver(): HonoSsgRequestDriver {
  return {
    name: 'hono',
    routeGraph: createRouteGraphFromEntries,
    entryCode: (routes, options = {}) => generateHonoEntryCode(routes, options),
  };
}

export function createViteAssetDriver(): ViteSsgAssetDriver {
  return {
    name: 'vite',
    assetManifest: createAssetManifestFromViteManifest,
  };
}

/** Map scanned route entries into the OpenElement app RouteGraph contract. */
export function createRouteGraphFromEntries(
  routes: RouteEntry[],
  basePath = '/',
): OpenElementRouteGraph {
  const routeNodes = routes
    .filter((route) => route.type === 'page' || route.type === 'api')
    .map(routeEntryToNode);

  return {
    basePath: normalizeRouteBasePath(basePath),
    routes: routeNodes,
  };
}

export function createAssetManifestFromViteManifest(
  manifest: ViteManifestLike,
  basePath = '/',
): OpenElementAssetManifest {
  const entries: OpenElementAssetManifestEntry[] = [];

  for (const value of Object.values(manifest)) {
    if (value.file) {
      entries.push(toAssetEntry(value.file, 'script', basePath));
    }
    for (const css of value.css ?? []) {
      entries.push(toAssetEntry(css, 'style', basePath));
    }
    for (const asset of value.assets ?? []) {
      entries.push(toAssetEntry(asset, 'asset', basePath));
    }
  }

  return {
    basePath: normalizeBasePath(basePath),
    entries,
  };
}

function routeEntryToNode(route: RouteEntry): OpenElementRouteNode {
  const node: OpenElementRouteNode = {
    kind: route.type as OpenElementRouteKind,
    path: route.path,
    filePath: route.filePath,
    importPath: route.filePath,
  };
  if (route.tagName !== undefined) node.tagName = route.tagName;
  if (route.params !== undefined) node.paramNames = route.params;
  return node;
}

function toAssetEntry(
  fileName: string,
  kind: OpenElementAssetManifestEntry['kind'],
  basePath: string,
): OpenElementAssetManifestEntry {
  return {
    fileName,
    href: `${normalizeBasePath(basePath)}${fileName}`,
    kind,
  };
}

function normalizeBasePath(basePath: string): string {
  const trimmed = basePath.trim();
  if (!trimmed || trimmed === '/') return '/';
  const withSlashes = `/${trimmed.replace(/^\/+|\/+$/g, '')}/`;
  return withSlashes.replace(/\/+/g, '/');
}

function normalizeRouteBasePath(basePath: string): string {
  const normalized = normalizeBasePath(basePath);
  return normalized.length > 1 ? normalized.replace(/\/$/, '') : normalized;
}
