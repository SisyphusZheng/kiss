/**
 * @openelement/app/internal/router/client-router - URLPattern/RouteTable client router.
 *
 * Supports history (pushState), hash, and auto-detection modes.
 * Alpha.9 authority: URLPattern owns pathname grammar and RouteTable owns
 * declaration order, query merging, safe params, and static lookup.
 *
 * Alpha.9 removes client-local route grammars and compatibility matchers so
 * browser navigation and the other route consumers share one semantic owner.
 */
// SPA loader/action contexts are deliberately narrower than the request-time
// LoaderContext/ActionContext: the client-side chain supplies only params
// (+ formData for actions) and signals failure by throwing (#570, ADR-0119
// frozen semantics — types clarified, runtime unchanged).
import type { SpaActionContext, SpaLoaderContext } from '@openelement/element';
import { createLogger, ERROR_PREFIX } from '@openelement/element';
import { RouteTable } from './route-table.ts';

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

const MAX_GUARD_REDIRECTS = 10;

export type CompiledRouteMatcher = Pick<
  RouteTable<RouteConfig>,
  'match' | 'candidateCount'
>;

// ─── Internal helpers ─────────────────────────────────────────────

function resolveMode(mode: RouterMode): 'history' | 'hash' {
  if (mode === 'auto') {
    // detect file:// protocol for local dev; use hash routing
    return typeof location !== 'undefined' && location.protocol === 'file:' ? 'hash' : 'history';
  }
  return mode;
}

/** Match a route through the canonical Alpha.9 RouteTable. */
export function matchRoute(
  pathname: string,
  search: string,
  routes: RouteConfig[],
): { route: RouteConfig; params: Record<string, string> } | null {
  return matcherFor(routes).match(pathname, search);
}

export function compileRouteMatcher(routes: RouteConfig[]): CompiledRouteMatcher {
  return new RouteTable(routes);
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
  const routeMatcher = matcherFor(routes);

  let currentPath = '';
  let currentRoute: RouteConfig | null = null;
  let currentParams: Record<string, string> = Object.create(null);
  let disposed = false;

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
    if (disposed) return;
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

  /**
   * Restore the entry the user came from after a guard vetoed a
   * browser-driven navigation. replaceState — not pushState (#1036): pushing
   * left the vetoed entry sitting directly below the restored copy, so the
   * next back re-landed on the vetoed URL and bounced again, trapping every
   * earlier entry behind it (the user could never back out past the guard).
   * Rewriting the vetoed entry instead collapses the dead stop, and
   * replaceState does not fire popstate/hashchange, so restoring cannot
   * re-enter commitBrowserNavigation.
   */
  function restoreBlockedEntry(): void {
    history.replaceState(null, '', mode === 'hash' ? toHashUrl(currentPath) : currentPath);
  }

  async function commitNavigation(
    path: string,
    navOptions: { replace: boolean; depth?: number; restoreOnBlock?: boolean },
    ticket?: number,
  ): Promise<void> {
    if (disposed) return;
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
      if (disposed) return;
      // Latest-wins (#1023): a newer programmatic navigation already owns the
      // outcome; a superseded guard resolution must not push state.
      if (ticket !== undefined && ticket !== programmaticNavigationSeq) return;
      if (result === false) {
        if (navOptions.restoreOnBlock) {
          // Browser-driven navigation already landed on this URL (via a guard
          // redirect); restore the entry the user came from, same as the
          // direct block path in commitBrowserNavigation.
          restoreBlockedEntry();
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

    if (disposed || (ticket !== undefined && ticket !== programmaticNavigationSeq)) return;
    const url = mode === 'hash' ? toHashUrl(path) : path;
    if (navOptions.replace) {
      history.replaceState(null, '', url);
    } else {
      history.pushState(null, '', url);
    }
    // The router now owns the address bar, so the browser-event dedup key no
    // longer describes it: it may still name the URL an earlier guard
    // restore/redirect rewrote the landed entry to, and a genuine back onto
    // that entry must not be deduped away. commitBrowserNavigation re-derives
    // the key in its finally block after browser-driven processing.
    lastLandedUrl = null;
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
   * a rejected guard rewrites the landed entry back to the previous URL,
   * and a guard redirect replaces the landed entry with the redirect target.
   */
  // Dedup consecutive browser events that land on the same URL (rapid
  // popstate/hashchange bursts) so guards and onChange do not run twice
  // for what is effectively a single navigation.
  let lastLandedUrl: string | null = null;

  async function commitBrowserNavigation(): Promise<void> {
    if (disposed) return;
    const landed = readPath();
    if (landed === lastLandedUrl) return;
    try {
      const u = new URL(landed, 'http://x');
      const matched = routeMatcher.match(u.pathname, u.search);
      if (matched?.route.guard) {
        const seqAtGuardStart = programmaticNavigationSeq;
        const result = await matched.route.guard();
        if (disposed) return;
        if (result === false) {
          // Blocked: restore the entry the user came from (see
          // restoreBlockedEntry for why this rewrites rather than pushes).
          restoreBlockedEntry();
          return;
        }
        if (typeof result === 'string') {
          // Latest-wins (#1023): a programmatic navigation committed while
          // the guard was pending already owns the outcome; the stale
          // redirect must not replaceState over it. The captured seq rides
          // along as the ticket so the check keeps holding across the
          // redirect target's own guard await as well.
          if (seqAtGuardStart !== programmaticNavigationSeq) return;
          await commitNavigation(result, {
            replace: true,
            depth: 1,
            restoreOnBlock: true,
          }, seqAtGuardStart);
          return;
        }
      }
      if (disposed) return;
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
    if (disposed) return;
    browserNavigationQueue = browserNavigationQueue
      .then(commitBrowserNavigation)
      .catch((err) => {
        if (disposed) return;
        // Intentional fail-open: a rejected guard or a router error must not
        // wedge the queue or leave the UI inconsistent with the address bar,
        // so we log and converge to the real URL instead of rethrowing.
        log.error('browser navigation failed:', err);
        rematch();
        notifyChange();
      });
  }

  function dispose(): void {
    if (disposed) return;
    disposed = true;
    // Supersede every programmatic guard ticket that was issued before
    // disposal. Browser guards use the same disposed check after each await.
    programmaticNavigationSeq++;
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
