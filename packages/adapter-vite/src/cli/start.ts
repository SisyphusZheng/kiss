/**
 * @openelement/adapter-vite - CLI: start built app (static + request-time)
 *
 * #601: one-command path after `build` so dynamic routes are reachable
 * without tribal Nitro wiring.
 * #622: cross-runtime — works in Node 18+, Deno, and Bun via node:http.
 *
 * Usage:
 *   node packages/adapter-vite/src/cli/start.ts   (Node with --experimental-strip-types or tsx)
 *   deno run -A npm:@openelement/adapter-vite/cli/start
 *   OPEN_ELEMENT_PORT=4173 deno task start
 */

import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
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

  const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    const request = toWebRequest(req, hostname, port);
    const response = await handleRequest(request, serverMod);
    writeResponse(response, res);
  });

  server.listen(port, hostname, () => {
    console.log(
      `[openElement start] http://${hostname === '0.0.0.0' ? 'localhost' : hostname}:${port}`,
    );
  });
}

// ─── Cross-runtime HTTP helpers (#622) ─────────────────────────────

function toWebRequest(req: IncomingMessage, host: string, port: number): Request {
  const protocol = 'http';
  const url = new URL(
    req.url || '/',
    `${protocol}://${host === '0.0.0.0' ? 'localhost' : host}:${port}`,
  );
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value) headers.set(key, Array.isArray(value) ? value.join(', ') : value);
  }
  const method = req.method || 'GET';
  const hasBody = method !== 'GET' && method !== 'HEAD';
  return new Request(url.href, {
    method,
    headers,
    body: hasBody
      ? new ReadableStream({
        start(controller) {
          req.on('data', (chunk) => controller.enqueue(new Uint8Array(chunk)));
          req.on('end', () => controller.close());
          req.on('error', (err) => controller.error(err));
        },
      })
      : undefined,
    // @ts-expect-error Node 18 requires this for non-GET body
    duplex: hasBody ? 'half' : undefined,
  });
}

function writeResponse(response: Response, res: ServerResponse): void {
  res.statusCode = response.status;
  response.headers.forEach((value, key) => res.setHeader(key, value));
  if (!response.body) {
    res.end();
    return;
  }
  const reader = response.body.getReader();
  const pump = async () => {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        res.end();
        break;
      }
      res.write(value);
    }
  };
  pump().catch(() => res.end());
}

async function handleRequest(
  request: Request,
  serverMod: ServerModule | null,
): Promise<Response> {
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
}

// Cross-runtime entry detection (#622): Deno uses import.meta.main,
// Node/Bun execute the module directly when invoked as CLI.
const isMainModule = typeof (import.meta as { main?: boolean }).main === 'boolean'
  ? (import.meta as { main?: boolean }).main === true
  : process.argv[1]?.includes('start');

if (isMainModule) {
  try {
    await main();
  } catch (error) {
    console.error(
      `Start failed: ${error instanceof Error ? error.stack ?? error.message : String(error)}`,
    );
    process.exit(1);
  }
}
