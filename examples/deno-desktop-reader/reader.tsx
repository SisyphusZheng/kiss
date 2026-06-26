/** @jsxImportSource @openelement/core */
import {
  createRouter,
  type RouteConfig,
} from "@openelement/router/client-router";
import {
  __internal_popData,
  __internal_pushActionData,
  __internal_pushLoaderData,
} from "@openelement/router/data-context";
import { setRouter } from "./router.ts";

// Register @openelement/ui custom elements on page load
import "@openelement/ui";

// Import route modules for loaders/actions/tagNames.
// Side-effect: each module's top-level customElements.define registers the OpenElement class.
import {
  loader as bookshelfLoader,
  tagName as bookshelfTag,
} from "./routes/index.tsx";
import {
  action as readingAction,
  loader as readingLoader,
  tagName as readingTag,
} from "./routes/books/[id].tsx";
import { loader as notesLoader, tagName as notesTag } from "./routes/notes.tsx";
import {
  loader as searchLoader,
  tagName as searchTag,
} from "./routes/search.tsx";
import {
  loader as settingsLoader,
  tagName as settingsTag,
} from "./routes/settings.tsx";
import { tagName as wcInteropTag } from "./routes/wc-interop.tsx";

// ─── Route config ──────────────────────────────────────────

interface ReaderRouteConfig extends RouteConfig {
  tagName: string;
}

const routes: ReaderRouteConfig[] = [
  {
    path: "/",
    loader: bookshelfLoader,
    component: () => bookshelfTag,
    tagName: bookshelfTag,
  },
  {
    path: "/books/:id",
    loader: readingLoader,
    action: readingAction,
    component: () => readingTag,
    tagName: readingTag,
  },
  {
    path: "/notes",
    loader: notesLoader,
    component: () => notesTag,
    tagName: notesTag,
  },
  {
    path: "/search",
    loader: searchLoader,
    component: () => searchTag,
    tagName: searchTag,
  },
  {
    path: "/settings",
    loader: settingsLoader,
    component: () => settingsTag,
    tagName: settingsTag,
  },
  { path: "/wc-interop", component: () => wcInteropTag, tagName: wcInteropTag },
];

// ─── SPA bootstrap ─────────────────────────────────────────

function initSpa(): void {
  const rootEl = document.querySelector("#root");
  if (!rootEl) {
    console.error("[reader] Mount target #root not found");
    return;
  }

  let currentElement: HTMLElement | null = null;
  let renderId = 0;

  // ponytail: duck-type check for form element
  function isFormElement(el: unknown): el is HTMLFormElement {
    return (
      el !== null &&
      typeof el === "object" &&
      "tagName" in el &&
      (el as { tagName: string }).tagName === "FORM"
    );
  }

  async function renderRoute(): Promise<void> {
    if (!router) return;
    const currentRender = ++renderId;

    const route = router.currentRoute as ReaderRouteConfig | null;

    // Pop previous render data
    __internal_popData();

    // Run loader
    let loaderData: unknown = undefined;
    if (route?.loader) {
      try {
        loaderData = await route.loader({ params: router.params });
      } catch (err) {
        console.error("[reader] loader failed:", err);
      }
    }
    if (currentRender !== renderId || !router) return;

    // Push loader data onto data-context stack
    __internal_pushLoaderData(loaderData);

    // Create the route element
    if (route && route.tagName) {
      const el = document.createElement(route.tagName) as
        & HTMLElement
        & Record<string, unknown>;

      // Set loader data as properties on the element
      if (loaderData && typeof loaderData === "object") {
        Object.assign(el, loaderData);
      }

      rootEl!.innerHTML = "";
      rootEl!.appendChild(el);
      currentElement = el;
    } else {
      rootEl!.innerHTML = "";
      currentElement = null;
    }
  }

  async function handleFormSubmit(event: Event): Promise<void> {
    if (!router) return;

    // Use composedPath to find the actual form inside shadow DOM
    const form = event.composedPath()[0];
    if (!isFormElement(form)) return;

    const route = router.currentRoute as ReaderRouteConfig | null;
    if (!route?.action) return;

    const currentRender = ++renderId;

    event.preventDefault();

    // Pop old data
    __internal_popData();

    // Run action with form data
    let actionData: unknown = undefined;
    try {
      const formData = new FormData(form);
      actionData = await route.action(
        { params: router.params, formData } as {
          params: Record<string, string>;
        },
      );
    } catch (err) {
      console.error("[reader] action failed:", err);
      actionData = { error: String(err) };
    }

    // Re-run loader
    let loaderData: unknown = undefined;
    if (route.loader) {
      try {
        loaderData = await route.loader({ params: router.params });
      } catch (err) {
        console.error("[reader] loader failed:", err);
      }
    }
    if (currentRender !== renderId || !router) return;

    // Push loader data then action data
    __internal_pushLoaderData(loaderData);
    __internal_pushActionData(actionData);

    // Update existing element with new data and action data
    if (currentElement) {
      if (loaderData && typeof loaderData === "object") {
        Object.assign(currentElement, loaderData);
      }
      // Set actionData as property for render() access
      (currentElement as unknown as Record<string, unknown>).actionData =
        actionData;

      // Trigger re-render via OpenElement.update()
      if (
        typeof (currentElement as unknown as { update?: () => void }).update ===
          "function"
      ) {
        (currentElement as unknown as { update: () => void }).update();
      }
    }
  }

  // Create router
  const router = createRouter({
    mode: "auto",
    routes: routes as RouteConfig[],
    onChange: () => {
      void renderRoute().catch((err) =>
        console.error("[reader] render failed:", err)
      );
    },
  });

  setRouter(router);

  // Form submission handler (event delegation on root)
  const submitHandler = (e: Event) => {
    void handleFormSubmit(e).catch((err) =>
      console.error("[reader] form submit failed:", err)
    );
  };
  rootEl.addEventListener("submit", submitHandler);

  // Keyboard shortcuts
  document.addEventListener("keydown", (e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
    if ((e.metaKey || e.ctrlKey) && e.key === "f") {
      e.preventDefault();
      router.navigate("/search");
    }
    if ((e.metaKey || e.ctrlKey) && e.key === ",") {
      e.preventDefault();
      router.navigate("/settings");
    }
  });

  // Initial render
  void renderRoute().catch((err) =>
    console.error("[reader] initial render failed:", err)
  );
}

// Start when DOM is ready
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSpa);
  } else {
    initSpa();
  }
}
