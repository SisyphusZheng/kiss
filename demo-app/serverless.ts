/**
 * KISS serverless API entry — standalone deployable to Deno Deploy.
 *
 * Routes:
 *   GET /api     → health + version
 *   GET /api/hello/:name → Hello {name}
 *   GET /health  → uptime
 */
import { Hono } from 'hono';
import apiApp from './app/routes/api/ping.ts';

const app = new Hono();
app.route('/api', apiApp);
app.get('/health', (c) => c.json({ ok: true }));

// Deno Deploy: default export for fetch handler
export default app;
