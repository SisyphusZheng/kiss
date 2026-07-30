/**
 * @openelement/app - SPA (Single Page Application) bootstrap.
 *
 * Creates a client-side SPA with history-based routing, loader/action
 * data flow, and form action interception.
 */
import {
  createRouter,
  type RouteConfig,
  type RouterInstance,
  type RouterMode,
} from './internal/router/client-router.ts';
import { applyPageHostData, type PageHostElement } from './internal/page-host-data.ts';
import { normalizeActionFailure } from './internal/action-error.ts';
import { SpaRequestCache } from './internal/spa-request-cache.ts';
import { createLogger } from '@openelement/element';

const log = createLogger('spa');

/**
 * Validate a custom element tagName. Tag names must be non-empty and contain
 * only lowercase letters, digits, and hyphens (per the HTML custom element
 * spec). Throws a `SyntaxError` with a helpful message on violation (#642).
 */
export function assertValidTagName(tagName: string): void {
  if (typeof tagName !== 'string' || !/^[a-z0-9-]+$/.test(tagName)) {
    throw new SyntaxError(
      `[spa] Invalid tagName "${tagName}": tag names must contain only ` +
        'lowercase letters, digits, and hyphens.',
    );
  }
}

interface ImportMetaWithEnvironment extends ImportMeta {
  env?: { DEV?: boolean };
}

const development = (import.meta as ImportMetaWithEnvironment).env?.DEV === true;

// ─── Public types ──────────────────────────────────────────────

export interface SpaAppOptions {
  mode: 'spa';
  /** Route definitions. If omitted, no routes are registered. */
  routes?: RouteConfig[];
  /** Router mode. Defaults to auto: history on http(s), hash on file://. */
  routerMode?: RouterMode;
}

export interface SpaAppInstance {
  /** Mount the SPA into the given CSS selector. Idempotent — re-mount starts fresh. */
  mount(selector: string): void;
  /** Dispose the SPA: clear DOM, dispose router, and remove listeners. Idempotent. */
  dispose(): void;
  /** The client-side router instance. Null before mount. */
  readonly router: RouterInstance | null;
}

// ─── defineApp ─────────────────────────────────────────────────

