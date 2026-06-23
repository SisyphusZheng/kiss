/**
 * Minimal static file server for openElement E2E tests.
 *
 * Serves `www/dist` with the conventions expected by the site:
 *   - exact files
 *   - `/path/` -> `/path/index.html`
 *   - `/path`  -> `/path.html` (pretty URL files at root)
 *   - otherwise falls back to `/index.html` for SPA routing
 *
 * Usage:
 *   deno run -A www/e2e/static-server.ts --port 4174 --dir www/dist
 */

const args = Object.fromEntries(
  Deno.args.reduce<string[]>((acc, arg, i, arr) => {
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const value = arr[i + 1] ?? '';
      acc.push(key, value);
    }
    return acc;
  }, [])
    .map((v, i, a) => (i % 2 === 0 ? [v, a[i + 1]] : null))
    .filter((pair): pair is [string, string] => pair !== null),
);

const PORT = Number(args.port ?? '4174');
const ROOT = args.dir ?? 'www/dist';

/** Try to find an available port starting from the requested one. */
function findPort(preferred: number, maxAttempts = 20): number {
  for (let port = preferred; port < preferred + maxAttempts; port++) {
    try {
      const listener = Deno.listen({ port, hostname: '127.0.0.1' });
      listener.close();
      return port;
    } catch {
      // port in use, try next
    }
  }
  return preferred;
}

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
};

function contentType(path: string): string {
  const ext = path.slice(path.lastIndexOf('.')).toLowerCase();
  return CONTENT_TYPES[ext] ?? 'application/octet-stream';
}

function safePath(urlPath: string): string | null {
  const decoded = decodeURIComponent(urlPath);
  if (decoded.includes('..') || decoded.includes('\0')) return null;
  return decoded;
}

async function tryFile(path: string): Promise<Uint8Array | null> {
  try {
    return await Deno.readFile(path);
  } catch {
    return null;
  }
}

async function resolveBody(
  decodedPath: string,
): Promise<{ body: Uint8Array; path: string } | null> {
  const candidates: string[] = [];

  const base = decodedPath === '/' ? '' : decodedPath;
  candidates.push(`${ROOT}${decodedPath}`);
  if (decodedPath.endsWith('/')) {
    candidates.push(`${ROOT}${base}index.html`);
  } else {
    candidates.push(`${ROOT}${base}/index.html`);
    candidates.push(`${ROOT}${base}.html`);
  }
  // SPA fallback for client-side routes (e.g. /ui).
  candidates.push(`${ROOT}/index.html`);

  for (const candidate of candidates) {
    const body = await tryFile(candidate);
    if (body) return { body, path: candidate };
  }
  return null;
}

const actualPort = findPort(PORT);

Deno.serve({ port: actualPort, hostname: '127.0.0.1' }, async (request) => {
  const url = new URL(request.url);
  const decoded = safePath(url.pathname);
  if (!decoded) {
    return new Response('Forbidden', { status: 403 });
  }

  const resolved = await resolveBody(decoded);
  if (!resolved) {
    return new Response('Not found', { status: 404 });
  }

  return new Response(resolved.body, {
    status: 200,
    headers: { 'Content-Type': contentType(resolved.path) },
  });
});

console.log(`E2E static server listening on http://127.0.0.1:${actualPort}`);
