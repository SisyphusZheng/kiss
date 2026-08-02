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
import { normalizeActionFailure, normalizeLoaderFailure } from './internal/action-error.ts';
import { isOpenElementNotFound, isOpenElementRedirect } from './authoring.ts';
import { SpaRequestCache } from './internal/spa-request-cache.ts';
import { isDevMode } from './internal/dev-mode.ts';
import { assertValidTagName, createLogger, ERROR_PREFIX } from '@openelement/element';

const log = createLogger('spa');

const development = isDevMode();

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
  let currentLoaderError: unknown;
  let currentActionData: unknown;
  const requestCache = new SpaRequestCache();

  /**
   * Run loader for current route (if any). On failure returns a normalized
   * page error (#676) instead of fake loader data — the error rides the page
   * error channel (`__openElementError`), mirroring the action failure
   * channel (normalizeActionFailure), so pages render their error definition
   * rather than silently receiving an empty data shape.
   *
   * redirect()/notFound() are control flow, not failures (#731): a redirect
   * navigates the router (a committed navigation bumps renderId, so the
   * in-flight render cycle aborts before committing; a guard-vetoed redirect
   * is flagged via `redirected` so the caller keeps the current page data
   * instead of clearing it — #802), and a notFound rides the same page error
   * channel with the original error so the error definition can read its 404
   * status/message — mirroring the server chain.
   */
  async function runLoader(): Promise<{ data: unknown; error?: unknown; redirected?: boolean }> {
    if (!router) return { data: undefined };
    const route = router.currentRoute;
    if (!route?.loader) return { data: undefined };
    try {
      return { data: await route.loader({ params: router.params }) };
    } catch (err) {
      if (isOpenElementRedirect(err)) {
        // Skip navigation if the app was disposed while the loader awaited.
        if (router) await router.navigate(err.location);
        return { data: undefined, redirected: true };
      }
      if (isOpenElementNotFound(err)) {
        return { data: undefined, error: err };
      }
      return { data: undefined, error: normalizeLoaderFailure(err, development, log.error) };
    }
  }

  /** Render the current custom-element route into rootEl. */
  function renderComponent(): void {
    if (!router || !rootEl) return;
    const route = router.currentRoute;
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
      new URL(router.currentPath || '/', location.href).href,
    );
    applyPageHostData(el, {
      data: currentLoaderData,
      actionData: currentActionData,
      params: router.params,
      request,
      route: { path: route.path },
      meta: {},
      error: currentLoaderError,
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
    const { data: loaderData, error: loaderError, redirected } = await runLoader();
    if (currentRender !== renderId || !router || !rootEl) return;
    // A guard vetoed the loader's redirect: the navigation never committed, so
    // keep the current page's loader data rather than re-rendering with
    // `data: undefined` — mirroring the action redirect path (#802).
    if (redirected) return;
    currentLoaderData = loaderData;
    currentLoaderError = loaderError;
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
    } catch (err) {
      log.warn('FormData construction failed; action runs without form data:', err);
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
      // #731: redirect()/notFound() are control flow, not action failures —
      // they must not be normalized into `{ error: 'Action failed' }` data.
      if (isOpenElementRedirect(err)) {
        // PRG: navigate to the redirect target; its own render cycle renders
        // the destination. Skip if the app was disposed while awaiting.
        if (router) await router.navigate(err.location);
        return;
      }
      if (isOpenElementNotFound(err)) {
        // Mirror the server chain: render the page error channel with the
        // original 404 error instead of re-running the loader.
        if (currentRender !== renderId || !router || !rootEl) return;
        currentLoaderError = err;
        currentActionData = undefined;
        renderComponent();
        return;
      }
      actionData = normalizeActionFailure(err, development, log.error);
    }

    // Re-run loader for fresh data
    const { data: loaderData, error: loaderError, redirected } = await runLoader();
    if (currentRender !== renderId || !router || !rootEl) return;
    // A guard vetoed the loader's redirect: the navigation never committed, so
    // keep the current page's data rather than re-rendering with
    // `data: undefined` — same guard as renderRoute (#802, #810).
    if (redirected) return;

    currentLoaderData = loaderData;
    currentLoaderError = loaderError;
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
      throw new Error(`${ERROR_PREFIX} Mount target not found: "${selector}"`);
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
    currentLoaderError = undefined;
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
