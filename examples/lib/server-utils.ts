/**
 * Shared HTTP helpers for the desktop examples (deno-desktop-mastodon and
 * deno-desktop-reader). Extracted so the two servers stop drifting; both
 * main.ts files import from here instead of keeping verbatim copies.
 */

export function readTextSafe(url: URL): string | null {
  try {
    return Deno.readTextFileSync(url);
  } catch {
    return null;
  }
}

export async function readFileSafe(url: URL): Promise<Uint8Array<ArrayBuffer> | null> {
  try {
    return await Deno.readFile(url);
  } catch {
    return null;
  }
}

export function html(body: string): Response {
  return new Response(body, { headers: { 'content-type': 'text/html' } });
}

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export function byteBody(bytes: Uint8Array<ArrayBuffer>): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

export function serveFile(bytes: Uint8Array<ArrayBuffer>, ext: string): Response {
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

export function notFound(): Response {
  return new Response('Not Found', { status: 404 });
}

export function serverError(): Response {
  return new Response('Internal Server Error', {
    status: 500,
    headers: { 'content-type': 'text/plain' },
  });
}

export function methodNotAllowed(): Response {
  return new Response('Method Not Allowed', { status: 405 });
}

export function closeApp(server: Deno.HttpServer): Response {
  setTimeout(() => {
    void server.shutdown().finally(() => Deno.exit(0));
  }, 25);
  return json({ closing: true });
}
