/**
 * openElement Desktop Reader — HTTP server.
 *
 * Serves the SPA client (built by Vite to dist/), API endpoints, and PDF files.
 * All handler errors are caught to avoid breaking the desktop webview.
 */

import {
  addNote,
  addSource,
  deleteNote,
  exportNotesMarkdown,
  getBook,
  getProgress,
  listBooks,
  listNotes,
  listSources,
  type ReaderStorePaths,
  saveProgress,
  searchLibrary,
  syncSource,
} from './app/host-store.ts';

// Cache paths
const HOME = Deno.env.get('HOME') ?? '.';
const CACHE_DIR = `${HOME}/.open-reader`;
const BOOKS_DIR = `${CACHE_DIR}/books`;
const FIXTURES_DIR = new URL('./fixtures/books/', import.meta.url).pathname;
const BOOKS_JSON_URL = new URL('./fixtures/books.json', import.meta.url);
const DIST_DIR = new URL('./dist/', import.meta.url);

const STORE_PATHS: ReaderStorePaths = {
  cacheDir: CACHE_DIR,
  booksDir: BOOKS_DIR,
  fixturesDir: FIXTURES_DIR,
  fixturesJson: BOOKS_JSON_URL,
};

function readTextSafe(url: URL): string | null {
  try {
    return Deno.readTextFileSync(url);
  } catch {
    return null;
  }
}

function readFileSafe(url: URL): Uint8Array<ArrayBuffer> | null {
  try {
    return Deno.readFileSync(url);
  } catch {
    return null;
  }
}

function statSafe(path: string): boolean {
  try {
    Deno.statSync(path);
    return true;
  } catch {
    return false;
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
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  );
}

function pdf(bytes: Uint8Array<ArrayBuffer>): Response {
  return new Response(byteBody(bytes), {
    headers: { 'content-type': 'application/pdf' },
  });
}

