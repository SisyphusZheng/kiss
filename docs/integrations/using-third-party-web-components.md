# Using Third-Party Web Components

alpha.3 validates direct consumption of mature Web Components libraries inside
openElement apps. The primary evidence targets are Lit, Shoelace, and Material
Web Components.

## Recommended Pattern

Use the component's standard tag directly in JSX:

```tsx
/** @jsxImportSource @openelement/core */

export function SettingsControls() {
  return (
    <section>
      <sl-switch on-sl-change={(event) => console.log(event)}>Enabled</sl-switch>
      <md-filled-button onClick={() => console.log('clicked')}>Save</md-filled-button>
    </section>
  );
}
```

Load the third-party library in browser/client code according to that library's
documentation. For libraries that assume browser globals, avoid importing their
registration modules during SSR module evaluation; import them from client-only
code or an island activation path.

## SSR Behavior

openElement SSR/SSG preserves the third-party tag, attributes, children, and
slots. The browser upgrades the element after the library registers its custom
element class.

Declarative shadow DOM for third-party components is not automatic. It is only
part of the contract when the third-party library itself supports server-side
shadow rendering. Otherwise, light-DOM/client-upgrade fallback is expected.

## Properties And Events

- Primitive configuration should use attributes where the third-party component
  supports them.
- Boolean attributes serialize as standard boolean attributes.
- Complex object/array properties should use a `ref`, a small local wrapper, or
  the library's own setup API.
- Common DOM events use JSX-style names such as `onClick`.
- Dashed CustomEvent names use dashed props, such as `on-sl-change` for
  Shoelace's `sl-change`.

## Library Evidence

The alpha.3 smoke fixture verifies:

- Lit custom elements upgrade in an openElement page, render slots, and dispatch
  composed custom events.
- Shoelace components install, render, upgrade, and dispatch `sl-*` events.
- Material Web Components install, render, and upgrade inside the same app.
- openElement can contain a Lit element, and a Lit element can contain an
  openElement custom element.
