/** @jsxImportSource preact */

import { useEffect } from "preact/hooks";

/**
 * openElement Boot Island
 *
 * Imports @openelement/ui which registers <open-button>, <open-card>, etc.
 * as custom elements. Then calls hydrateOpenElement on document.body to
 * explicitly hydrate DSD content and bind event markers.
 *
 * This proves that openElement custom elements can be bootstrapped and
 * hydrated from within a third-party framework (Fresh + Preact islands).
 */
export default function OpenElementsIsland() {
  useEffect(() => {
    // Dynamic import so @openelement/ui is only loaded on the client.
    // The import registers customElements.define('open-button', ...),
    // customElements.define('open-card', ...) as side effects.
    import("@openelement/ui").then(() => {
      // After the custom elements are defined, scan the document and hydrate
      // any existing openElement tags. The browser auto-upgrades them, but
      // explicit hydration ensures DSD event markers are bound.
      hydrateOpenElement(document.body);
    });
  }, []);

  // This island has no visible UI — it's a side-effect bootstrapper.
  return null;
}

/**
 * Hydrate openElement custom elements within a DOM subtree.
 *
 * Iterates over all elements matching openElement tag prefixes and triggers
 * the standard hydration path (collect event bindings from VNode, bind to DOM).
 *
 * ponytail: simple document scan; for performance-sensitive pages use
 * MutationObserver-based incremental hydration.
 */
function hydrateOpenElement(root: ParentNode): void {
  // Collect all openElement custom elements (tag name starts with "open-")
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_ELEMENT,
    {
      acceptNode(node) {
        const tag = (node as Element).tagName.toLowerCase();
        return tag.startsWith("open-")
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_SKIP;
      },
    },
  );

  const elements: Element[] = [];
  let node: Element | null = walker.nextNode() as Element | null;
  while (node) {
    elements.push(node);
    node = walker.nextNode() as Element | null;
  }

  // Force upgrade: each element's connectedCallback runs, which calls
  // _renderOrHydrate() → _hydrateExistingDom() for DSD pre-populated content.
  // This also triggers customElements.upgrade() for any elements that were
  // parsed before the custom element definitions were registered.
  if (typeof customElements !== "undefined") {
    for (const el of elements) {
      customElements.upgrade(el);
    }
  }

  console.log(
    `[openElement] Hydrated ${elements.length} openElement custom element(s).`,
  );
}
