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

async function readFileSafe(url: URL): Promise<Uint8Array<ArrayBuffer> | null> {
  try {
    return await Deno.readFile(url);
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

function injectDesktopBridge(body: string): string {
  const marker = '<script>window.__OPEN_READER_DESKTOP_HOST__=true;</script>';
  if (body.includes('__OPEN_READER_DESKTOP_HOST__')) return body;
  return body.includes('</head>')
    ? body.replace('</head>', `${marker}</head>`)
    : `${marker}${body}`;
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

function closeApp(): Response {
  setTimeout(() => {
    void server?.shutdown().finally(() => Deno.exit(0));
  }, 25);
  return json({ closing: true });
}

async function pickDirectory(): Promise<Response> {
  if (Deno.build.os !== 'darwin') {
    return new Response(
      JSON.stringify({ error: 'Folder picker is only implemented on macOS for now.' }),
      { status: 501, headers: { 'content-type': 'application/json' } },
    );
  }

  const command = new Deno.Command('osascript', {
    args: ['-e', 'POSIX path of (choose folder with prompt "选择包含 PDF 的文件夹")'],
    stdout: 'piped',
    stderr: 'piped',
  });
  const output = await command.output();
  if (!output.success) {
    const err = new TextDecoder().decode(output.stderr).trim();
    return new Response(
      JSON.stringify({ error: err || 'Folder selection cancelled.' }),
      { status: 400, headers: { 'content-type': 'application/json' } },
    );
  }
  const path = new TextDecoder().decode(output.stdout).trim().replace(/\/$/, '');
  return json({ path });
}

const server = Deno.serve(async (req: Request) => {
  try {
    const url = new URL(req.url);
    const pathname = url.pathname;
    const dotIndex = pathname.lastIndexOf('.');
    const ext = dotIndex > pathname.lastIndexOf('/') ? pathname.slice(dotIndex) : '';

    if (pathname === '/api/app/close') {
      if (req.method !== 'POST') return methodNotAllowed();
      return closeApp();
    }

    if (pathname === '/api/dialog/directory') {
      if (req.method !== 'POST') return methodNotAllowed();
      return await pickDirectory();
    }

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
        return pdf(await Deno.readFile(book.path));
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
      return json(await searchLibrary(STORE_PATHS, q));
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
    if (pathname.startsWith('/books/') && pathname.toLowerCase().endsWith('.pdf')) {
      const name = pathname.slice('/books/'.length);
      for (const dir of [BOOKS_DIR, FIXTURES_DIR]) {
        const p = `${dir}/${name}`;
        if (!statSafe(p)) continue;
        try {
          return pdf(await Deno.readFile(p));
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
      const file = await readFileSafe(new URL(`.${pathname}`, DIST_DIR));
      if (!file) {
        // Also try from project root for non-built assets (CSS, JSON)
        const rootFile = await readFileSafe(new URL(`.${pathname}`, import.meta.url));
        return rootFile ? serveFile(rootFile, ext) : notFound();
      }
      return serveFile(file, ext);
    }

    // SPA fallback: serve dist/index.html for all other routes
    const indexHtml = readTextSafe(new URL('./index.html', DIST_DIR));
    if (indexHtml) return html(injectDesktopBridge(indexHtml));

    // Fallback: try project-root index.html (for dev mode)
    const rootIndex = readTextSafe(new URL('./index.html', import.meta.url));
    return rootIndex ? html(injectDesktopBridge(rootIndex)) : serverError();
  } catch (err) {
    console.error('[reader] Handler error:', err);
    return serverError();
  }
});
