/**
 * openElement Desktop Reader — HTTP server.
 *
 * Serves the SPA client, API endpoints, and PDF files.
 * All handler errors are caught to avoid breaking the desktop webview.
 */

import { indexBook, search } from "./app/search.ts";

// Cache paths
const HOME = Deno.env.get("HOME") ?? ".";
const CACHE_DIR = `${HOME}/.open-reader`;
const BOOKS_DIR = `${CACHE_DIR}/books`;
const FIXTURES_DIR = new URL("./fixtures/books/", import.meta.url).pathname;
const BOOKS_JSON_URL = new URL("./fixtures/books.json", import.meta.url);
const APP_DIR = new URL("./app/", import.meta.url);
const DIST_DIR = new URL("./dist/", import.meta.url);

let searchIndexReady = false;

function readTextSafe(url: URL): string | null {
  try {
    return Deno.readTextFileSync(url);
  } catch {
    return null;
  }
}

function readFileSafe(url: URL): Uint8Array | null {
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
  return new Response(body, { headers: { "content-type": "text/html" } });
}

function json(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    headers: { "content-type": "application/json" },
  });
}

function pdf(bytes: Uint8Array): Response {
  return new Response(new Uint8Array(bytes), {
    headers: { "content-type": "application/pdf" },
  });
}

function serveFile(bytes: Uint8Array, ext: string): Response {
  const mime: Record<string, string> = {
    ".js": "application/javascript",
    ".css": "text/css",
    ".html": "text/html",
  };
  return new Response(new Uint8Array(bytes), {
    headers: { "content-type": mime[ext] ?? "application/octet-stream" },
  });
}

function notFound(): Response {
  return new Response("Not Found", { status: 404 });
}

function serverError(msg: string): Response {
  return new Response(msg, {
    status: 500,
    headers: { "content-type": "text/plain" },
  });
}

async function ensureSearchIndex(): Promise<void> {
  if (searchIndexReady) return;
  searchIndexReady = true;
  const raw = readTextSafe(BOOKS_JSON_URL);
  if (!raw) return;
  try {
    const books = JSON.parse(raw);
    for (const book of books) {
      const path = `${FIXTURES_DIR}/${book.fileName}`;
      if (!statSafe(path)) continue;
      try {
        await indexBook(path, book.id, CACHE_DIR);
      } catch { /* skip */ }
    }
  } catch { /* skip */ }
}

Deno.serve((req: Request) => {
  try {
    const url = new URL(req.url);
    const pathname = url.pathname;
    const ext = pathname.slice(pathname.lastIndexOf("."));

    // API: books
    if (pathname === "/api/books") {
      const raw = readTextSafe(BOOKS_JSON_URL);
      return raw ? json(JSON.parse(raw)) : json([]);
    }

    // API: search
    if (pathname === "/api/search") {
      const q = url.searchParams.get("q");
      if (!q) return json([]);
      ensureSearchIndex(); // fire-and-forget
      try {
        return json(search(q, CACHE_DIR));
      } catch {
        return json([]);
      }
    }

    // PDF files
    if (pathname.startsWith("/books/")) {
      const name = pathname.slice("/books/".length);
      for (const dir of [BOOKS_DIR, FIXTURES_DIR]) {
        const p = `${dir}/${name}`;
        if (!statSafe(p)) continue;
        try {
          return pdf(Deno.readFileSync(p));
        } catch { /* try next */ }
      }
      return notFound();
    }

    // Static assets from dist/
    if (pathname.startsWith("/dist/")) {
      const name = pathname.slice("/dist/".length);
      const file = readFileSafe(new URL(`./${name}`, DIST_DIR));
      return file ? serveFile(file, ext) : notFound();
    }

    // Static assets from app/
    if (pathname.startsWith("/app/")) {
      const file = readFileSafe(new URL(`.${pathname}`, APP_DIR));
      return file ? serveFile(file, ext) : notFound();
    }

    // SPA fallback
    const indexHtml = readTextSafe(new URL("./index.html", APP_DIR));
    return indexHtml ? html(indexHtml) : serverError("index.html not found");
  } catch (err) {
    console.error("[reader] Handler error:", err);
    return serverError(String(err));
  }
});
