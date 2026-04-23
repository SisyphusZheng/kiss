/**
 * Server entry point for production build.
 * In dev mode, Vite handles this automatically.
 */
import { Hono } from 'hono'

const app = new Hono()

// Health check
app.get('/health', (c) => c.json({ status: 'ok' }))

export default app
