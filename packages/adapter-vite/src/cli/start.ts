/**
 * @openelement/adapter-vite - CLI: start built app (static + request-time)
 *
 * #601: one-command path after `build` so dynamic routes are reachable
 * without tribal Nitro wiring.
 *
 * Usage:
 *   deno run -A npm:@openelement/adapter-vite/cli/start
 *   OPEN_ELEMENT_PORT=4173 deno task start
 */

import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import process from 'node:process';

const root = process.cwd();
const distDir = join(root, 'dist');
const serverEntry = join(distDir, 'server', 'index.js');
const port = Number(process.env.OPEN_ELEMENT_PORT || process.env.PORT || 4173);
const hostname = process.env.OPEN_ELEMENT_HOST || '0.0.0.0';

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

function contentType(filePath: string): string {
  return MIME[extname(filePath).toLowerCase()] || 'application/octet-stream';
}

function tryStatic(pathname: string): Response | null {
  const decoded = decodeURIComponent(pathname.split('?')[0] || '/');
  const rel = decoded === '/' ? 'index.html' : decoded.replace(/^\//, '');
  const candidates = [
    join(distDir, rel),
    join(distDir, rel, 'index.html'),
    rel.endsWith('.html') ? null : join(distDir, `${rel}.html`),
  ].filter((p): p is string => p != null);

  for (const filePath of candidates) {
    if (!filePath.startsWith(distDir)) continue;
    if (!existsSync(filePath) || !statSync(filePath).isFile()) continue;
    const body = readFileSync(filePath);
    return new Response(body, {
      status: 200,
      headers: { 'content-type': contentType(filePath) },
    });
  }
  return null;
}

type ServerModule = {
  default?: (event: { request: Request }) => Promise<{ response: Response }>;
  matchRequestTimeRoute?: (pathname: string) => unknown;
};

async function main(): Promise<void> {
  if (!existsSync(distDir)) {
    console.error(
      '[openElement start] dist/ not found. Run `deno task build` first.',
    );
    process.exit(1);
  }

  let serverMod: ServerModule | null = null;
  if (existsSync(serverEntry)) {
    serverMod = await import(pathToFileURL(serverEntry).href) as ServerModule;
    if (typeof serverMod.default !== 'function') {
      console.error(
        '[openElement start] dist/server/index.js has no default export.',
      );
      process.exit(1);
    }
    console.log(
      '[openElement start] request-time server entry loaded (dynamic routes enabled)',
    );
  } else {
    console.log(
      '[openElement start] no dist/server — static-only preview',
    );
  }

  Deno.serve({ port, hostname }, async (request) => {
    const url = new URL(request.url);

    if (serverMod?.default) {
      const match = serverMod.matchRequestTimeRoute?.(url.pathname);
      const isMutating = request.method !== 'GET' && request.method !== 'HEAD';
      if (match || isMutating) {
        try {
          const result = await serverMod.default({ request });
          return result.response;
        } catch (err) {
          console.error('[openElement start] request-time handler error:', err);
          return new Response('Internal Server Error', { status: 500 });
        }
      }
    }

    const staticResponse = tryStatic(url.pathname);
    if (staticResponse) return staticResponse;

    if (serverMod?.default) {
      try {
        const result = await serverMod.default({ request });
        return result.response;
      } catch (err) {
        console.error('[openElement start] request-time handler error:', err);
        return new Response('Internal Server Error', { status: 500 });
      }
    }

    return new Response('Not Found', { status: 404 });
  });

  console.log(
    `[openElement start] http://${hostname === '0.0.0.0' ? 'localhost' : hostname}:${port}`,
  );
}

if (import.meta.main) {
  try {
    await main();
  } catch (error) {
    console.error(
      `Start failed: ${error instanceof Error ? error.stack ?? error.message : String(error)}`,
    );
    process.exit(1);
  }
}
