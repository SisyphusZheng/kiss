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
  OpenElementRenderPipeline,
  OpenElementRouteGraph,
  OpenElementRouteKind,
  OpenElementRouteNode,
} from '@openelement/app/model';
import type { RouteEntry } from '@openelement/protocol/framework';
import type { HonoEntryOptions } from './entry-renderer.ts';
import { generateHonoEntryCode } from './entry-renderer.ts';

export interface OpenElementSsgFileSystemOutput {
  rootDir: string;
  outDir: string;
  staticDir?: string;
}

export interface OpenElementSsgRequestDriver {
  name: 'hono' | 'custom';
  routeGraph(routes: RouteEntry[]): OpenElementRouteGraph;
  entryCode(routes: RouteEntry[], options?: HonoEntryOptions): string;
}

export interface OpenElementSsgAssetDriver {
  name: 'vite' | 'custom';
  assetManifest(input: ViteManifestLike, basePath?: string): OpenElementAssetManifest;
}

export interface OpenElementSsgDriverContract {
  routes: OpenElementRouteGraph;
  renderPipeline: OpenElementRenderPipeline;
  assets: OpenElementAssetManifest;
  output: OpenElementSsgFileSystemOutput;
  requestDriver: OpenElementSsgRequestDriver;
  assetDriver: OpenElementSsgAssetDriver;
}

export type ViteManifestLike = Record<
  string,
  {
    file?: string;
    css?: string[];
    assets?: string[];
  }
>;

export function createHonoRequestDriver(): OpenElementSsgRequestDriver {
  return {
    name: 'hono',
    routeGraph: createRouteGraphFromEntries,
    entryCode: (routes, options = {}) => generateHonoEntryCode(routes, options),
  };
}

export function createViteAssetDriver(): OpenElementSsgAssetDriver {
  return {
    name: 'vite',
    assetManifest: createAssetManifestFromViteManifest,
  };
}

export function createRouteGraphFromEntries(routes: RouteEntry[]): OpenElementRouteGraph {
  const routeNodes = routes
    .filter((route) => route.type === 'page' || route.type === 'api')
    .map(routeEntryToNode);

  return {
    basePath: '/',
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
  return {
    kind: route.type as OpenElementRouteKind,
    path: route.path,
    filePath: route.filePath,
    importPath: route.filePath,
    tagName: route.tagName,
    paramNames: route.params,
  };
}

function toAssetEntry(
  fileName: string,
  kind: OpenElementAssetManifestEntry['kind'],
  basePath: string,
): OpenElementAssetManifestEntry {
  return {
    fileName,
    href: `${normalizeBasePath(basePath)}${fileName}`.replace(/\/+/g, '/'),
    kind,
  };
}

function normalizeBasePath(basePath: string): string {
  const trimmed = basePath.trim();
  if (!trimmed || trimmed === '/') return '/';
  const withSlashes = `/${trimmed.replace(/^\/+|\/+$/g, '')}/`;
  return withSlashes.replace(/\/+/g, '/');
}
