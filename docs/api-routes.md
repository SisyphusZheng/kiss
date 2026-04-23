# API Routes Guide

Create backend endpoints using **Hono** (the HTTP layer of KISS).

---

## Quick Start

### 1. Create an API route

```typescript
// app/routes/api/posts.ts
import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => {
  return c.json([
    { id: 1, title: 'Hello KISS' }
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

## HTTP Methods

```typescript
app.get('/', (c) => c.json({ method: 'GET' }))
app.post('/', (c) => c.json({ method: 'POST' }))
app.put('/:id', (c) => c.json({ method: 'PUT' }))
app.delete('/:id', (c) => c.json({ method: 'DELETE' }))
```

---

## Reading Request Data

### Params

```typescript
app.get('/users/:id', (c) => {
  const id = c.req.param('id')
  return c.json({ id })
})
```

### Query String

```typescript
app.get('/search', (c) => {
  const q = c.req.query('q')  // /search?q=hello
  return c.json({ q })
})
```

### JSON Body

```typescript
app.post('/users', async (c) => {
  const body = await c.req.json()
  return c.json({ body })
})
```

### Form Data

```typescript
app.post('/upload', async (c) => {
  const formData = await c.req.formData()
  const file = formData.get('file')
  return c.json({ filename: file.name })
})
```

---

## Response Helpers

```typescript
// JSON
c.json({ hello: 'world' })

// Text
c.text('Hello')

// HTML
c.html('<h1>Hello</h1>')

// Redirect
c.redirect('/home')

// Not Found
c.notFound()

// Throw error
c.throw(400, 'Bad Request')
```

---

## Type-Safe API Calls (RPC)

### Server: Export type

```typescript
// app/routes/api/posts.ts
import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => c.json([{ title: 'Hello' }]))

export type AppType = typeof app
```

### Client: Use `hc()` (Hono Client)

```typescript
// In an Island component
import { hc } from 'hono/client'
import type { AppType } from '../../app/routes/api/posts.ts'

const client = hc<AppType>('/')

// Fully typed!
const res = await client.api.posts.$get()
const posts = await res.json()  // TypeScript knows the type!
```

---

## Validation (Optional)

Use **Zod** for validation (optional, not required by KISS):

```typescript
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'

app.post(
  '/posts',
  zValidator('json', z.object({
    title: z.string(),
    content: z.string(),
  })),
  (c) => {
    const data = c.req.valid('json')
    return c.json({ ok: true, data })
  }
)
```

---

## Middleware

### Logger

```typescript
import { logger } from 'hono/logger'

app.use('*', logger())
```

### CORS

```typescript
import { cors } from 'hono/cors'

app.use('*', cors({
  origin: 'https://example.com',
}))
```

### Custom Middleware

```typescript
app.use('/api/*', async (c, next) => {
  const auth = c.req.header('Authorization')
  if (!auth) return c.text('Unauthorized', 401)
  await next()
})
```

---

## Error Handling

```typescript
// Global error handler
app.onError((err, c) => {
  console.error(err)
  return c.json({ error: 'Internal Server Error' }, 500)
})

// Not Found
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404)
})
```

---

## Best Practices

### 1. Keep API routes in `app/routes/api/`

```
app/routes/
├── api/
│   ├── posts.ts      # /api/posts
│   ├── users.ts      # /api/users
│   └── [...].ts     # Catch-all API routes
└── ...
```

### 2. Use TypeScript types

Export `AppType` from each API route for type-safe client calls.

### 3. Validate input

Use Zod (optional) to validate request data.

---

## Next Steps

- [Islands Guide](./islands.md) - Add interactivity
- [Deployment](./deployment.md) - Deploy to production
- Check `examples/minimal-blog/` for a working example

---

## Example: Full CRUD API

```typescript
// app/routes/api/posts.ts
import { Hono } from 'hono'

const app = new Hono()

// GET /api/posts
app.get('/', (c) => {
  return c.json([
    { id: 1, title: 'Post 1' },
    { id: 2, title: 'Post 2' },
  ])
})

// GET /api/posts/:id
app.get('/:id', (c) => {
  const id = c.req.param('id')
  return c.json({ id, title: `Post ${id}` })
})

// POST /api/posts
app.post('/', async (c) => {
  const body = await c.req.json()
  return c.json({ ok: true, body }, 201)
})

// PUT /api/posts/:id
app.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  return c.json({ ok: true, id, body })
})

// DELETE /api/posts/:id
app.delete('/:id', (c) => {
  const id = c.req.param('id')
  return c.json({ ok: true, deleted: id })
})

export default app
export type AppType = typeof app
```
