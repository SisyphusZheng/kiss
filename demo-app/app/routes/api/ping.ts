/**
 * KISS API route: serverless ping endpoint.
 * Default-export a Hono sub-app. Framework mounts it at /api/ping.
 */
import { Hono } from 'hono';

const app = new Hono();

app.get('/', (c) => {
  return c.json({
    ok: true,
    framework: 'KISS',
    version: '0.3.4',
    jamstack: true,
    serverless: true,
    timestamp: new Date().toISOString(),
  });
});

app.get('/hello/:name', (c) => {
  const name = c.req.param('name');
  return c.json({ message: `Hello, ${name}!` });
});

export default app;
