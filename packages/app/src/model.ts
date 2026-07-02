/**
 * OpenElement application model.
 *
 * These contracts name the framework concepts that official drivers implement.
 * They are intentionally host-agnostic so route/render/request behavior can be
 * tested without booting Hono, Vite, Nitro, or a desktop shell.
 */

export type OpenElementRouteKind = 'page' | 'api';
export type OpenElementRenderPhase =
  | 'route'
  | 'layout'
  | 'head'
  | 'assets'
  | 'islands'
  | 'serialize'
  | 'error';
export type OpenElementDeploymentRuntime = 'static' | 'node' | 'workers' | 'deno-desktop';

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

export interface OpenElementRequestContext<
  Env extends Record<string, unknown> = Record<string, unknown>,
> {
  request: Request;
  url: URL;
  path: string;
  method: string;
  params: Record<string, string>;
  searchParams: URLSearchParams;
  env?: Env;
  platform?: unknown;
  route?: OpenElementRouteNode;
}

export interface OpenElementRenderStep {
  phase: OpenElementRenderPhase;
  name: string;
  routePath?: string;
  optional?: boolean;
}

export interface OpenElementRenderPipeline {
  steps: OpenElementRenderStep[];
}

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

export interface OpenElementIslandManifestEntry {
  tagName: string;
  hydrate?: 'load' | 'idle' | 'visible' | 'only';
  ssr?: boolean;
  dsd?: boolean;
  modulePath?: string;
  source?: 'local' | 'package' | 'third-party';
}

export interface OpenElementIslandManifest {
  islands: OpenElementIslandManifestEntry[];
}

export interface OpenElementDeploymentTarget {
  runtime: OpenElementDeploymentRuntime;
  adapter: 'vite' | 'hono' | 'nitro' | 'deno-desktop' | 'custom';
  preset?: string;
}

export interface OpenElementAppModel {
  routes: OpenElementRouteGraph;
  renderPipeline: OpenElementRenderPipeline;
  assets: OpenElementAssetManifest;
  islands: OpenElementIslandManifest;
  deployment: OpenElementDeploymentTarget;
}

export type CreateAppModelOptions = Partial<OpenElementAppModel>;

export function createAppModel(options: CreateAppModelOptions = {}): OpenElementAppModel {
  return {
    routes: options.routes ?? createRouteGraph({ routes: [] }),
    renderPipeline: options.renderPipeline ?? createDefaultRenderPipeline(),
    assets: options.assets ?? { basePath: '/', entries: [] },
    islands: options.islands ?? { islands: [] },
    deployment: options.deployment ?? { runtime: 'static', adapter: 'custom' },
  };
}

export interface CreateRouteGraphOptions {
  routes: OpenElementRouteNode[];
  basePath?: string;
}

export function createRouteGraph(options: CreateRouteGraphOptions): OpenElementRouteGraph {
  return {
    routes: options.routes.map(normalizeRouteNode),
    basePath: normalizeBasePath(options.basePath),
  };
}

export interface CreateRequestContextOptions<
  Env extends Record<string, unknown> = Record<string, unknown>,
> {
  request: Request;
  params?: Record<string, string>;
  env?: Env;
  platform?: unknown;
  route?: OpenElementRouteNode;
}

export function createRequestContext<
  Env extends Record<string, unknown> = Record<string, unknown>,
>(
  options: CreateRequestContextOptions<Env>,
): OpenElementRequestContext<Env> {
  const url = new URL(options.request.url);

  return {
    request: options.request,
    url,
    path: url.pathname,
    method: options.request.method,
    params: options.params ?? {},
    searchParams: url.searchParams,
    env: options.env,
    platform: options.platform,
    route: options.route ? normalizeRouteNode(options.route) : undefined,
  };
}

export function createRenderPipeline(steps: OpenElementRenderStep[]): OpenElementRenderPipeline {
  return { steps: steps.map((step) => ({ ...step })) };
}

export function createDefaultRenderPipeline(): OpenElementRenderPipeline {
  return createRenderPipeline([
    { phase: 'route', name: 'match route' },
    { phase: 'layout', name: 'apply layouts', optional: true },
    { phase: 'head', name: 'collect document head' },
    { phase: 'assets', name: 'attach asset manifest' },
    { phase: 'islands', name: 'plan island hydration', optional: true },
    { phase: 'serialize', name: 'serialize html' },
    { phase: 'error', name: 'render error boundary', optional: true },
  ]);
}

function normalizeRouteNode(route: OpenElementRouteNode): OpenElementRouteNode {
  return {
    kind: route.kind,
    path: normalizeRoutePath(route.path),
    filePath: route.filePath,
    importPath: route.importPath,
    tagName: route.tagName,
    paramNames: route.paramNames ? [...route.paramNames] : undefined,
    children: route.children?.map(normalizeRouteNode),
    meta: route.meta ? { ...route.meta } : undefined,
  };
}

function normalizeBasePath(path = '/'): string {
  return normalizeRoutePath(path);
}

function normalizeRoutePath(path: string): string {
  const trimmed = path.trim();
  if (!trimmed) return '/';
  const withSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return withSlash.length > 1 ? withSlash.replace(/\/+$/, '') : withSlash;
}
