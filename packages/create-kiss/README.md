# @kissjs/create

Minimal project scaffold for the KISS framework.

```bash
deno run -A jsr:@kissjs/create my-app
cd my-app
deno task dev
```

## What it creates

```
my-app/
├── deno.json              # Dev/build tasks
├── vite.config.ts         # KISS plugin config (with @kissjs/ui)
├── app/
│   ├── routes/
│   │   └── index.ts       # Home page (LitElement)
│   └── islands/
│       └── my-counter.ts  # Interactive island
```

## Generated config

The template includes:

- **`packageIslands: ['@kissjs/ui']`** — pre-built UI components from JSR
- **`ssr: { noExternal: ['@kissjs/ui'] }`** — ensures decorators are compiled
- A home page with an embedded counter island

## Build pipeline

```bash
deno task dev        # Dev server with HMR
deno task build      # Production build (SSR + client + SSG)
```

## Adding more islands

Create a file in `app/islands/`:

```ts
import { html, LitElement } from '@kissjs/core';

export const tagName = 'my-greeting';

export default class MyGreeting extends LitElement {
  static override properties = { name: { type: String } };
  name = 'World';

  override render() {
    return html`<p>Hello, ${this.name}!</p>`;
  }
}
```

Use it in any page route:

```ts
render() {
  return html`<my-greeting name="KISS"></my-greeting>`;
}
```

## Adding API routes

Create a file in `app/routes/api/`:

```ts
import { Hono } from '@kissjs/core';

const app = new Hono();
app.get('/', (c) => c.json({ message: 'Hello from KISS API!' }));

export default app;
```
