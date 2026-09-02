# @openelement/element

Canonical component-authoring facade for openElement (0.44).

This package exposes `OpenElement`, the product-facing base class for native
Web Components, running on the compiled Part Program kernel: one mandatory
compiler (`@openelement/adapter-vite`) lowers each component's `render()` into
a serializable program consumed by server serialization, fresh DOM creation,
and existing-DOM claim alike. Shadow/DSD is the default render mode; light DOM
remains explicit opt-in.

Also includes:

- `ErrorBoundary` — error boundary (`static isErrorBoundary = true`) that automatically captures subtree render failures: on SSR the boundary renders its `onError()` fallback in place of the failed subtree, and on the client a failing descendant's render/update bubbles to the nearest boundary's `catchError()`. A subclass `render()` branches on `hasError` to swap in the `onError()` fallback UI; `retry()` re-renders both the boundary and the captured source element, `reset()` clears the state entirely. Without a boundary, SSR keeps the bare-tag degradation and CSR keeps the per-element `onRenderError()` fallback
- `element` / `property` — compile-time-only decorator intrinsics: the compiler admits them by binding provenance and erases them from generated code; evaluated without the compiler they are inert no-ops
- Signals: `signal`, `computed`, `effect`, and the `Signal` type
- Context (`createContext` / `provideContext` / `consumeContext`), `StyleSheet`, HTML escaping utilities, and the `trustedHtml` explicit trust boundary
- `@openelement/element/sanitize` — the `sanitizeHtml` allow-list sanitizer

## Install

```bash
npm install @openelement/element
```

## Usage

Components are classes decorated with `@element` and compiled by the
`@openelement/adapter-vite` build — there is no runtime registration call in
authoring source:

```tsx
import { element, OpenElement, property } from '@openelement/element';

@element('my-card', { root: 'shadow-open' })
export class MyCard extends OpenElement {
  @property({ reflect: false, attribute: false })
  title = '';

  render() {
    return (
      <article>
        <h2>{this.title}</h2>
      </article>
    );
  }
}
```

Instance properties decorated with `@property` are the reactive state contract;
the compiler wires them to the signal engine so server output, fresh DOM, and
claimed DOM share one identity model. Styles ship via `static styles` (a scoped
`StyleSheet`); raw-text `<style>`/`<script>` tags are rejected from templates.

The earlier functional authoring helper and the runtime JSX factories were
removed in v0.44; see `docs/current/v0.44.0-MIGRATION.md` for the
before/after mapping.

## Boundary

`@openelement/element` does not own routing, Vite, Nitro, UI components,
database, auth, cache, or the default signal engine. Those remain Framework,
UI, Protocols, or adapter concerns.

## License

MIT
