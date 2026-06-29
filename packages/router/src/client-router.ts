/**
 * @openelement/router/client-router - URL-based client-side router.
 *
 * Supports history (pushState), hash, and auto-detection modes.
 * Route patterns use `:param` for named params and `:param?` for optional params.
 */
export type RouterMode = 'history' | 'hash' | 'auto';

export interface RouteConfig {
  path: string; // e.g. '/products/:id'
  component?: () => unknown;
  /** Custom element tag to instantiate directly in SPA mode. */
  tagName?: string;
  /** Client-side loader — runs before component render. Receives matched route params. */
  loader?: (ctx: { params: Record<string, string> }) => Promise<unknown>;
  /** Client-side action — runs on form submit. Receives matched route params and form data. */
  action?: (
    ctx: { params: Record<string, string>; formData?: FormData },
  ) => Promise<unknown>;
  guard?: () => Promise<boolean | string>;
}

export interface RouterOptions {
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

// ─── Internal helpers ─────────────────────────────────────────────

function resolveMode(mode: RouterMode): 'history' | 'hash' {
  if (mode === 'auto') {
    // detect file:// protocol for local dev; use hash routing
    return typeof location !== 'undefined' && location.protocol === 'file:' ? 'hash' : 'history';
  }
  return mode;
}

function matchPattern(
  pattern: string,
  pathname: string,
): ParamMap | null {
  const patternParts = pattern === '/' ? [] : pattern.split('/').filter(Boolean);
  const pathParts = pathname === '/' ? [] : pathname.split('/').filter(Boolean);

  const params: ParamMap = new Map();
  let pi = 0;

  for (let i = 0; i < patternParts.length; i++) {
    const part = patternParts[i];
    const isOptional = part.endsWith('?');
    const clean = isOptional ? part.slice(0, -1) : part;

    if (clean.startsWith(':')) {
      const name = clean.slice(1);
      if (pi < pathParts.length) {
        setParam(params, name, pathParts[pi]);
        pi++;
      } else if (!isOptional) {
        return null; // required param missing
      }
      // optional param missing → ok, not added to params
    } else {
      if (pi >= pathParts.length || pathParts[pi] !== clean) {
        return null; // literal mismatch
      }
      pi++;
    }
  }

  // Must consume all path segments
  if (pi < pathParts.length) return null;

  return params;
}

function decodeQueryComponent(value: string): string {
  return decodeURIComponent(value.replace(/\+/g, ' '));
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

/** Exported for testing / standalone matching without creating a router. */
export function matchRoute(
  pathname: string,
  search: string,
  routes: RouteConfig[],
): { route: RouteConfig; params: Record<string, string> } | null {
  const queryParams = parseQuery(search);

  for (const route of routes) {
    const pathParams = matchPattern(route.path, pathname);
    if (pathParams !== null) {
      return {
        route,
        params: createParamsRecord(queryParams, pathParams),
      };
    }
  }
  return null;
}

// ─── createRouter ─────────────────────────────────────────────────

export function createRouter(options: RouterOptions): RouterInstance {
  const mode = resolveMode(options.mode);
  const { routes } = options;

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
    const matched = matchRoute(pathname, search, routes);

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
        console.error('[router] onChange failed:', err);
      });
    } catch (err) {
      console.error('[router] onChange failed:', err);
    }
  }

  async function commitNavigation(
    path: string,
    navOptions: { replace: boolean; depth?: number },
  ): Promise<void> {
    const depth = navOptions.depth ?? 0;
    if (depth > MAX_GUARD_REDIRECTS) {
      throw new Error(
        `[router] Guard redirect limit exceeded while navigating to "${path}"`,
      );
    }

    // Run guard if we have a matching target route
    const u = new URL(path, 'http://x');
    const matched = matchRoute(u.pathname, u.search, routes);
    if (matched?.route.guard) {
      const result = await matched.route.guard();
      if (result === false) return; // blocked
      if (typeof result === 'string') {
        return commitNavigation(result, {
          replace: navOptions.replace,
          depth: depth + 1,
        });
      }
    }

    const url = mode === 'hash' ? toHashUrl(path) : path;
    if (navOptions.replace) {
      history.replaceState(null, '', url);
    } else {
      history.pushState(null, '', url);
    }
    rematch();
    notifyChange();
  }

  function navigate(path: string): Promise<void> {
    return commitNavigation(path, { replace: false });
  }

  function replace(path: string): Promise<void> {
    return commitNavigation(path, { replace: true });
  }

  function dispose(): void {
    for (const { type, handler } of listeners) {
      removeEventListener(type, handler);
    }
    listeners.length = 0;
  }

  // ─── Initialization ───────────────────────────────────────────

  if (mode === 'history') {
    addCleanupListener('popstate', () => {
      rematch();
      notifyChange();
    });
  } else {
    addCleanupListener('hashchange', () => {
      rematch();
      notifyChange();
    });
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
