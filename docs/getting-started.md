# Getting Started

Get started with KISS framework in 5 minutes.

## What is KISS?

KISS = **K**eep **I**t **S**imple, **S**tupid

A minimal full-stack framework built on Web Standards:
- **HTTP**: Hono (Fetch API)
- **UI**: Lit (Web Components)
- **Build**: Vite (ESM)

No new abstractions. Just connect existing standards.

---

## Quick Start

### 1. Create a project

```bash
mkdir my-app && cd my-app
```

### 2. Initialize Deno

```bash
deno init
```

### 3. Install dependencies

```bash
deno add @kiss/core lit hono
```

### 4. Configure Vite

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import { kiss } from '@kiss/core'

export default defineConfig({
  plugins: [
    kiss({
      routesDir: 'app/routes',
      islandsDir: 'app/islands',
    })
  ]
})
```

### 5. Create your first page

```typescript
// app/routes/index.ts
import { LitElement, html, css } from 'lit'

export class HomePage extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: 2rem;
    }
  `

  render() {
    return html`
      <h1>Hello KISS!</h1>
      <p>This page is server-rendered. Zero JS by default.</p>
    `
  }
}

customElements.define('home-page', HomePage)
```

### 6. Start development server

```bash
deno run -A npm:vite
```

Open <INTERNAL_HOST_REDACTED> to see your page!

---

## Project Structure

```
my-app/
├── app/
│   ├── routes/          # File-based routing
│   │   ├── index.ts     # → /
│   │   ├── about.ts     # → /about
│   │   └── posts/
│   │       └── [slug].ts  # → /posts/:slug
│   ├── islands/         # Interactive components (Islands)
│   │   └── counter.ts
│   └── components/      # Shared components
│       └── header.ts
├── server.ts             # Server entry (Hono)
├── vite.config.ts       # KISS plugin config
└── deno.json            # Deno config
```

---

## Core Concepts

### 1. File-based Routing

| File | Route |
|------|-------|
| `app/routes/index.ts` | `/` |
| `app/routes/about.ts` | `/about` |
| `app/routes/posts/[slug].ts` | `/posts/:slug` |
| `app/routes/api/posts.ts` | `/api/posts` (API route) |

### 2. Server-Side Rendering (SSR)

All pages are rendered on the server. The browser receives:
- **Full HTML** (with Declarative Shadow DOM)
- **Zero JS by default** (progressive enhancement)

### 3. Islands Architecture

Only interactive components load JavaScript:

```typescript
// app/islands/counter.ts → This component will be hydrated
import { LitElement, html } from 'lit'

export class Counter extends LitElement {
  static properties = {
    count: { type: Number }
  }

  constructor() {
    super()
    this.count = 0
  }

  render() {
    return html`
      <button @click=${() => this.count++}>
        Count: ${this.count}
      </button>
    `
  }
}

customElements.define('my-counter', Counter)
```

Usage in a route:
```typescript
// app/routes/index.ts
render() {
  return html`
    <h1>Home</h1>
    <my-counter></my-counter>  <!-- This gets hydrated -->
  `
}
```

### 4. Progressive Enhancement Levels

| Level | Content | JS Size |
|-------|---------|---------|
| 0 | Pure HTML + DSD | **0 KB** |
| 1 | HTML + minimal JS | **~2 KB** |
| 2 | Partial Islands | **~6 KB/island** |
| 3 | Full page hydration | User choice |
| 4 | SPA mode | User choice |

---

## Next Steps

- [Routing Guide](./routing.md) - Learn file-based routing
- [Islands Guide](./islands.md) - Add interactivity
- [API Routes](./api-routes.md) - Create backend endpoints
- [Deployment](./deployment.md) - Deploy to production

---

## Example Projects

- **minimal-blog** - `examples/minimal-blog/` (blog with theme toggle)
- **dashboard** - `examples/dashboard/` (coming soon)
- **todo-app** - `examples/todo-app/` (coming soon)