export function defineApp(options: SpaAppOptions): SpaAppInstance {
  let router: RouterInstance | null = null;
  let rootEl: Element | null = null;
  let submitHandler: ((e: Event) => void) | null = null;
  let renderId = 0;
  let currentLoaderData: unknown;
  let currentActionData: unknown;
  const requestCache = new SpaRequestCache();

  /**
   * Run loader for current route (if any) and push its result.
   * Returns the loader data.
   */
  async function runLoader(): Promise<unknown> {
    if (!router) return undefined;
    const route = router.currentRoute;
    if (!route?.loader) return undefined;
    try {
      return await route.loader({ params: router.params });
    } catch (err) {
      log.error('loader failed:', err);
      return undefined;
    }
  }

  /** Render the current custom-element route into rootEl. */
  function renderComponent(): void {
    if (!router || !rootEl) return;
    const route = router.currentRoute as RouteConfig;
    rootEl.innerHTML = '';

    if (!route) return;

    // tagName is required by RouteConfig. Validate before touching the DOM so a
    // malformed value fails loudly (SyntaxError) instead of silently rendering
    // nothing (#642).
    assertValidTagName(route.tagName);

    // Unregistered custom elements would render as inert, empty hosts. Warn and
    // skip rendering rather than injecting an unknown element (#642).
    if (typeof customElements !== 'undefined' && !customElements.get(route.tagName)) {
      log.warn(`unregistered tagName: ${route.tagName}`);
      return;
    }

    const el = document.createElement(route.tagName) as PageHostElement;
    const request = typeof location === 'undefined' ? undefined : requestCache.get(
      new URL(router.currentPath || '/', location.href ?? 'http://localhost/').href,
    );
    applyPageHostData(el, {
      data: currentLoaderData,
      actionData: currentActionData,
      params: router.params,
      request,
      route: { path: route.path },
      meta: {},
    });
    rootEl.appendChild(el);
  }

  /**
   * Full render cycle: pop old data → run loader → push loader data → render component.
   */
  async function renderRoute(): Promise<void> {
    if (!router || !rootEl) return;
    const currentRender = ++renderId;

    // Load before committing so stale navigations cannot overwrite the current route.
    const loaderData = await runLoader();
    if (currentRender !== renderId || !router || !rootEl) return;
    currentLoaderData = loaderData;
    currentActionData = undefined;

    renderComponent();
  }

  /** Duck-type check: is this element a form? Works in test environments without HTMLElement globals. */
  function isFormElement(el: unknown): el is HTMLFormElement {
    return (
      el !== null &&
      typeof el === 'object' &&
      'tagName' in el &&
      (el as { tagName: string }).tagName === 'FORM'
    );
  }

  function createFormData(form: HTMLFormElement): FormData | undefined {
    try {
      return new FormData(form);
    } catch {
      return undefined;
    }
  }

  /**
   * Handle form submissions via event delegation on the root element.
   * Runs the current route's action, re-runs the loader, pushes both
   * loader and action data, then re-renders the component.
   */
  async function handleFormSubmit(event: Event): Promise<void> {
    // A submit event originating inside a shadow tree is only visible here
    // when it was dispatched as composed — the native submit behavior of a
    // shadow <button> never crosses the boundary, which is why open-button
    // explicitly re-dispatches a composed submit on the form (see
    // open-button.tsx). By the time that event bubbles out to this root
    // listener, event.target is retargeted to the shadow host (e.g.
    // open-button), NOT the <form>. Use composedPath() to find the actual
    // form in the shadow tree.
    let form: unknown = event.target;
    if (!isFormElement(form)) {
      const path = event.composedPath();
      for (const node of path) {
        if (isFormElement(node)) {
          form = node;
          break;
        }
      }
    }
    if (!isFormElement(form)) return;
    if (!router || !rootEl) return;

    const route = router.currentRoute;
    if (!route?.action) return;
    const currentRender = ++renderId;

    event.preventDefault();

    // Run action
    let actionData: unknown = undefined;
    try {
      actionData = await route.action({
        params: router.params,
        formData: createFormData(form),
      });
    } catch (err) {
      actionData = normalizeActionFailure(err, development);
    }

    // Re-run loader for fresh data
    const loaderData = await runLoader();
    if (currentRender !== renderId || !router || !rootEl) return;

    currentLoaderData = loaderData;
    currentActionData = actionData;

    renderComponent();
  }

  function mount(selector: string): void {
    // Clean up any previous mount (idempotent re-mount)
    if (router) {
      dispose();
    }
    renderId++;

    const el = document.querySelector(selector);
    if (!el) {
      throw new Error(`[spa] Mount target not found: "${selector}"`);
    }
    rootEl = el;

    router = createRouter({
      mode: options.routerMode ?? 'auto',
      routes: options.routes ?? [],
      onChange: renderRoute,
    });

    /** Intercept form submissions for action support. */
    submitHandler = (e: Event) => {
      void handleFormSubmit(e).catch((err) => {
        log.error('form submit failed:', err);
      });
    };
    rootEl.addEventListener('submit', submitHandler);

    // Initial render for the current URL
    void renderRoute().catch((err) => {
      log.error('initial render failed:', err);
    });
  }

  function dispose(): void {
    // Remove form submit listener
    renderId++;
    if (submitHandler && rootEl) {
      rootEl.removeEventListener('submit', submitHandler);
      submitHandler = null;
    }

    if (router) {
      router.dispose();
      router = null;
    }
    if (rootEl) {
      rootEl.innerHTML = '';
      rootEl = null;
    }

    currentLoaderData = undefined;
    currentActionData = undefined;
    requestCache.clear();
  }

  return {
    mount,
    dispose,
    get router() {
      return router;
    },
  };
}
