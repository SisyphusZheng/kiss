# First-Party Stack Contract

The v0.41 beta workspace has five packages. Framework concepts are exposed by
deep product interfaces; implementation contracts stay inside their owner.

| Package                     | Responsibility                                                                 |
| --------------------------- | ------------------------------------------------------------------------------ |
| `@openelement/element`      | JSX, Custom Elements, DSD, hydration, signals and component runtime contracts  |
| `@openelement/app`          | Pages, routes, loaders, actions, islands and normalized request semantics      |
| `@openelement/adapter-vite` | Vite, content, SSG, generated data, Hono and Nitro build/deploy implementation |
| `@openelement/create`       | Version-coherent starter generation and consumer lifecycle                     |
| `@openelement/ui`           | Optional, reusable and dogfood-proven Web Component primitives                 |

## Official implementation

- Vite is the single supported development and build implementation.
- Hono provides the generated request application.
- Nitro provides verified Node and Workers deployment output.
- Preact Signals Core is internal to the Element signal implementation.
- Deno Desktop Reader and Mastodon are dogfood targets, not product packages.

One App descriptor drives route, render, build and deploy semantics. `buildApp()`
owns build invocation; consumers do not coordinate plugin phases. Runtime
contracts needed by apps and adapters are exported from Element or App, while
content, scanning, SSG and deployment contracts remain Adapter internals unless
independent adapters demonstrate a real replacement seam.

## Boundary rules

- Application and starter sources use product imports only.
- Alpha implementation packages and internal subpaths have no compatibility
  promise and must not reappear in generated artifacts.
- Nitro and Hono must normalize request path, method, params, environment and
  platform consistently.
- Third-party Web Components use explicit manifest/CEM admission; unknown SSR
  capability becomes client-only or rejected rather than a partial render.
- Browser candidates must pass Chromium, Firefox and WebKit with native DSD.
- External adopter pilot #390 remains the only repository-external beta.4
  condition.

See [PACKAGE_SURFACE.md](./PACKAGE_SURFACE.md) for the exact export inventory.
