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
import { useActionData, useLoaderData } from './internal/router/data-context.ts';
import {
  popData,
  pushActionData,
  pushLoaderData,
} from './internal/router/internal/data-context.ts';

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
  /** The client-side router instance. Null before mount. */
  readonly router: RouterInstance | null;
}

// ─── defineApp ─────────────────────────────────────────────────

export function defineApp(options: SpaAppOptions): SpaAppInstance {
  let router: RouterInstance | null = null;
  let rootEl: Element | null = null;
  let submitHandler: ((e: Event) => void) | null = null;
  let renderId = 0;

  /** Pop the last render cycle's data frame from the stack. */
  function clearDataStack(): void {
    // pop on empty array returns undefined; one render cycle leaves at most one frame.
    popData();
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

  /** Render the current custom-element route into rootEl. */
  function renderComponent(): void {
    if (!router || !rootEl) return;
    const route = router.currentRoute as (RouteConfig & { tagName?: string });
    rootEl.innerHTML = '';

    if (!route) return;

    // OpenElement route: create custom element from tagName, set loader data as properties
    if (!route.tagName) return;
    const el = document.createElement(route.tagName) as HTMLElement & Record<string, unknown>;
    const loaderData = useLoaderData();
    if (loaderData && typeof loaderData === 'object') Object.assign(el, loaderData);
    const actionData = useActionData();
    if (actionData !== undefined) el.actionData = actionData;
    rootEl.appendChild(el);
  }

  /**
   * Full render cycle: pop old data → run loader → push loader data → render component.
   */
  async function renderRoute(): Promise<void> {
    if (!router || !rootEl) return;
    const currentRender = ++renderId;

    // Pop previous render's data (safe no-op on empty stack)
    popData();

    // Run loader and push result
    const loaderData = await runLoader();
    if (currentRender !== renderId || !router || !rootEl) return;

    pushLoaderData(loaderData);

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
    // Shadow DOM retargeting: when a <button type="submit"> inside a custom
    // element (e.g. <open-button type="submit">) triggers the form's submit
    // event, by the time the event bubbles out to our root listener,
    // event.target is retargeted to the host element (open-button), NOT the
    // <form>. Use composedPath() to find the actual form in the shadow tree.
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

    // Pop old data first
    popData();

    // Run action
    let actionData: unknown = undefined;
    try {
      actionData = await route.action({
        params: router.params,
        formData: createFormData(form),
      });
    } catch (err) {
      console.error('[spa] action failed:', err);
      actionData = { error: String(err) };
    }

    // Re-run loader for fresh data
    const loaderData = await runLoader();
    if (currentRender !== renderId || !router || !rootEl) return;

    // Push loader data, then action data on top (so both are visible to the render)
    pushLoaderData(loaderData);
    pushActionData(actionData);

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
        console.error('[spa] form submit failed:', err);
      });
    };
    rootEl.addEventListener('submit', submitHandler);

    // Initial render for the current URL
    void renderRoute().catch((err) => {
      console.error('[spa] initial render failed:', err);
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

    // Pop all remaining data from the stack
    clearDataStack();
  }

  return {
    mount,
    dispose,
    get router() {
      return router;
    },
  };
}
