/**
 * @openelement/adapter-vite - Shared static-file + request-time server helpers.
 *
 * Single source for the MIME table, the static candidate rules, and the
 * generated request-time server module contract. These were previously
 * copy-pasted between cli/start.ts and the request-time fixture e2e server
 * and drifted (#732: start.ts lacked .xml/.ico/.mjs, the candidate rules
 * differed, and matchRequestTimeRoute was typed twice).
 *
 * Cross-runtime (#622): node:fs/node:path/node:url work under Node 18+,
 * Deno, and Bun, so both the Node CLI and the Deno fixture server can share
 * this module.
 */

import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const MIME: Record<string, string> = {
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
  '.xml': 'application/xml; charset=utf-8',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

/** Content-Type for a static file, by extension. */
export function contentTypeFor(filePath: string): string {
  return MIME[extname(filePath).toLowerCase()] || 'application/octet-stream';
}

/**
 * Candidate file paths (relative to the static root) for a request pathname:
 * the exact file, then `<path>/index.html`, then `<path>.html`.
 *
 * Throws URIError on malformed percent-encoding (e.g. `/%zz`) — callers
 * answer 400 (see tryStatic).
 */
export function staticFileCandidates(pathname: string): string[] {
  const decoded = decodeURIComponent(pathname.split('?')[0] || '/');
  const rel = decoded === '/' ? 'index.html' : decoded.replace(/^\/+/, '');
  const trimmed = rel.replace(/\/+$/, '');
  const candidates = [rel, `${trimmed}/index.html`];
  if (!rel.endsWith('/') && !rel.endsWith('.html')) candidates.push(`${rel}.html`);
  return [...new Set(candidates)];
}

/** True for URIError thrown by decodeURIComponent on malformed percent-encoding. */
export function isMalformedUrlError(err: unknown): boolean {
  return err instanceof URIError;
}

/**
 * Serve a static file from `distDir` for `pathname`, or null when no
 * candidate exists. Paths escaping the root are refused. A malformed
 * percent-encoded pathname is a client error, not a crash (#823): the
 * caller receives a 400 Bad Request response.
 */
export function tryStatic(distDir: string, pathname: string): Response | null {
  let candidates: string[];
  try {
    candidates = staticFileCandidates(pathname);
  } catch (err) {
    if (isMalformedUrlError(err)) {
      return new Response('Bad Request', { status: 400 });
    }
    throw err;
  }
  const root = resolve(distDir);
  for (const candidate of candidates) {
    const filePath = resolve(join(root, candidate));
    if (!filePath.startsWith(root + sep)) continue;
    if (!existsSync(filePath) || !statSync(filePath).isFile()) continue;
    const body = readFileSync(filePath);
    return new Response(body, {
      status: 200,
      headers: { 'content-type': contentTypeFor(filePath) },
    });
  }
  return null;
}

/** A request-time route hit: the route pattern path plus decoded params (#556). */
export type RequestTimeRouteMatch = { path: string; params: Record<string, string> };

/**
 * Contract of the generated dist/server/index.js entry (#556): the default
 * export takes a Nitro v3 event ({ req, env? }) and resolves to the
 * Response; the named matchRequestTimeRoute export maps a concrete pathname
 * ('/item/42') to a request-time route pattern ('/item/:id'), or null.
 */
export interface RequestTimeServerModule {
  default?: (event: { req: Request; env?: Record<string, string> }) => Promise<Response>;
  matchRequestTimeRoute?: (pathname: string) => RequestTimeRouteMatch | null;
}

/** Import the generated request-time server entry from an absolute file path. */
export function importRequestTimeServer(entryPath: string): Promise<RequestTimeServerModule> {
  return import(pathToFileURL(entryPath).href) as Promise<RequestTimeServerModule>;
}
