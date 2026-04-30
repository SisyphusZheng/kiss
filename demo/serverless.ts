/**
 * KISS serverless API entry — standalone deployable to Deno Deploy.
 *
 * Routes:
 *   GET /api     → health + version
 *   GET /api/hello/:name → Hello {name}
 *   GET /health  → uptime
 */
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import apiApp from './app/routes/api/ping.ts';

const app = new Hono();

// CORS: allow the docs site to call this API from the browser
app.use('/api/*', cors({ origin: ['https://kiss.js.org', 'https://kiss-demo-api.sisyphuszheng.deno.net'] }));

app.route('/api', apiApp);
app.get('/health', (c) => c.json({ ok: true }));

// Deno Deploy: default export for fetch handler
export default app;
