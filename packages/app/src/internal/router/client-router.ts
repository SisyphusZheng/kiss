/**
 * @openelement/app/internal/router/client-router - URL-based client-side router.
 *
 * Supports history (pushState), hash, and auto-detection modes.
 * Route patterns use `:param` for named params, `:param?` for optional params,
 * and `:param{.+}` for a multi-segment catch-all (Hono-style, as emitted by the
 * SSG route scanner — #812).
 *
 * Matching semantics are the WHATWG URLPattern standard (#856, ADR-0123):
 * patterns are translated to URLPattern (`:param{.+}` -> `:param(.+)`) and
 * matched through the native implementation, same as the element context's
 * extractParams. The route trie survives purely as a candidate-narrowing
 * performance index; every candidate is confirmed by URLPattern, and the
 * linear matcher remains as the equivalence oracle in tests.
 */
// SPA loader/action contexts are deliberately narrower than the request-time
// LoaderContext/ActionContext: the client-side chain supplies only params
// (+ formData for actions) and signals failure by throwing (#570, ADR-0119
// frozen semantics — types clarified, runtime unchanged).
import type { SpaActionContext, SpaLoaderContext } from '@openelement/element';
import { createLogger, ERROR_PREFIX } from '@openelement/element';
import { isDevMode } from '../dev-mode.ts';

const log = createLogger('router');

export type RouterMode = 'history' | 'hash' | 'auto';

export interface RouteConfig {
  path: string; // e.g. '/products/:id'
  /** Custom element tag to instantiate directly in SPA mode. */
  tagName: string;
  /** Client-side loader — runs before component render. Receives matched route params. */
  loader?: (ctx: SpaLoaderContext) => Promise<unknown>;
  /** Client-side action — runs on form submit. Receives matched route params and form data. */
  action?: (
    ctx: SpaActionContext,
  ) => Promise<unknown>;
  guard?: () => Promise<boolean | string>;
}

interface RouterOptions {
  mode: RouterMode;
  routes: RouteConfig[];
  /** Called after navigation or browser history/hash changes update the current match. */
  onChange?: () => void | Promise<void>;
}

export interface RouterInstance {
  navigate(path: string): Promise<void>;
  replace(path: string): Promise<void>;
  dispose(): void;
  currentPath: string;
  currentRoute: RouteConfig | null;
  params: Record<string, string>;
}

type ParamMap = Map<string, string>;
const MAX_GUARD_REDIRECTS = 10;

interface RouteTrieNode {
  staticChildren: Map<string, RouteTrieNode>;
  dynamicChild?: RouteTrieNode;
  wildcardChild?: RouteTrieNode;
  routeIndexes: number[];
}

interface CompiledRouteMatcher {
  match(
    pathname: string,
    search: string,
  ): { route: RouteConfig; params: Record<string, string> } | null;
  /** Diagnostic used by the large-table regression test. */
  candidateCount(pathname: string): number;
}

// ─── Internal helpers ─────────────────────────────────────────────

function resolveMode(mode: RouterMode): 'history' | 'hash' {
  if (mode === 'auto') {
    // detect file:// protocol for local dev; use hash routing
    return typeof location !== 'undefined' && location.protocol === 'file:' ? 'hash' : 'history';
  }
  return mode;
}

/**
 * Translate a route path to a URLPattern pathname (#856, ADR-0123). The
 * framework dialect is already URLPattern-shaped (`:param`, `:param?`,
 * `:param*`, `*` are native); only the Hono-style `:name{regex}` catch-all
 * emitted by the SSG route scanner (#812) needs rewriting to the URLPattern
 * `:name(regex)` form.
 *
 * Twin: ssg-helpers.ts routePatternToURLPatternPath (adapter-vite) is a
 * byte-identical body for the generated server matcher — keep them in sync
 * (the escapeAttr precedent: deliberate copy, cross-referenced).
 */
