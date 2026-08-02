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
import { existsSync } from 'node:fs';
import { basename, join } from 'node:path';
import process from 'node:process';
import { DEFAULT_OUT_DIR } from '../internal/paths.ts';
import {
  importRequestTimeServer,
  isMalformedUrlError,
  type RequestTimeServerModule,
  tryStatic,
} from '../internal/static-serve.ts';

const root = process.cwd();
const distDir = join(root, DEFAULT_OUT_DIR);
const serverEntry = join(distDir, 'server', 'index.js');
const port = Number(process.env.OPEN_ELEMENT_PORT || process.env.PORT || 4173);
const hostname = process.env.OPEN_ELEMENT_HOST || '0.0.0.0';

async function main(): Promise<void> {
  if (!existsSync(distDir)) {
    console.error(
      '[openElement start] dist/ not found. Run `deno task build` first.',
    );
    process.exit(1);
  }

  let serverMod: RequestTimeServerModule | null = null;
  if (existsSync(serverEntry)) {
    serverMod = await importRequestTimeServer(serverEntry);
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
  serverMod: RequestTimeServerModule | null,
): Promise<Response> {
  const url = new URL(request.url);

  // #823: matchRequestTimeRoute decodes params internally, so a malformed
  // percent-encoded pathname (/%zz) throws URIError here — outside the
  // handler try/catch. That is a client error, not a server crash.
  if (serverMod?.default) {
    let match:
      | ReturnType<NonNullable<RequestTimeServerModule['matchRequestTimeRoute']>>
      | undefined;
    try {
      match = serverMod.matchRequestTimeRoute?.(url.pathname);
    } catch (err) {
      if (isMalformedUrlError(err)) {
        return new Response('Bad Request', { status: 400 });
      }
      throw err;
    }
    const isMutating = request.method !== 'GET' && request.method !== 'HEAD';
    if (match || isMutating) {
      try {
        return await serverMod.default({ request });
      } catch (err) {
        console.error('[openElement start] request-time handler error:', err);
        return new Response('Internal Server Error', { status: 500 });
      }
    }
  }

  const staticResponse = tryStatic(distDir, url.pathname);
  if (staticResponse) return staticResponse;

  if (serverMod?.default) {
    try {
      return await serverMod.default({ request });
    } catch (err) {
      console.error('[openElement start] request-time handler error:', err);
      return new Response('Internal Server Error', { status: 500 });
    }
  }

  return new Response('Not Found', { status: 404 });
}

// Cross-runtime entry detection (#622): Deno uses import.meta.main,
// Node/Bun execute the module directly when invoked as CLI — match the
// real entry filename instead of a substring heuristic.
const isMainModule = typeof (import.meta as { main?: boolean }).main === 'boolean'
  ? (import.meta as { main?: boolean }).main === true
  : ['start.ts', 'start.js', 'start.mjs', 'start.cjs'].includes(basename(process.argv[1] ?? ''));

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
