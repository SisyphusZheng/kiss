# Using openElement Components in Fresh

A guide to consuming [openElement](https://github.com/open-element/openelement) custom elements inside a [Deno Fresh](https://fresh.deno.dev) application.

## Quick Start

See the working example at `examples/open-element-in-fresh/`.

## Setup `deno.json`

Add openElement packages as npm imports alongside Preact:

```json
{
  "imports": {
    "$fresh/": "https://deno.land/x/fresh@1.7.3/",
    "preact": "https://esm.sh/preact@10.22.0",
    "preact/": "https://esm.sh/preact@10.22.0/",
    "@openelement/ui": "npm:@openelement/ui@^0.41.0",
    "@openelement/core/hydrate": "npm:@openelement/core@^0.41.0/hydrate"
  }
}
```

## Rendering openElement Tags in Routes

Use custom element tags directly in your Fresh route JSX. No wrapper components needed:

```tsx
// routes/index.tsx
export default function Home() {
  return (
    <main>
      <open-button variant='primary'>Click Me</open-button>
      <open-card>
        <h3 slot='header'>Title</h3>
        <p>Card content</p>
      </open-card>
    </main>
  );
}
```

Augment Preact's JSX types so TypeScript accepts the tags:

```tsx
declare module 'preact' {
  namespace JSX {
    interface IntrinsicElements {
      'open-button': preact.JSX.HTMLAttributes<HTMLElement> & {
        variant?: string;
        size?: string;
      };
      'open-card': preact.JSX.HTMLAttributes<HTMLElement> & {
        variant?: string;
      };
    }
  }
}
```

## The Boot Island

Create a Fresh island that registers openElement components and hydrates them:

```tsx
// islands/OpenElements.tsx
import { useEffect } from 'preact/hooks';

export default function OpenElementsIsland() {
  useEffect(() => {
    let dispose: (() => void) | undefined;
    let unmounted = false;

    Promise.all([
      import('@openelement/ui'),
      import('@openelement/core/hydrate'),
    ]).then(([_, { hydrateOpenElement }]) => {
      if (unmounted) return;
      dispose = hydrateOpenElement(document.body);
    });

    return () => {
      unmounted = true;
      dispose?.();
    };
  }, []);

  return null;
}
```

## How `hydrateOpenElement` Works

`hydrateOpenElement` scans the DOM for declarative shadow DOM (DSD) templates created by openElement SSR. For each matching custom element:

1. It looks up the constructor in `customElements.registry`.
2. It attaches the existing DSD shadow root content.
3. It hydrates `data-signal-*` markers using the element's `HydrationScope`.
4. It binds event markers (`data-eid`) to the element's event handlers.
5. It returns a dispose function that cleans up all subscriptions.

## Limitations

- **JSX transform**: openElement JSX transform must be configured at build time for the component package. At consumption time in Fresh, you use Preact's JSX transform and pass-through custom element tags as standard HTML.
- **Registration timing**: `customElements.define` must happen on the client, not during SSR. The boot island pattern above handles this correctly via dynamic `import()` inside `useEffect`.
- **Router disposal**: When navigating away, Fresh unmounts islands but does not call `hydrateOpenElement`'s dispose automatically. The boot island stores the returned dispose function and calls it from the effect cleanup; SPAs with custom client-side routing should follow the same pattern.
- **Signal interop**: openElement signals (`@openelement/signal`) and Preact signals (`@preact/signals`) are separate systems. Each manages its own reactivity independently.

## Reference

- Example project: `examples/open-element-in-fresh/`
- Client runtime: `@openelement/core/hydrate`
- Component library: `@openelement/ui`
