/**
 * Shared router reference for SPA navigation.
 * Set by reader.tsx after mount, used by route components.
 */
import type { RouterInstance } from "@openelement/router/client-router";

let _router: RouterInstance | null = null;

export function setRouter(router: RouterInstance | null): void {
  _router = router;
}

export function getRouter(): RouterInstance | null {
  return _router;
}

export function navigate(path: string): void {
  if (_router) {
    _router.navigate(path);
  } else {
    // fallback for when router isn't ready
    history.pushState(null, "", path);
    globalThis.dispatchEvent(new PopStateEvent("popstate"));
  }
}

export function currentParams(): Record<string, string> {
  return _router?.params ?? {};
}

export function currentPath(): string {
  return _router?.currentPath ?? location.pathname + location.search;
}
