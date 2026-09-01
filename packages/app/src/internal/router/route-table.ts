/**
 * Thin internal RouteTable. URLPattern owns pathname grammar; this table owns
 * records, declaration priority, static lookup, query merging, and safe params.
 */

import { normalizeRoutePatternForURLPattern } from '@openelement/element/build-utils';
import { URLPattern as URLPatternPolyfill } from 'urlpattern-polyfill';

export interface RouteRecord {
  path: string;
  methods?: readonly string[];
}

export interface RouteMatch<T extends RouteRecord> {
  route: T;
  params: Record<string, string>;
}

export type RouteResolution<T extends RouteRecord> =
  | ({ kind: 'match' } & RouteMatch<T>)
  | { kind: 'method-not-allowed'; allow: string[] }
  | { kind: 'not-found' };

export interface RouteTableOptions {
  basePath?: string;
  trailingSlash?: 'strict' | 'ignore';
}

export interface URLPatternMatch {
  pathname: { groups: Record<string, string | undefined> };
}

export interface URLPatternLike {
  exec(input: { protocol: string; hostname: string; pathname: string }): URLPatternMatch | null;
}

export type URLPatternConstructor = new (init: { pathname: string }) => URLPatternLike;

interface CompiledRecord<T extends RouteRecord> {
  index: number;
  route: T;
  pattern: URLPatternLike;
  staticPath?: string;
}

type ParamMap = Map<string, string>;

function runtimeURLPattern(): URLPatternConstructor {
  return (globalThis.URLPattern ?? URLPatternPolyfill) as URLPatternConstructor;
}

function isStaticPath(path: string): boolean {
  return !/[:*?+(){}]/.test(path);
}

function staticPathKey(pathname: string): string {
  return new URL(pathname, 'https://openelement.invalid').pathname;
}

function normalizeBasePath(basePath: string | undefined): string {
  if (!basePath || basePath === '/') return '';
  const normalized = staticPathKey(basePath);
  return normalized.endsWith('/') ? normalized.slice(0, -1) : normalized;
}

function routePathname(pathname: string, options: RouteTableOptions): string | undefined {
  let normalized = staticPathKey(pathname);
  const base = normalizeBasePath(options.basePath);
  if (base) {
    if (normalized !== base && !normalized.startsWith(base + '/')) return undefined;
    normalized = normalized.slice(base.length) || '/';
  }
  if (options.trailingSlash === 'ignore' && normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }
  return normalized;
}

function methodsFor(route: RouteRecord): string[] {
  const source = route.methods?.length ? route.methods : ['GET'];
  const methods = [...new Set(source.map((method) => method.toUpperCase()))];
  if (methods.includes('GET') && !methods.includes('HEAD')) methods.push('HEAD');
  return methods;
}

function decodeComponent(value: string, plusAsSpace = false): string {
  const normalized = plusAsSpace ? value.replace(/\+/g, ' ') : value;
  try {
    return decodeURIComponent(normalized);
  } catch {
    return normalized;
  }
}

function isSafeParamName(name: string): boolean {
  return name !== '__proto__' && name !== 'prototype' && name !== 'constructor';
}

function setParam(target: ParamMap, name: string, value: string): void {
  if (isSafeParamName(name)) target.set(name, value);
}

function queryParams(search: string): ParamMap {
  const result = new Map<string, string>();
  const source = search.startsWith('?') ? search.slice(1) : search;
  if (!source) return result;
  for (const pair of source.split('&')) {
    const separator = pair.indexOf('=');
    const key = separator < 0 ? pair : pair.slice(0, separator);
    const value = separator < 0 ? '' : pair.slice(separator + 1);
    setParam(result, decodeComponent(key, true), decodeComponent(value, true));
  }
  return result;
}

function paramsRecord(...sources: ParamMap[]): Record<string, string> {
  const values = new Map<string, string>();
  for (const source of sources) {
    for (const [key, value] of source) values.set(key, value);
  }
  return new Proxy(Object.create(null), {
    get: (_target, property) => typeof property === 'string' ? values.get(property) : undefined,
    getOwnPropertyDescriptor: (_target, property) =>
      typeof property === 'string' && values.has(property)
        ? { value: values.get(property), enumerable: true, configurable: true }
        : undefined,
    has: (_target, property) => typeof property === 'string' && values.has(property),
    ownKeys: () => [...values.keys()],
  }) as Record<string, string>;
}