function routePathToURLPatternPath(path: string): string {
  return path
    .split('/')
    .map((segment) => {
      const brace = segment.startsWith(':') ? segment.indexOf('{') : -1;
      if (brace === -1 || !segment.endsWith('}')) return segment;
      return `${segment.slice(0, brace)}(${segment.slice(brace + 1, -1)})`;
    })
    .join('/');
}

const urlPatternCache = new Map<string, URLPattern>();

function compiledPatternFor(pattern: string): URLPattern {
  let compiled = urlPatternCache.get(pattern);
  if (!compiled) {
    // An invalid pattern fails fast at construction instead of silently
    // never matching — same contract as the element context's extractParams.
    compiled = new URLPattern({ pathname: routePathToURLPatternPath(pattern) });
    urlPatternCache.set(pattern, compiled);
  }
  return compiled;
}

// ─── URLPattern fallback (#897) ────────────────────────────────────
//
// Firefox (and older Chromium/Safari) lack URLPattern. When it is absent,
// route patterns are compiled to an equivalent RegExp instead. The compiled
// fragment per segment carries its own leading slash, so optional segments
// and the repeat can be skipped as a unit:
//   static      -> escaped literal
//   :name       -> /([^/]+)
//   :name?      -> (?:/([^/]+))?
//   :name*      -> (?:/(.*))?     (zero-or-more non-empty segments)
//   :name(re)   -> /(re)          (custom regex, matches across slashes)
//   *           -> (.*)           (unnamed wildcard, matches across slashes)
// Anything outside this dialect throws at compile time, mirroring
// URLPattern's fail-fast on unparseable patterns.

interface LinearPattern {
  regex: RegExp;
  /** Param name per capture group; numeric keys for unnamed wildcards. */
  names: Array<string | number>;
  /** True per capture group when the group is a zero-or-more repeat. */
  repeats: boolean[];
}

const linearPatternCache = new Map<string, LinearPattern>();

function compiledLinearPatternFor(pattern: string): LinearPattern {
  let compiled = linearPatternCache.get(pattern);
  if (!compiled) {
    compiled = compileLinearPattern(routePathToURLPatternPath(pattern));
    linearPatternCache.set(pattern, compiled);
  }
  return compiled;
}

