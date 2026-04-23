# Routing Guide

KISS uses **file-based routing**. Create a file in `app/routes/`, and it becomes a route.

---

## Basic Routes

| File | Route |
|------|-------|
| `app/routes/index.ts` | `/` |
| `app/routes/about.ts` | `/about` |
| `app/routes/contact.ts` | `/contact` |

---

## Dynamic Routes

Use square brackets for dynamic segments:

| File | Route | Params |
|------|--------|--------|
| `app/routes/posts/[slug].ts` | `/posts/:slug` | `slug` |
| `app/routes/users/[id].ts` | `/users/:id` | `id` |

Access params in your component:

```typescript
// app/routes/posts/[slug].ts
import { LitElement, html } from 'lit'

export class PostPage extends LitElement {
  static properties = {
    slug: { type: String },
  }

  constructor() {
    super()
    this.slug = ''
  }

  render() {
    return html`
      <h1>Post: ${this.slug}</h1>
    `
  }
}

customElements.define('post-page', PostPage)
```

---

## Nested Routes

Create folders to nest routes:

```
app/routes/
├── index.ts           # /
├── about.ts           # /about
└── blog/
    ├── index.ts      # /blog
    └── [slug].ts     # /blog/:slug
```

---

## Layout (Renderer)

Create `_renderer.ts` to add a shared layout:

```typescript
// app/routes/_renderer.ts
import { LitElement, html } from 'lit'

export class Renderer extends LitElement {
  render() {
    return html`
      <header><!-- shared header --></header>
      <main>
        <slot></slot>  <!-- page content renders here -->
      </main>
      <footer><!-- shared footer --></footer>
    `
  }
}

customElements.define('app-renderer', Renderer)
```

All pages in this folder will be wrapped with the renderer.

---

## Middleware

Create `_middleware.ts` to run code before/after a route:

```typescript
// app/routes/api/_middleware.ts
import { Hono } from 'hono'
import { logger } from 'hono/logger'

export const middleware = new Hono()
  .use('*', logger())
  .use('*', async (c, next) => {
    // Check auth, etc.
    await next()
  })
```

---

## API Routes

Create files in `app/routes/api/` to build API endpoints:

```typescript
// app/routes/api/posts.ts
import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => {
  return c.json([
    { id: 1, title: 'Hello' }
  ])
})

app.post('/', async (c) => {
  const body = await c.req.json()
  return c.json({ ok: true, body }, 201)
})

export default app
```

This creates:
- `GET /api/posts`
- `POST /api/posts`

---

## Route Priority

When multiple routes match, KISS uses this priority:

1. Static routes (`/about`)
2. Dynamic routes (`/posts/:slug`)
3. Index routes (`/posts` → `posts/index.ts`)

---

## Type-Safe API Calls

Use Hono RPC for type-safe API calls:

```typescript
// client-side (in an Island)
import { hc } from 'hono/client'
import type { AppType } from '../../server'

const client = hc<AppType>('/')

// Fully typed!
const posts = await client.api.posts.$get()
```

See [API Routes Guide](./api-routes.md) for more details.

---

## Tips

### 1. Check generated routes

KISS generates a virtual module `virtual:kiss-routes`. Check it in dev tools.

### 2. Nested params

```typescript
// app/routes/posts/[slug]/comments/[id].ts
// → /posts/:slug/comments/:id
```

### 3. Optional params

```typescript
// app/routes/posts/[[slug]].ts
// → /posts AND /posts/:slug
```

---

## Next Steps

- [Islands Guide](./islands.md) - Add interactivity
- [API Routes](./api-routes.md) - Build backend endpoints
- [Deployment](./deployment.md) - Deploy to production