function pathParams(pattern: URLPatternLike, pathname: string): ParamMap | null {
  const match = pattern.exec({ protocol: 'https', hostname: 'localhost', pathname });
  if (!match) return null;
  const params = new Map<string, string>();
  for (const [name, value] of Object.entries(match.pathname.groups)) {
    if (value === undefined || /^\d+$/.test(name)) continue;
    setParam(params, name, decodeComponent(value));
  }
  return params;
}

export class RouteTable<T extends RouteRecord> {
  readonly #static = new Map<string, CompiledRecord<T>[]>();
  readonly #dynamic: CompiledRecord<T>[] = [];

  constructor(
    readonly routes: readonly T[],
    Pattern: URLPatternConstructor = runtimeURLPattern(),
    readonly options: RouteTableOptions = {},
  ) {
    routes.forEach((route, index) => {
      let pathname = normalizeRoutePatternForURLPattern(route.path);
      if (options.trailingSlash === 'ignore' && pathname.length > 1 && pathname.endsWith('/')) {
        pathname = pathname.slice(0, -1);
      }
      const record: CompiledRecord<T> = {
        index,
        route,
        pattern: new Pattern({ pathname }),
        ...(isStaticPath(pathname) ? { staticPath: staticPathKey(pathname) } : {}),
      };
      if (record.staticPath === undefined) {
        this.#dynamic.push(record);
      } else {
        const entries = this.#static.get(record.staticPath) ?? [];
        entries.push(record);
        this.#static.set(record.staticPath, entries);
      }
    });
  }

  match(pathname: string, search = ''): RouteMatch<T> | null {
    const routedPath = routePathname(pathname, this.options);
    if (routedPath === undefined) return null;
    const staticWinner = this.#static.get(staticPathKey(routedPath))?.[0];
    const query = queryParams(search);
    for (const record of this.#dynamic) {
      if (staticWinner && record.index > staticWinner.index) break;
      const path = pathParams(record.pattern, routedPath);
      if (path) return { route: record.route, params: paramsRecord(query, path) };
    }
    if (!staticWinner) return null;
    return { route: staticWinner.route, params: paramsRecord(query) };
  }

  resolve(pathname: string, search = '', method = 'GET'): RouteResolution<T> {
    const routedPath = routePathname(pathname, this.options);
    if (routedPath === undefined) return { kind: 'not-found' };
    const query = queryParams(search);
    const candidates: Array<{ record: CompiledRecord<T>; params: ParamMap }> = [];
    for (const record of this.#static.get(staticPathKey(routedPath)) ?? []) {
      candidates.push({ record, params: new Map() });
    }
    for (const record of this.#dynamic) {
      const params = pathParams(record.pattern, routedPath);
      if (params) candidates.push({ record, params });
    }
    candidates.sort((left, right) => left.record.index - right.record.index);
    if (candidates.length === 0) return { kind: 'not-found' };

    const requested = method.toUpperCase();
    for (const candidate of candidates) {
      if (methodsFor(candidate.record.route).includes(requested)) {
        return {
          kind: 'match',
          route: candidate.record.route,
          params: paramsRecord(query, candidate.params),
        };
      }
    }
    const allow = [...new Set(candidates.flatMap(({ record }) => methodsFor(record.route)))].sort();
    return { kind: 'method-not-allowed', allow };
  }

  /** Number of records URLPattern/static lookup may inspect for this path. */
  candidateCount(pathname: string): number {
    const routedPath = routePathname(pathname, this.options);
    if (routedPath === undefined) return 0;
    const staticWinner = this.#static.get(staticPathKey(routedPath))?.[0];
    if (!staticWinner) return this.#dynamic.length;
    return 1 + this.#dynamic.filter((record) => record.index < staticWinner.index).length;
  }
}

export const URLPatternPolyfillConstructor = URLPatternPolyfill as URLPatternConstructor;
