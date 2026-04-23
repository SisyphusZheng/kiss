import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

const app = new Hono()

// GET /api/hello
app.get('/', (c) => {
  return c.json({
    data: {
      message: 'Hello from KISS API!',
      framework: 'Hono + Vite + Lit',
      version: '0.1.0',
    },
  })
})

// POST /api/hello
const EchoSchema = z.object({
  name: z.string().min(1).max(100),
})

app.post('/', zValidator('json', EchoSchema), (c) => {
  const { name } = c.req.valid('json')
  return c.json({
    data: {
      message: `Hello, ${name}!`,
    },
  }, 201)
})

export default app
