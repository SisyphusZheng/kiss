/**
 * @openelement/router/client-router - URL-based client-side router.
 *
 * Supports history (pushState), hash, and auto-detection modes.
 * Route patterns use `:param` for named params and `:param?` for optional params.
 */
export type RouterMode = 'history' | 'hash' | 'auto';

export interface RouteConfig {
  path: string; // e.g. '/products/:id'
  component: () => unknown;
  /** Client-side loader — runs before component render. Receives matched route params. */
  loader?: (ctx: { params: Record<string, string> }) => Promise<unknown>;
  /** Client-side action — runs on form submit. Receives matched route params. */
  action?: (ctx: { params: Record<string, string> }) => Promise<unknown>;
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

// ─── Internal helpers ─────────────────────────────────────────────

function resolveMode(mode: RouterMode): 'history' | 'hash' {
  if (mode === 'auto') {
    // ponytail: detect file:// protocol for local dev; use hash routing
    return typeof location !== 'undefined' && location.protocol === 'file:' ? 'hash' : 'history';
  }
  return mode;
}

function matchPattern(
  pattern: string,
  pathname: string,
): Record<string, string> | null {
  const patternParts = pattern === '/' ? [] : pattern.split('/').filter(Boolean);
  const pathParts = pathname === '/' ? [] : pathname.split('/').filter(Boolean);

  const params: Record<string, string> = Object.create(null);
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
  target: Record<string, string>,
  name: string,
  value: string,
): void {
  if (!isSafeParamName(name)) return;
  Object.defineProperty(target, name, {
    value,
    enumerable: true,
    configurable: true,
    writable: true,
  });
}

function copyParams(
  target: Record<string, string>,
  source: Record<string, string>,
): void {
  for (const [key, value] of Object.entries(source)) {
    setParam(target, key, value);
  }
}

function parseQuery(search: string): Record<string, string> {
  const result: Record<string, string> = Object.create(null);
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
      const params: Record<string, string> = Object.create(null);
      copyParams(params, queryParams);
      copyParams(params, pathParams);
      return {
        route,
        params,
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
    try {
      void Promise.resolve(options.onChange?.()).catch((err) => {
        console.error('[router] onChange failed:', err);
      });
    } catch (err) {
      console.error('[router] onChange failed:', err);
    }
  }

  async function navigate(path: string): Promise<void> {
    // Run guard if we have a matching target route
    const u = new URL(path, 'http://x');
    const matched = matchRoute(u.pathname, u.search, routes);
    if (matched?.route.guard) {
      const result = await matched.route.guard();
      if (result === false) return; // blocked
      if (typeof result === 'string') {
        return navigate(result); // redirect
      }
    }

    history.pushState(null, '', mode === 'hash' ? toHashUrl(path) : path);
    rematch();
    notifyChange();
  }

  async function replace(path: string): Promise<void> {
    const u = new URL(path, 'http://x');
    const matched = matchRoute(u.pathname, u.search, routes);
    if (matched?.route.guard) {
      const result = await matched.route.guard();
      if (result === false) return;
      if (typeof result === 'string') {
        return navigate(result);
      }
    }

    history.replaceState(null, '', mode === 'hash' ? toHashUrl(path) : path);
    rematch();
    notifyChange();
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
