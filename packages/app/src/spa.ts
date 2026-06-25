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
} from '@openelement/router/client-router';
import {
  __internal_popData,
  __internal_pushActionData,
  __internal_pushLoaderData,
} from '@openelement/router/data-context';
import type { RouterMode } from '@openelement/router/client-router';

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
  /** Dispose the SPA: clear DOM, dispose router, remove listeners, pop all data. Idempotent. */
  dispose(): void;
}

// ─── defineApp ─────────────────────────────────────────────────

export function defineApp(options: SpaAppOptions): SpaAppInstance {
  let router: RouterInstance | null = null;
  let rootEl: Element | null = null;
  let submitHandler: ((e: Event) => void) | null = null;
  let renderId = 0;

  /** Duck-type check since `Node` may not exist in test environments (e.g. Deno). */
  function isRenderableNode(value: unknown): value is Node {
    return value !== null && typeof value === 'object' && 'nodeType' in value;
  }

  /** Pop the last render cycle's data frame from the stack. */
  function clearDataStack(): void {
    // pop on empty array returns undefined; one render cycle leaves at most one frame.
    __internal_popData();
  }

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
      console.error('[spa] loader failed:', err);
      return undefined;
    }
  }

  /** Render the current route component into rootEl. */
  function renderComponent(): void {
    if (!router || !rootEl) return;
    const route = router.currentRoute;
    rootEl.innerHTML = '';
    if (route) {
      const result = route.component();
      if (isRenderableNode(result)) {
        rootEl.appendChild(result);
      }
    }
  }

  /**
   * Full render cycle: pop old data → run loader → push loader data → render component.
   */
  async function renderRoute(): Promise<void> {
    if (!router || !rootEl) return;
    const currentRender = ++renderId;

    // Pop previous render's data (safe no-op on empty stack)
    __internal_popData();

    // Run loader and push result
    const loaderData = await runLoader();
    if (currentRender !== renderId || !router || !rootEl) return;

    __internal_pushLoaderData(loaderData);

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

  /**
   * Handle form submissions via event delegation on the root element.
   * Runs the current route's action, re-runs the loader, pushes both
   * loader and action data, then re-renders the component.
   */
  async function handleFormSubmit(event: Event): Promise<void> {
    const form = event.target;
    if (!isFormElement(form)) return;
    if (!router || !rootEl) return;

    event.preventDefault();

    const route = router.currentRoute;
    if (!route?.action) return;

    // Pop old data first
    __internal_popData();

    // Run action
    let actionData: unknown = undefined;
    try {
      actionData = await route.action({ params: router.params });
    } catch (err) {
      console.error('[spa] action failed:', err);
      actionData = { error: String(err) };
    }

    // Re-run loader for fresh data
    const loaderData = await runLoader();

    // Push loader data, then action data on top (so both are visible to the render)
    __internal_pushLoaderData(loaderData);
    __internal_pushActionData(actionData);

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
      handleFormSubmit(e);
    };
    rootEl.addEventListener('submit', submitHandler);

    // Initial render for the current URL
    renderRoute();
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

    // Pop all remaining data from the stack
    clearDataStack();
  }

  return { mount, dispose };
}
