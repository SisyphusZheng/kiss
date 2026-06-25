# openElement in Fresh — alpha.4 Interop Proof

A minimal [Fresh 2.3+](https://fresh.deno.dev) project that demonstrates
openElement custom elements (`<open-button>`, `<open-card>`) running inside a
Fresh app with Preact islands.

## What It Proves

1. **openElement custom elements in Fresh** — `<open-button>` and `<open-card>`
   are rendered as standard HTML custom element tags in the Fresh server-side
   route. No special JSX, no wrapper components needed.

2. **Third-party framework boot** — The `OpenElements.tsx` island imports
   `@openelement/ui` (which registers the custom elements via
   `customElements.define`) and calls `hydrateOpenElement(document.body)` to
   explicitly hydrate DSD content and bind event markers. This proves
   openElement can be bootstrapped and hydrated from within Preact islands.

3. **Bilateral interop** — The same page hosts both openElement custom elements
   and a Preact counter island (`PreactCounter.tsx`). Each owns its lifecycle
   independently. The Preact island uses `@preact/signals` for state; the
   openElement elements use their own shadow DOM and event system. No conflict.

## Quick Start

```bash
# From this directory
deno task dev
```

Then open http://localhost:8000.

## Structure

```
examples/open-element-in-fresh/
├── deno.json              # Fresh 2.3+ + openElement imports
├── vite.config.ts         # Vite dev server config (Fresh 2.x)
├── client.ts              # Client-side entry point (Fresh 2.x)
├── main.ts                # Server entry (Fresh 2.x App API)
├── routes/
│   └── index.tsx          # Main route rendering open-button + open-card + Preact island
├── islands/
│   ├── OpenElements.tsx   # Island: registers openElement components + hydrates
│   └── PreactCounter.tsx  # Island: Preact counter (proof of Preact island in openElement context)
└── components/
    └── PreactCounter.tsx   # Preact component used by PreactCounter island
```

## How It Works

1. **SSR** — Fresh renders the route (`routes/index.tsx`) on the server. Custom
   element tags like `<open-button>` and `<open-card>` are emitted as plain
   HTML. The `<PreactCounter>` island is serialized as an interactive island
   marker (Fresh handles this automatically).

2. **Client Hydration** — When the page loads in the browser:
   - `OpenElements.tsx` island activates → imports `@openelement/ui` →
     `customElements.define` registers `<open-button>` and `<open-card>` →
     `hydrateOpenElement()` iterates the DOM and triggers upgrade + hydration.
   - `PreactCounter.tsx` island activates → Preact mounts the counter component
     independently.

3. **Interop Guarantee** — openElement custom elements are standard Web
   Components. They use shadow DOM, `customElements.define`, and native DOM
   APIs. Fresh/Preact islands are standard Preact components hydrated via
   Fresh's island hydration. The two systems share the DOM but not state or
   lifecycle.

## Migration Notes (Fresh 1.x → 2.x)

- `dev.ts` → replaced by `vite.config.ts` with `@fresh/plugin-vite`
- `fresh.config.ts` → removed; config in `main.ts` via `new App()`
- `fresh.gen.ts` → removed; manifest no longer needed
- `client.ts` → new required file for client-side entry
- `$fresh/` imports → `fresh` (via `jsr:@fresh/core`)
- Tasks: `vite` / `vite build` / `deno serve -A _fresh/server.js`
