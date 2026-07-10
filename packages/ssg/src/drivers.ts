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
} from '@openelement/protocol/app-model';
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

/** Minimal Vite manifest entry shape consumed by the OpenElement asset driver. */
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
  return {
    basePath: normalizeRouteBasePath(basePath),
    routes: routes
      .filter((route) => route.type === 'page' || route.type === 'api')
      .map(routeEntryToNode),
  };
}

export function createAssetManifestFromViteManifest(
  manifest: ViteManifestLike,
  basePath = '/',
): OpenElementAssetManifest {
  const entries: OpenElementAssetManifestEntry[] = [];
  const seenHrefs = new Set<string>();
  const pushEntry = (entry: OpenElementAssetManifestEntry) => {
    if (seenHrefs.has(entry.href)) return;
    seenHrefs.add(entry.href);
    entries.push(entry);
  };

  for (const value of Object.values(manifest)) {
    if (value.file) {
      pushEntry(toAssetEntry(value.file, 'script', basePath));
    }
    for (const css of value.css ?? []) {
      pushEntry(toAssetEntry(css, 'style', basePath));
    }
    for (const asset of value.assets ?? []) {
      pushEntry(toAssetEntry(asset, 'asset', basePath));
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
    path: normalizeRoutePath(route.path),
    filePath: route.filePath,
    // RouteEntry has no separate importPath yet; scanned route files are also imports.
    importPath: route.filePath,
  };
  node.tagName = route.tagName;
  node.paramNames = route.params ? [...route.params] : undefined;
  node.children = undefined;
  node.meta = undefined;
  return node;
}

function toAssetEntry(
  fileName: string,
  kind: OpenElementAssetManifestEntry['kind'],
  basePath: string,
): OpenElementAssetManifestEntry {
  const normalizedFileName = fileName.replace(/^\/+/, '');
  return {
    fileName: normalizedFileName,
    href: `${normalizeBasePath(basePath)}${normalizedFileName}`,
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

function normalizeRoutePath(path: string): string {
  const trimmed = path.trim();
  if (!trimmed) return '/';
  const withSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return withSlash.length > 1 ? withSlash.replace(/\/+$/, '') : withSlash;
}
