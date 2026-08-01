# Using openElement Components in Fresh

A guide to consuming [openElement](https://github.com/open-element/openelement) custom elements inside a [Deno Fresh](https://fresh.deno.dev) application.

The working example lives at `examples/open-element-in-fresh/` — a Fresh 2.3.3
project that renders `<open-button>` and `<open-card>` as standard HTML custom
element tags alongside a Preact counter island. Everything below is taken from
that example and can be reproduced with `deno task dev` inside it.

## Setup `deno.json`

Fresh 2.x is imported from JSR; Preact comes from npm:

```json
{
  "imports": {
    "@/": "./",
    "fresh": "jsr:@fresh/core@^2.3.3",
    "fresh/runtime": "jsr:@fresh/core@^2.3.3/runtime",
    "preact": "npm:preact@^10.29.1",
    "@preact/signals": "npm:@preact/signals@^2.9.0",
    "@fresh/plugin-vite": "jsr:@fresh/plugin-vite@^1.1.2",
    "vite": "npm:vite@^8.0.10"
  },
  "compilerOptions": {
    "jsx": "precompile",
    "jsxImportSource": "preact"
  }
}
```

Fresh 2.x also expects a Vite entry (`vite.config.ts`), a client entry
(`client.ts`), and a server entry using the `App` API (`main.ts`):

```ts
// main.ts
import { App, staticFiles } from 'fresh';

export const app = new App();

app.use(staticFiles());
app.fsRoutes();
```

The example's tasks are the Fresh 2.x defaults: `deno task dev` (Vite dev
server), `deno task build` (`vite build`), and `deno task start`
(`deno serve -A _fresh/server.js`).

## Rendering openElement Tags in Routes

Use custom element tags directly in your Fresh route JSX. No wrapper components needed:

```tsx
// routes/index.tsx
import OpenElements from '../islands/OpenElements.tsx';

export default function Home() {
  return (
    <main>
      <open-button variant='primary'>Click Me</open-button>
      <open-card>
        <h3 slot='header'>Title</h3>
        <p>Card content</p>
        <p slot='footer'>Footer</p>
      </open-card>
      <OpenElements />
    </main>
  );
}
```

Fresh renders these tags as plain HTML during SSR; the browser upgrades them
once their classes are registered on the client. One caveat: the example runs
through Vite, which strips types without checking them. A strict `deno check`
reports TS2339/TS2786 for the custom tags because Preact's
`JSX.IntrinsicElements` does not know them. If you want the route to
type-check, augment Preact's JSX types:

```tsx
declare module 'preact' {
  namespace JSX {
    interface IntrinsicElements {
      'open-button': preact.JSX.HTMLAttributes<HTMLElement> & {
        variant?: string;
        size?: string;
      };
      'open-card': preact.JSX.HTMLAttributes<HTMLElement>;
    }
  }
}
```

## The Boot Island

Registration must happen on the client, not during SSR. The example ships a
Fresh island that defines the custom element classes when it activates:

```tsx
// islands/OpenElements.tsx
function defineOpenButton() {
  if (customElements.get('open-button')) return;
  class OpenButton extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
    }
    connectedCallback() {
      if (this.shadowRoot!.childElementCount > 0) return;
      this.shadowRoot!.innerHTML = `
        <button part="control">
          <slot></slot>
        </button>
      `;
    }
  }
  customElements.define('open-button', OpenButton);
}

export default function OpenElementsIsland() {
  if (typeof window !== 'undefined') {
    defineOpenButton();
  }
  return null;
}
```

The island guards with `customElements.get` so re-activation never double-registers,
and the `connectedCallback` guard keeps disconnect/reconnect cycles from
re-rendering. The example's full island registers both `open-button` and
`open-card` the same way.

## How the Interop Works

1. **SSR** — Fresh renders the route on the server. Custom element tags are
   emitted as plain HTML; Preact islands are serialized as island markers.
2. **Client activation** — The `OpenElements` island activates, calls
   `customElements.define`, and the browser upgrades the tags already in the
   DOM. Preact islands (the example's `PreactCounter`, backed by
   `@preact/signals`) mount independently.
3. **Isolation** — openElement custom elements are standard Web Components
   (shadow DOM, `customElements.define`, native DOM APIs). They share the DOM
   with Preact islands but not state or lifecycle, so the two systems do not
   conflict.

## Known Limitation

The example's island registers **inline custom element stubs** instead of
importing `@openelement/ui`. Root cause: `deno pack` does not apply JSX
transformation when publishing `packages/ui` to npm — the output `.js` files
retain raw JSX that Vite cannot transpile. The `compilerOptions.jsx` config is
already in `packages/ui/deno.json`; the remaining blocker is the pack pipeline.

Consequences of the stub:

- The stub ignores `variant`, `size`, and `disabled` attributes — it renders a
  plain button regardless, while the real `open-button` styles per variant.
- There is no openElement hydration runtime in this integration. There is no
  published `@openelement/core/hydrate` entry; client behavior comes entirely
  from the registered custom element classes.

Once the pack pipeline ships pre-compiled JS, replace the stubs with
`import '@openelement/ui'` in the island.

## Limitations

- **JSX transform**: openElement's JSX transform applies when building an
  openElement component package. At consumption time in Fresh you use Preact's
  JSX transform and pass custom element tags through as standard HTML.
- **Registration timing**: `customElements.define` must run on the client, not
  during SSR. The boot island pattern above handles this by defining classes at
  island activation time.
- **Signal interop**: openElement signals and Preact signals (`@preact/signals`)
  are separate systems. Each manages its own reactivity independently.

## Reference

- Example project: `examples/open-element-in-fresh/`
- Example README (structure, Fresh 1.x → 2.x migration notes):
  `examples/open-element-in-fresh/README.md`
- Component library (once the pack gap is fixed): `@openelement/ui`
