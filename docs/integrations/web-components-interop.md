# Web Components Interop Contract

openElement treats standard Custom Elements as the platform boundary. A custom
element tag in JSX remains a real DOM tag; openElement does not wrap or replace
the browser's `customElements` registry.

## Guarantees

- JSX string tags are preserved as HTML tags, including unknown custom element
  names such as `<sl-button>` or `<my-widget>`.
- SSR/SSG preserves tag names, primitive attributes, boolean attributes, light
  DOM children, and named slots.
- `className` serializes to `class`, `htmlFor` serializes to `for`, and camelCase
  custom-element attributes serialize to kebab-case.
- OpenElement event props support both common JSX names such as `onClick` and
  dashed custom event names such as `on-sl-change`.
- OpenElement signal hydration only claims openElement signal markers. Third
  party Custom Elements keep ownership of their own lifecycle, shadow DOM, and
  reactivity.
- The global `customElements.define()` registry is shared. Tag-name collisions
  are application responsibility.

## Non-Guarantees

- openElement does not automatically server-render arbitrary third-party shadow
  roots. Declarative shadow DOM is used only when the component/library supports
  that contract; otherwise light-DOM SSR plus browser upgrade is the expected
  fallback.
- openElement does not infer complex object/array DOM properties from attributes.
  Use a `ref`, a small local wrapper, or the third-party library's own API for
  property-only configuration.
- openElement does not generate adapters for Lit, Shoelace, Material Web, FAST,
  Stencil, React, Vue, or Svelte.

## API Preference

Runtime-free/browser-facing code should prefer native Web Platform APIs:
Custom Elements, `HTMLElement`, Shadow DOM, DOM Events, `CustomEvent`,
`AbortController`, `URL`, `URLSearchParams`, `fetch`, Streams, `FormData`,
`structuredClone`, and `queueMicrotask`.

When native APIs are not enough, prefer mature standards-compatible open source
libraries before writing a custom replacement. Custom wrappers around a Web API
need an explicit reason: compatibility, SSR isolation, package boundary, or a
stable openElement contract that the native API alone cannot provide.
