# Preact Islands

`@openelement/app/preact` is an **optional** island adapter. It lets you write
islands as Preact components and render them through the same OpenElement
SSG/hydration pipeline as native custom-element islands.

Use it only when you already have Preact components or a Preact-trained team.
For new OpenElement apps, prefer native custom elements via
`@openelement/element`; they require no extra adapter and are runtime-free after
hydration.

## When to choose Preact islands

| Use native custom elements (`@openelement/element`) | Use Preact islands (`@openelement/app/preact`) |
| --------------------------------------------------- | ---------------------------------------------- |
| Building a design system from scratch.              | Reusing an existing Preact component library.  |
| You want runtime-free islands after hydration.      | You need React-like hooks / ecosystem.         |
| You want the smallest possible client bundle.       | Team velocity favors Preact JSX patterns.      |

## Setup

Add the Preact packages to your project `deno.json` with **explicit subpath
entries** (not the `"preact/": "npm:preact@…/"` prefix form — Deno's resolver
cannot join npm: prefixes in standalone projects, #970):

```jsonc
{
  "imports": {
    "preact": "npm:preact@^10.28.0",
    "preact/hooks": "npm:preact@^10.28.0/hooks",
    "preact/jsx-runtime": "npm:preact@^10.28.0/jsx-runtime",
    "@preact/signals": "npm:@preact/signals@^2.9.0"
  }
}
```

Add further subpaths (`preact/debug`, …) the same way when you import them.

## Public API

```ts
// island.tsx
import { h } from 'preact';
import { useSignal } from '@preact/signals';

export default function Counter({ start = 0 }: { start?: number }) {
  const count = useSignal(start);
  return (
    <button onClick={() => count.value++}>
      Count: {count.value}
    </button>
  );
}
```

Place the file in `app/islands/counter.tsx` and reference it with the same
island metadata as a native island. The adapter-vite transform injects
`__island` / `__tagName` markers so the OpenElement hydration runtime can locate
and boot the island on the client.

## Render paths

1. **SSR**: `@openelement/app/preact` imports `preact-render-to-string` on the
   server without top-level await, so Nitro/CommonJS transforms can load the
   bridge before it emits static HTML into the page.
2. **Hydration**: the client bundle receives the Preact component and hydrates
   the server-rendered DOM nodes.
3. **Client-only islands**: an island can set `ssr={false}` in its metadata to
   render only in the browser.

## Build guarantee

The adapter-vite plugin `open:exclude-preact-rts` resolves
`preact-render-to-string` to an empty stub in the client bundle. SSR-only
dependencies never ship to the browser, even if a shared module imports them.

## Decision guide

- Prefer `@openelement/element` for long-lived design systems and public UI
  packages.
- Use `@openelement/app/preact` as a migration bridge or for apps that already
  depend on the Preact ecosystem.
- Do not mix the two in the same island file; choose one component model per
  island.
