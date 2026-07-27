/**
 * Request-time fixture server.
 *
 * Serves the built app:
 *   - static files from dist/ (exact file, /path -> /path/index.html, /path.html)
 *   - request-time routes (from dist/server/server-manifest.json) are delegated
 *     to the generated dist/server/index.js default export, which takes a
 *     nitro-like event ({ request }) and returns a Response.
 *
 * Usage:
 *   deno run -A server.ts --port 4180 --dir ../dist
 */

import { extname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const args: Record<string, string> = {};
for (let i = 0; i < Deno.args.length; i += 2) {
  if (Deno.args[i].startsWith('--')) args[Deno.args[i].slice(2)] = Deno.args[i + 1] ?? '';
}

const PORT = Number(args.port ?? '4180');
const ROOT = resolve(Deno.cwd(), args.dir ?? '../dist');

const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.woff2': 'font/woff2',
};

const manifest = JSON.parse(await Deno.readTextFile(join(ROOT, 'server/server-manifest.json')));
const requestTimePaths = new Set<string>(
  (manifest.requestTimeRoutes as Array<{ path: string }>).map((r) => r.path),
);

const serverEntry = await import(pathToFileURL(join(ROOT, 'server/index.js')).href);
const handleRequestTime = serverEntry.default as (
  event: { request: Request },
) => Promise<Response>;

async function serveStatic(pathname: string): Promise<Response | null> {
  const candidates = [pathname];
  if (pathname.endsWith('/')) {
    candidates.push(pathname + 'index.html');
  } else {
    candidates.push(pathname + '/index.html', pathname + '.html');
  }
  for (const candidate of candidates) {
    const filePath = join(ROOT, candidate);
    if (!resolve(filePath).startsWith(ROOT)) continue;
    try {
      const stat = await Deno.stat(filePath);
      if (!stat.isFile) continue;
      const body = await Deno.readFile(filePath);
      return new Response(body, {
        headers: { 'content-type': CONTENT_TYPES[extname(filePath)] ?? 'application/octet-stream' },
      });
    } catch {
      // try next candidate
    }
  }
  return null;
}

Deno.serve({ port: PORT, hostname: '127.0.0.1' }, async (request) => {
  const url = new URL(request.url);
  if (requestTimePaths.has(url.pathname)) {
    return await handleRequestTime({ request });
  }
  const staticResponse = await serveStatic(url.pathname);
  if (staticResponse) return staticResponse;
  return new Response('Not Found', { status: 404 });
});

console.log(`request-time fixture server -> http://127.0.0.1:${PORT} (root: ${ROOT})`);
