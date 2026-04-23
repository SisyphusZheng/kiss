/**
 * Server entry for minimal-blog
 *
 * This file is the entry point for the SSR server.
 * Vite will load this file and execute the Hono app.
 */

import { Hono } from 'hono'
import { serveStatic } from 'hono/deno'

const app = new Hono()

// API routes can be added here
// app.get('/api/posts', (c) => c.json(posts))

// Serve static assets (client JS, CSS)
app.get('/*', serveStatic({ root: './dist/client' }))

export default app
