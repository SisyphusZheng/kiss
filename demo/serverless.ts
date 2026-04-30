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

// CORS: manual headers (avoids hono/cors middleware dependency)
app.use('/api/*', async (c, next) => {
  await next();
  c.res.headers.set('Access-Control-Allow-Origin', '*');
  c.res.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  c.res.headers.set('Access-Control-Allow-Headers', 'Content-Type');
});
app.options('/api/*', (c) => c.newResponse(null, 204));

app.route('/api', apiApp);
app.get('/health', (c) => c.json({ ok: true }));

// Deno Deploy: default export for fetch handler
export default app;