function serveFile(bytes: Uint8Array<ArrayBuffer>, ext: string): Response {
  const mime: Record<string, string> = {
    '.js': 'application/javascript',
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

/** Find the main app JS bundle in dist/assets/ (pick largest reader-*.js). */
function findAppScript(dir: URL): string | null {
  try {
    let best: string | null = null;
    let bestSize = 0;
    for (const entry of Deno.readDirSync(dir)) {
      if (
        entry.isFile && entry.name.startsWith('reader-') &&
        entry.name.endsWith('.js')
      ) {
        const info = Deno.statSync(new URL(`./${entry.name}`, dir));
        if (info.size > bestSize) {
          bestSize = info.size;
          best = entry.name;
        }
      }
    }
    return best;
  } catch { /* dir may not exist */ }
  return null;
}

/** Find the main CSS bundle in dist/assets/. */
function findAppCss(dir: URL): string | null {
  try {
    for (const entry of Deno.readDirSync(dir)) {
      if (
        entry.isFile && entry.name.startsWith('style-') &&
        entry.name.endsWith('.css')
      ) {
        return entry.name;
      }
    }
  } catch { /* dir may not exist */ }
  return null;
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

async function readJsonRequest(req: Request): Promise<Record<string, unknown>> {
  try {
    return await req.json() as Record<string, unknown>;
  } catch {
    return {};
  }
}

function methodNotAllowed(): Response {
  return new Response('Method Not Allowed', { status: 405 });
}

Deno.serve(async (req: Request) => {
  try {
    const url = new URL(req.url);
    const pathname = url.pathname;
    const ext = pathname.slice(pathname.lastIndexOf('.'));

    // API: sources
    if (pathname === '/api/sources') {
      if (req.method === 'GET') return json(listSources(STORE_PATHS));
      if (req.method === 'POST') {
        return json(await addSource(STORE_PATHS, await readJsonRequest(req)));
      }
      return methodNotAllowed();
    }

    const syncMatch = pathname.match(/^\/api\/sources\/([^/]+)\/sync$/);
    if (syncMatch) {
      if (req.method !== 'POST') return methodNotAllowed();
      return json(
        await syncSource(STORE_PATHS, decodeURIComponent(syncMatch[1])),
      );
    }

    // API: books
    if (pathname === '/api/books') {
      return json(listBooks(STORE_PATHS));
    }

    const bookMatch = pathname.match(/^\/api\/books\/([^/]+)$/);
    if (bookMatch) {
      const book = getBook(STORE_PATHS, decodeURIComponent(bookMatch[1]));
      return book
        ? json({
          book,
          progress: getProgress(STORE_PATHS, book.id),
          notes: listNotes(STORE_PATHS, book.id),
        })
        : notFound();
    }

    const bookFileMatch = pathname.match(/^\/api\/books\/([^/]+)\/file$/);
    if (bookFileMatch) {
      const book = getBook(STORE_PATHS, decodeURIComponent(bookFileMatch[1]));
      if (!book) return notFound();
      try {
        return pdf(Deno.readFileSync(book.path));
      } catch {
        return notFound();
      }
    }

    const progressMatch = pathname.match(/^\/api\/books\/([^/]+)\/progress$/);
    if (progressMatch) {
      if (req.method !== 'POST') return methodNotAllowed();
      const body = await readJsonRequest(req);
      return json(saveProgress(STORE_PATHS, {
        bookId: decodeURIComponent(progressMatch[1]),
        page: Number(body.page ?? 1),
        zoom: Number(body.zoom ?? 1),
        updatedAt: new Date().toISOString(),
      }));
    }

    // API: search
    if (pathname === '/api/search') {
      const q = url.searchParams.get('q');
      if (!q) return json([]);
      return json(searchLibrary(STORE_PATHS, q));
    }

    // API: notes
    if (pathname === '/api/notes') {
      if (req.method === 'GET') {
        return json(
          listNotes(STORE_PATHS, url.searchParams.get('bookId') ?? undefined),
        );
      }
      if (req.method === 'POST') {
        const body = await readJsonRequest(req);
        return json(addNote(STORE_PATHS, {
          bookId: String(body.bookId ?? ''),
          page: body.page === undefined ? undefined : Number(body.page),
          quote: typeof body.quote === 'string' ? body.quote : undefined,
          text: String(body.text ?? ''),
        }));
      }
      return methodNotAllowed();
    }

    if (pathname === '/api/notes/export.md') {
      return new Response(exportNotesMarkdown(STORE_PATHS), {
        headers: { 'content-type': 'text/markdown; charset=utf-8' },
      });
    }

    const noteMatch = pathname.match(/^\/api\/notes\/([^/]+)$/);
    if (noteMatch) {
      if (req.method !== 'DELETE') return methodNotAllowed();
      deleteNote(STORE_PATHS, decodeURIComponent(noteMatch[1]));
      return json({ deleted: true });
    }

    // Legacy PDF files
    if (pathname.startsWith('/books/')) {
      const name = pathname.slice('/books/'.length);
      for (const dir of [BOOKS_DIR, FIXTURES_DIR]) {
        const p = `${dir}/${name}`;
        if (!statSafe(p)) continue;
        try {
          return pdf(Deno.readFileSync(p));
        } catch { /* try next */ }
      }
      return notFound();
    }

    // Static assets from dist/ (Vite build output)
    if (
      pathname.startsWith('/assets/') || pathname.startsWith('/islands/') ||
      pathname.startsWith('/client/') ||
      pathname.startsWith('/app/') || pathname.startsWith('/fixtures/')
    ) {
      const file = readFileSafe(new URL(`.${pathname}`, DIST_DIR));
      if (!file) {
        // Also try from project root for non-built assets (CSS, JSON)
        const rootFile = readFileSafe(new URL(`.${pathname}`, import.meta.url));
        return rootFile ? serveFile(rootFile, ext) : notFound();
      }
      return serveFile(file, ext);
    }

    // SPA fallback: serve dist/index.html for all other routes
    let indexHtml = readTextSafe(new URL('./index.html', DIST_DIR));
    if (indexHtml) {
      // Add fallback text that disappears when SPA mounts (debug aid)
      indexHtml = indexHtml.replace(
        '<div id="root"></div>',
        '<div id="root"><h1 style="font-family:system-ui;text-align:center;padding:2rem;color:#aaa">openElement Reader — loading...</h1></div>',
      );
      // Inject main app bundle script (adapter-vite's SPA shell only includes island entry)
      const assetsDir = new URL('./assets/', DIST_DIR);
      const appScript = findAppScript(assetsDir);
      const cssScript = findAppCss(assetsDir);
      if (appScript) {
        // Replace client-entry.js placeholder with actual reader bundle + CSS + CDN + islands
        indexHtml = indexHtml.replace(
          '<script type="module" src="/client-entry.js"></script>',
          `${cssScript ? `<link rel="stylesheet" href="/assets/${cssScript}">` : ''}
<pre id="err" style="color:red;padding:1rem;display:none"></pre>
<script>function err(m){var d=document.getElementById("err");d.style.display="block";d.textContent+=m+"\\n";}window.onerror=function(m,s,l,c,e){err(e?e.stack||e.message:m)};window.addEventListener("unhandledrejection",function(e){err(e.reason&&e.reason.stack||e.reason||"Promise rejection")});</script>
<script type="module" src="/assets/${appScript}"></script>
<script type="module" src="/client/islands/client.js"></script>`,
        );
      }
      return html(indexHtml);
    }

    // Fallback: try project-root index.html (for dev mode)
    const rootIndex = readTextSafe(new URL('./index.html', import.meta.url));
    return rootIndex ? html(rootIndex) : serverError();
  } catch (err) {
    console.error('[reader] Handler error:', err);
    return serverError();
  }
});
