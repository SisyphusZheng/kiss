/**
 * openElement Mastodon Desktop — HTTP server.
 *
 * Serves the SPA client (built by Vite to dist/) and read-only Mastodon API
 * endpoints backed by fixtures. All handler errors are caught so the desktop
 * webview stays alive.
 */

import {
  fetchAccount,
  fetchAccountStatuses,
  fetchPublicTimeline,
  fetchStatus,
  fetchStatusContext,
} from './app/api.ts';

const DIST_DIR = new URL('./dist/', import.meta.url);

function readTextSafe(url: URL): string | null {
  try {
    return Deno.readTextFileSync(url);
  } catch {
    return null;
  }
}

async function readFileSafe(url: URL): Promise<Uint8Array<ArrayBuffer> | null> {
  try {
    return await Deno.readFile(url);
  } catch {
    return null;
  }
}

function html(body: string): Response {
  return new Response(body, { headers: { 'content-type': 'text/html' } });
}

function json(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    headers: { 'content-type': 'application/json' },
  });
}

function byteBody(bytes: Uint8Array<ArrayBuffer>): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

function serveFile(bytes: Uint8Array<ArrayBuffer>, ext: string): Response {
  const mime: Record<string, string> = {
    '.js': 'application/javascript',
    '.mjs': 'application/javascript',
    '.css': 'text/css',
    '.html': 'text/html',
    '.json': 'application/json',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
  };
  return new Response(byteBody(bytes), {
    headers: { 'content-type': mime[ext] ?? 'application/octet-stream' },
  });
}

function notFound(): Response {
  return new Response('Not Found', { status: 404 });
}

function serverError(): Response {
  return new Response('Internal Server Error', {
    status: 500,
    headers: { 'content-type': 'text/plain' },
  });
}

function methodNotAllowed(): Response {
  return new Response('Method Not Allowed', { status: 405 });
}

function closeApp(): Response {
  setTimeout(() => {
    void server?.shutdown().finally(() => Deno.exit(0));
  }, 25);
  return json({ closing: true });
}

const DEFAULT_INSTANCE = 'mastodon.social';

const PORT = Number(Deno.env.get('PORT') ?? 8000);

const server = Deno.serve({ port: PORT }, async (req: Request) => {
  try {
    const url = new URL(req.url);
    const pathname = url.pathname;
    const dotIndex = pathname.lastIndexOf('.');
    const ext = dotIndex > pathname.lastIndexOf('/') ? pathname.slice(dotIndex) : '';

    if (pathname === '/api/app/close') {
      if (req.method !== 'POST') return methodNotAllowed();
      return closeApp();
    }

    if (pathname === '/api/timeline') {
      const result = await fetchPublicTimeline({
        instance: url.searchParams.get('instance') ?? DEFAULT_INSTANCE,
        timeline: url.searchParams.get('local') === 'true' ? 'local' : 'public',
        maxId: url.searchParams.get('maxId') ?? undefined,
        sinceId: url.searchParams.get('sinceId') ?? undefined,
        limit: Number(url.searchParams.get('limit') ?? 20),
      });
      return result.ok ? json(result.data) : json(result.error);
    }

    const profileMatch = pathname.match(/^\/api\/profile\/([^/]+)$/);
    if (profileMatch) {
      const result = await fetchAccount({
        instance: url.searchParams.get('instance') ?? DEFAULT_INSTANCE,
        acct: decodeURIComponent(profileMatch[1]),
      });
      return result.ok ? json(result.data) : json(result.error);
    }

    const profileStatusesMatch = pathname.match(/^\/api\/profile\/([^/]+)\/statuses$/);
    if (profileStatusesMatch) {
      const result = await fetchAccountStatuses({
        instance: url.searchParams.get('instance') ?? DEFAULT_INSTANCE,
        acct: decodeURIComponent(profileStatusesMatch[1]),
      });
      return result.ok ? json(result.data) : json(result.error);
    }

    const statusMatch = pathname.match(/^\/api\/status\/([^/]+)$/);
    if (statusMatch) {
      const result = await fetchStatus({
        instance: url.searchParams.get('instance') ?? DEFAULT_INSTANCE,
        id: decodeURIComponent(statusMatch[1]),
      });
      return result.ok ? json(result.data) : json(result.error);
    }

    const statusContextMatch = pathname.match(/^\/api\/status\/([^/]+)\/context$/);
    if (statusContextMatch) {
      const result = await fetchStatusContext({
        instance: url.searchParams.get('instance') ?? DEFAULT_INSTANCE,
        id: decodeURIComponent(statusContextMatch[1]),
      });
      return result.ok ? json(result.data) : json(result.error);
    }

    // Static assets from dist/ (Vite build output)
    if (
      pathname.startsWith('/assets/') || pathname.startsWith('/islands/') ||
      pathname.startsWith('/client/') || pathname.startsWith('/app/')
    ) {
      const file = await readFileSafe(new URL(`.${pathname}`, DIST_DIR));
      if (!file) {
        const rootFile = await readFileSafe(new URL(`.${pathname}`, import.meta.url));
        return rootFile ? serveFile(rootFile, ext) : notFound();
      }
      return serveFile(file, ext);
    }

    // SPA fallback: serve dist/index.html for all other routes
    const indexHtml = readTextSafe(new URL('./index.html', DIST_DIR));
    if (indexHtml) return html(indexHtml);

    // Fallback: try project-root index.html (for dev mode)
    const rootIndex = readTextSafe(new URL('./index.html', import.meta.url));
    return rootIndex ? html(rootIndex) : serverError();
  } catch (err) {
    console.error('[mastodon] Handler error:', err);
    return serverError();
  }
});
