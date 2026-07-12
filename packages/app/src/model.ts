/** Host-agnostic request context shared by App request adapters. */
import type { OpenElementRouteNode } from '@openelement/element';
export type { OpenElementRouteNode } from '@openelement/element';

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
>(options: CreateRequestContextOptions<Env>): OpenElementRequestContext<Env> {
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

function normalizeRouteNode(route: OpenElementRouteNode): OpenElementRouteNode {
  const path = route.path.trim();
  const withSlash = path.startsWith('/') ? path : `/${path}`;
  return {
    ...route,
    path: withSlash.length > 1 ? withSlash.replace(/\/+$/, '') : withSlash,
    paramNames: route.paramNames ? [...route.paramNames] : undefined,
    children: route.children?.map(normalizeRouteNode),
    meta: route.meta ? { ...route.meta } : undefined,
  };
}
