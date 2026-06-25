/**
 * Minimal SPA runtime for the Desktop Reader.
 *
 * ponytail: replicates defineApp({ mode: 'spa' }) + createRouter
 * without importing @openelement/* packages. The reader is a self-contained
 * dogfood app that proves the SPA pattern before the full framework packages
 * are published to npm.
 *
 * Once @openelement/app and @openelement/router are published, replace this
 * with `import { defineApp } from '@openelement/app'`.
 */

export interface RouteConfig {
  path: string;
  component: (ctx: {
    params: Record<string, string>;
    query: URLSearchParams;
    navigate: (path: string) => void;
  }) => void | DocumentFragment;
}

export interface SpaApp {
  navigate(path: string): void;
}

const ROUTES: RouteConfig[] = [];
let currentApp: SpaApp | null = null;
let beforeQueryCallback: ((q: URLSearchParams) => string | null) | null = null;

/** Register routes (called once before createApp) */
export function defineRoutes(routes: RouteConfig[]): void {
  ROUTES.length = 0;
  ROUTES.push(...routes);
}

/** Intercept search queries for + decoding (called once before createApp) */
export function onBeforeRoute(
  cb: (parsed: URLSearchParams) => string | null,
): void {
  beforeQueryCallback = cb;
}

function matchRoute(pathname: string) {
  for (const route of ROUTES) {
    const pattern = route.path.replace(/:(\w+)/g, "(?<$1>[^/]+)");
    const re = new RegExp(`^${pattern}$`);
    const match = pathname.match(re);
    if (match) {
      const params: Record<string, string> = {};
      for (const [key, value] of Object.entries(match.groups ?? {})) {
        params[key] = value;
      }
      return { route, params };
    }
  }
  return null;
}

function renderRoute(path: string): void {
  const root = document.querySelector("#root");
  if (!root) return;

  const url = new URL(path, location.origin);

  // ponytail: + decoding for search queries
  if (beforeQueryCallback) {
    const redirect = beforeQueryCallback(url.searchParams);
    if (redirect) {
      history.replaceState(null, "", redirect);
      return;
    }
  }

  const matched = matchRoute(url.pathname);
  root.innerHTML = "";

  if (matched) {
    const frag = matched.route.component({
      params: matched.params,
      query: url.searchParams,
      navigate: (p) => currentApp?.navigate(p),
    });
    if (frag instanceof DocumentFragment) {
      root.appendChild(frag);
    }
  } else {
    root.textContent = "404 — Page not found";
  }
}

/** Create and mount the SPA app */
export function createApp(routes: RouteConfig[]): SpaApp {
  defineRoutes(routes);

  const app: SpaApp = {
    navigate(path: string): void {
      history.pushState(null, "", path);
      renderRoute(path);
    },
  };

  currentApp = app;

  window.addEventListener("popstate", () => {
    renderRoute(location.pathname + location.search);
  });

  renderRoute(location.pathname + location.search);

  return app;
}

// ─── Keyboard shortcuts ──────────────────────────────────────

document.addEventListener("keydown", (e: KeyboardEvent) => {
  // Don't steal keystrokes while typing in inputs/textareas
  const tag = (e.target as HTMLElement)?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

  const path = location.pathname;

  if ((e.metaKey || e.ctrlKey) && e.key === "f") {
    e.preventDefault();
    currentApp?.navigate("/search");
    return;
  }

  if ((e.metaKey || e.ctrlKey) && e.key === ",") {
    e.preventDefault();
    currentApp?.navigate("/settings");
    return;
  }

  if (e.key === "Escape" && (path === "/settings" || path === "/search")) {
    currentApp?.navigate("/");
    return;
  }
});