function compileLinearPattern(pattern: string): LinearPattern {
  const names: Array<string | number> = [];
  const repeats: boolean[] = [];
  const segments = pattern.split('/');
  if (segments[0] === '') segments.shift();
  let source = '^';
  for (const segment of segments) {
    if (segment === '*') {
      names.push(0);
      repeats.push(false);
      source += '(.*)';
      continue;
    }
    const colon = segment.startsWith(':') ? 1 : -1;
    if (colon === -1) {
      source += '/' + segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      continue;
    }
    const nameMatch = /^:([^?*(]+)(.*)$/.exec(segment);
    if (!nameMatch) {
      // Unparseable dialect token: fail fast like an invalid URLPattern.
      throw new TypeError(`Invalid route pattern segment "${segment}"`);
    }
    const name = nameMatch[1];
    const rest = nameMatch[2];
    if (rest === '') {
      names.push(name);
      repeats.push(false);
      source += `/([^/]+)`;
    } else if (rest === '?') {
      names.push(name);
      repeats.push(false);
      source += `(?:/([^/]+))?`;
    } else if (rest === '*') {
      names.push(name);
      repeats.push(true);
      source += `(?:/(.*))?`;
    } else if (rest.startsWith('(')) {
      const end = rest.indexOf(')');
      if (end === -1 || rest.slice(end + 1) !== '') {
        throw new TypeError(`Invalid route pattern segment "${segment}"`);
      }
      names.push(name);
      repeats.push(false);
      source += `/(${rest.slice(1, end)})`;
    } else {
      throw new TypeError(`Invalid route pattern segment "${segment}"`);
    }
  }
  source += '$';
  return { regex: new RegExp(source, 'u'), names, repeats };
}

/**
 * URLPattern reports a zero-segment `:name*` repeat as absent; an empty or
 * empty-segment remainder (`/assets/`, `/a//b`) does not match at all.
 */
function repeatCapture(value: string): string | null {
  if (value === '' || value.startsWith('/') || value.endsWith('/') || value.includes('//')) {
    return null;
  }
  return value;
}

/** RegExp-based declaration-order matcher used when URLPattern is absent. */
function matchPatternLinear(pattern: string, pathname: string): ParamMap | null {
  const compiled = compiledLinearPatternFor(pattern);
  const match = compiled.regex.exec(pathname);
  if (match === null) return null;

  const params: ParamMap = new Map();
  for (let index = 1; index < match.length; index++) {
    const name = compiled.names[index - 1];
    // Unnamed wildcards are not exposed as params, mirroring URLPattern's
    // numeric group keys (skipped by the native path below).
    if (typeof name === 'number') continue;
    const value = match[index];
    if (value === undefined) continue;
    if (compiled.repeats[index - 1] && repeatCapture(value) === null) return null;
    setParam(params, name, decodePathComponent(value));
  }
  return params;
}

let warnedFallback = false;

function matchPattern(pattern: string, pathname: string): ParamMap | null {
  // Feature-detected per call (cheap) so the absence of URLPattern can be
  // exercised in tests and so engines that gain it later pick it up.
  if (typeof URLPattern === 'undefined') {
    if (!warnedFallback) {
      warnedFallback = true;
      if (isDevMode()) {
        log.warn(
          'URLPattern is not available in this browser — falling back to the RegExp matcher. ' +
            'Some pattern features may behave differently (#897).',
        );
      }
    }
    return matchPatternLinear(pattern, pathname);
  }

  const match = compiledPatternFor(pattern).exec({
    protocol: 'https',
    hostname: 'localhost',
    pathname,
  });
  if (match === null) return null;

  const params: ParamMap = new Map();
  for (const [name, value] of Object.entries(match.pathname.groups)) {
    // Absent optional params surface as undefined; unnamed wildcards (`*`)
    // surface under numeric keys and are not exposed as params.
    if (value === undefined || /^\d+$/.test(name)) continue;
    // URLPattern groups are raw percent-encoded text; decode exactly once.
    setParam(params, name, decodePathComponent(value));
  }
  return params;
}

function decodeQueryComponent(value: string): string {
  const normalized = value.replace(/\+/g, ' ');
  try {
    return decodeURIComponent(normalized);
  } catch {
    return normalized;
  }
}

function decodePathComponent(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function isSafeParamName(name: string): boolean {
  return name !== '__proto__' && name !== 'prototype' && name !== 'constructor';
}

function setParam(
  target: ParamMap,
  name: string,
  value: string,
): void {
  if (!isSafeParamName(name)) return;
  target.set(name, value);
}

function parseQuery(search: string): ParamMap {
  const result: ParamMap = new Map();
  if (search.startsWith('?')) search = search.slice(1);
  if (!search) return result;
  for (const pair of search.split('&')) {
    const eq = pair.indexOf('=');
    const key = eq === -1 ? pair : pair.slice(0, eq);
    const val = eq === -1 ? '' : pair.slice(eq + 1);
    setParam(result, decodeQueryComponent(key), decodeQueryComponent(val));
  }
  return result;
}

function createParamsRecord(...sources: ParamMap[]): Record<string, string> {
  const values = new Map<string, string>();
  for (const source of sources) {
    for (const [key, value] of source) {
      values.set(key, value);
    }
  }

  return new Proxy(Object.create(null), {
    get(_target, prop) {
      return typeof prop === 'string' ? values.get(prop) : undefined;
    },
    getOwnPropertyDescriptor(_target, prop) {
      if (typeof prop !== 'string' || !values.has(prop)) return undefined;
      return {
        value: values.get(prop),
        enumerable: true,
        configurable: true,
      };
    },
    has(_target, prop) {
      return typeof prop === 'string' && values.has(prop);
    },
    ownKeys() {
      return [...values.keys()];
    },
  }) as Record<string, string>;
}

/** Exported for tests that match routes without creating a router. */
export function matchRoute(
  pathname: string,
  search: string,
  routes: RouteConfig[],
): { route: RouteConfig; params: Record<string, string> } | null {
  return matcherFor(routes).match(pathname, search);
}

function matchRoutesInOrder(
  pathname: string,
  search: string,
  routes: RouteConfig[],
  patternMatch: (pattern: string, pathname: string) => ParamMap | null,
): { route: RouteConfig; params: Record<string, string> } | null {
  const queryParams = parseQuery(search);

  for (const route of routes) {
    const pathParams = patternMatch(route.path, pathname);
    if (pathParams !== null) {
      return {
        route,
        params: createParamsRecord(queryParams, pathParams),
      };
    }
  }
  return null;
}

/**
 * Declaration-order matcher retained as an equivalence oracle for trie
 * tests (URLPattern-backed when the API is present).
 */
export function matchRouteLinearForTests(
  pathname: string,
  search: string,
  routes: RouteConfig[],
): { route: RouteConfig; params: Record<string, string> } | null {
  return matchRoutesInOrder(pathname, search, routes, matchPattern);
}

/**
 * RegExp-backed declaration-order matcher — the runtime fallback used when
 * URLPattern is unavailable (#897). Exported so tests can assert parity with
 * the URLPattern path on identical fixtures.
 */
export function matchRouteLinear(
  pathname: string,
  search: string,
  routes: RouteConfig[],
): { route: RouteConfig; params: Record<string, string> } | null {
  return matchRoutesInOrder(pathname, search, routes, matchPatternLinear);
}

function createTrieNode(): RouteTrieNode {
  return { staticChildren: new Map(), routeIndexes: [] };
}

function routeParts(path: string): string[] {
  return path === '/' ? [] : path.split('/').filter(Boolean);
}

function addRouteToTrie(
  node: RouteTrieNode,
  parts: string[],
  partIndex: number,
  routeIndex: number,
): void {
  if (partIndex >= parts.length) {
    if (!node.routeIndexes.includes(routeIndex)) node.routeIndexes.push(routeIndex);
    return;
  }

  const part = parts[partIndex];
  if (part.endsWith('?')) {
    addRouteToTrie(node, parts, partIndex + 1, routeIndex);
  }

  if (part === '*' || (part.startsWith(':') && (part.endsWith('*') || part.endsWith('{.+}')))) {
    node.wildcardChild ??= createTrieNode();
    addRouteToTrie(node.wildcardChild, parts, parts.length, routeIndex);
    return;
  }

  if (part.startsWith(':')) {
    node.dynamicChild ??= createTrieNode();
    addRouteToTrie(node.dynamicChild, parts, partIndex + 1, routeIndex);
    return;
  }

  let child = node.staticChildren.get(part);
  if (!child) {
    child = createTrieNode();
    node.staticChildren.set(part, child);
  }
  addRouteToTrie(child, parts, partIndex + 1, routeIndex);
}

function collectCandidateIndexes(root: RouteTrieNode, pathname: string): number[] {
  const parts = routeParts(pathname);
  const indexes = new Set<number>();

  const visit = (node: RouteTrieNode, partIndex: number): void => {
    if (partIndex === parts.length) {
      for (const index of node.routeIndexes) indexes.add(index);
      if (node.wildcardChild) {
        for (const index of node.wildcardChild.routeIndexes) indexes.add(index);
      }
      return;
    }

    const staticChild = node.staticChildren.get(parts[partIndex]);
    if (staticChild) visit(staticChild, partIndex + 1);
    if (node.dynamicChild) visit(node.dynamicChild, partIndex + 1);
    if (node.wildcardChild) {
      for (const index of node.wildcardChild.routeIndexes) indexes.add(index);
    }
  };

  visit(root, 0);
  return [...indexes].sort((left, right) => left - right);
}

export function compileRouteMatcher(routes: RouteConfig[]): CompiledRouteMatcher {
  const root = createTrieNode();
  routes.forEach((route, index) => addRouteToTrie(root, routeParts(route.path), 0, index));

  const candidates = (pathname: string) => collectCandidateIndexes(root, pathname);
  return {
    match(pathname, search) {
      const queryParams = parseQuery(search);
      for (const index of candidates(pathname)) {
        const route = routes[index];
        const pathParams = matchPattern(route.path, pathname);
        if (pathParams !== null) {
          return { route, params: createParamsRecord(queryParams, pathParams) };
        }
      }
      return null;
    },
    candidateCount(pathname) {
      return candidates(pathname).length;
    },
  };
}

const compiledMatchers = new WeakMap<RouteConfig[], CompiledRouteMatcher>();

function matcherFor(routes: RouteConfig[]): CompiledRouteMatcher {
  let matcher = compiledMatchers.get(routes);
  if (!matcher) {
    matcher = compileRouteMatcher(routes);
    compiledMatchers.set(routes, matcher);
  }
  return matcher;
}

// ─── createRouter ─────────────────────────────────────────────────

export function createRouter(options: RouterOptions): RouterInstance {
  const mode = resolveMode(options.mode);
  const { routes } = options;
  const routeMatcher = compileRouteMatcher(routes);

  let currentPath = '';
  let currentRoute: RouteConfig | null = null;
  let currentParams: Record<string, string> = Object.create(null);

  /** Registered listeners keyed by event type, to support dispose. */
  const listeners: Array<{ type: string; handler: EventListener }> = [];

  function addCleanupListener(
    type: string,
    handler: EventListener,
  ): void {
    listeners.push({ type, handler });
    addEventListener(type, handler);
  }

  function readPath(): string {
    if (mode === 'hash') {
      const hash = location.hash.replace(/^#/, '') || '/';
      return hash;
    }
    return location.pathname + location.search;
  }

  function toHashUrl(path: string): string {
    return '#' + (path.startsWith('#') ? path.slice(1) : path);
  }

  function rematch(): void {
    const raw = readPath();
    const u = new URL(raw, 'http://x');
    const pathname = u.pathname;
    const search = u.search;
    const matched = routeMatcher.match(pathname, search);

    currentPath = raw;
    currentRoute = matched?.route ?? null;
    currentParams = matched?.params ?? Object.create(null);
  }

  function notifyChange(): void {
    // Outer try/catch catches synchronous throws from onChange().
    // Promise.resolve().catch() only handles async rejections; a sync throw
    // during argument evaluation would crash the router.
    try {
      void Promise.resolve(options.onChange?.()).catch((err) => {
        log.error('onChange failed:', err);
      });
    } catch (err) {
      log.error('onChange failed:', err);
    }
  }

  async function commitNavigation(
    path: string,
    navOptions: { replace: boolean; depth?: number; restoreOnBlock?: boolean },
    ticket?: number,
  ): Promise<void> {
    const depth = navOptions.depth ?? 0;
    if (depth > MAX_GUARD_REDIRECTS) {
      throw new Error(
        `${ERROR_PREFIX} Guard redirect limit exceeded while navigating to "${path}"`,
      );
    }

    // Run guard if we have a matching target route
    const u = new URL(path, 'http://x');
    const matched = routeMatcher.match(u.pathname, u.search);
    if (matched?.route.guard) {
      const result = await matched.route.guard();
      // Latest-wins (#1023): a newer programmatic navigation already owns the
      // outcome; a superseded guard resolution must not push state.
      if (ticket !== undefined && ticket !== programmaticNavigationSeq) return;
      if (result === false) {
        if (navOptions.restoreOnBlock) {
          // Browser-driven navigation already landed on this URL (via a guard
          // redirect); restore the entry the user came from, same as the
          // direct block path in commitBrowserNavigation.
          history.pushState(null, '', mode === 'hash' ? toHashUrl(currentPath) : currentPath);
        }
        return; // blocked
      }
      if (typeof result === 'string') {
        return commitNavigation(result, {
          replace: navOptions.replace,
          depth: depth + 1,
          restoreOnBlock: navOptions.restoreOnBlock,
        }, ticket);
      }
    }

    if (ticket !== undefined && ticket !== programmaticNavigationSeq) return;
    const url = mode === 'hash' ? toHashUrl(path) : path;
    if (navOptions.replace) {
      history.replaceState(null, '', url);
    } else {
      history.pushState(null, '', url);
    }
    rematch();
    notifyChange();
  }

  // Latest-wins sequencing for programmatic navigations (#1023): guards are
  // async, so without ordering a slow guard from an earlier navigate() would
  // commit after a newer navigation and roll the UI back to the stale intent.
  let programmaticNavigationSeq = 0;

  function navigate(path: string): Promise<void> {
    return commitNavigation(path, { replace: false }, ++programmaticNavigationSeq);
  }

  function replace(path: string): Promise<void> {
    return commitNavigation(path, { replace: true }, ++programmaticNavigationSeq);
  }

  /**
   * Reconcile router state after the browser itself moved the history
   * pointer (back/forward buttons, direct hash edits). The landed URL
   * cannot be withheld the way commitNavigation withholds pushState, so
   * a rejected guard pushes the previous entry back on top, and a guard
   * redirect replaces the landed entry with the redirect target.
   */
  // Dedup consecutive browser events that land on the same URL (rapid
  // popstate/hashchange bursts) so guards and onChange do not run twice
  // for what is effectively a single navigation.
  let lastLandedUrl: string | null = null;

  async function commitBrowserNavigation(): Promise<void> {
    const landed = readPath();
    if (landed === lastLandedUrl) return;
    try {
      const u = new URL(landed, 'http://x');
      const matched = routeMatcher.match(u.pathname, u.search);
      if (matched?.route.guard) {
        const result = await matched.route.guard();
        if (result === false) {
          // Blocked: restore the entry the user came from. pushState does
          // not fire popstate/hashchange, so restoring cannot re-enter here.
          history.pushState(null, '', mode === 'hash' ? toHashUrl(currentPath) : currentPath);
          return;
        }
        if (typeof result === 'string') {
          await commitNavigation(result, { replace: true, depth: 1, restoreOnBlock: true });
          return;
        }
      }
      rematch();
      notifyChange();
    } finally {
      // Track the committed URL (restored on block, replaced on redirect) so
      // only bursts landing on the same URL are deduped, not genuine retries.
      lastLandedUrl = readPath();
    }
  }

  // Serialize browser-driven navigations: guards are async, and rapid
  // back/forward sequences must resolve in order against the latest URL.
  let browserNavigationQueue: Promise<void> = Promise.resolve();

  function onBrowserNavigation(): void {
    browserNavigationQueue = browserNavigationQueue
      .then(commitBrowserNavigation)
      .catch((err) => {
        // Intentional fail-open: a rejected guard or a router error must not
        // wedge the queue or leave the UI inconsistent with the address bar,
        // so we log and converge to the real URL instead of rethrowing.
        log.error('browser navigation failed:', err);
        rematch();
        notifyChange();
      });
  }

  function dispose(): void {
    for (const { type, handler } of listeners) {
      removeEventListener(type, handler);
    }
    listeners.length = 0;
  }

  // ─── Initialization ───────────────────────────────────────────

  if (mode === 'history') {
    addCleanupListener('popstate', onBrowserNavigation);
  } else {
    addCleanupListener('hashchange', onBrowserNavigation);
  }

  // Initial match
  rematch();

  return {
    navigate,
    replace,
    dispose,
    get currentPath(): string {
      return currentPath;
    },
    get currentRoute(): RouteConfig | null {
      return currentRoute;
    },
    get params(): Record<string, string> {
      return currentParams;
    },
  };
}
