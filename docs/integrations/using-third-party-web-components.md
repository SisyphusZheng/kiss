# Using Third-Party Web Components

alpha.5 validates direct consumption of mature Web Components libraries inside
OpenElement apps. The primary evidence targets are Lit, Shoelace, Material Web
Components, and browser-only custom element modules exercised by
`tools/third-party-wc-smoke.ts`.

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

Load the third-party library according to its SSR contract:

- SSR-safe modules can be imported from route modules when they do not touch
  `window`, `document`, `HTMLElement`, `customElements`, layout APIs, or browser
  storage at module evaluation time.
- Browser-only registration modules must be imported from client-only code or an
  island activation path.
- Route modules should render standards-compliant light DOM so SSG can preserve
  useful markup before the browser upgrades the custom element.

## SSR Behavior

openElement SSR/SSG preserves the third-party tag, attributes, children, and
slots. The browser upgrades the element after the library registers its custom
element class.

Declarative shadow DOM for third-party components is not automatic. It is only
part of the contract when the third-party library itself supports server-side
shadow rendering. Otherwise, light-DOM/client-upgrade fallback is expected.

## SSR-Safe Imports

Use this pattern when a library is safe to evaluate in Deno during SSG:

```tsx
/** @jsxImportSource @openelement/core */
import '@safe-wc/library/register.js';

export default function AccountCard() {
  return (
    <safe-account-card variant='compact'>
      <span slot='title'>Ada Lovelace</span>
    </safe-account-card>
  );
}
```

The route may import the registration module directly only if the package's
entry point avoids browser-only globals during module evaluation. If that is not
true, keep the tag markup in the route and move registration to the client.

## Client-Only Imports

Use this pattern for packages that require browser globals while importing:

```tsx
/** @jsxImportSource @openelement/core */

export default function SettingsRoute() {
  return (
    <section>
      <browser-only-picker value='system'>
        Theme
      </browser-only-picker>
      <script type='module' src='/client/register-browser-only-picker.js' />
    </section>
  );
}
```

```ts
// /client/register-browser-only-picker.js
if (typeof window !== 'undefined' && !customElements.get('browser-only-picker')) {
  await import('browser-only-picker/register.js');
}
```

For reusable app code, prefer a small island or client entry module over inline
scripts. The important boundary is the same: SSG renders the tag and light DOM;
the browser imports the registration module after page load.

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

The alpha.5 smoke fixture verifies:

- Lit custom elements upgrade in an openElement page, render slots, and dispatch
  composed custom events.
- Shoelace components install, render, upgrade, and dispatch `sl-*` events.
- Material Web Components install, render, and upgrade inside the same app.
- openElement can contain a Lit element, and a Lit element can contain an
  openElement custom element.
- Browser-only custom element registration can be kept out of the SSG path.

Run the fixture with:

```sh
deno task third-party-wc:smoke
```

The fixture source lives under `tools/third-party-wc-smoke/` and is copied into a
fresh generated OpenElement app during the smoke run.
