/**
 * openElement Desktop Reader — HTTP server.
 *
 * Serves the SPA client, API endpoints, and PDF files.
 * PDF text indexing is lazy (on first /api/search request) to avoid
 * blocking Deno.serve() startup in desktop mode.
 */

import {
  indexBook,
  loadSearchIndex,
  saveSearchIndex,
  search,
} from "./app/search.ts";

// Cache paths
const HOME = Deno.env.get("HOME") ?? ".";
const CACHE_DIR = `${HOME}/.open-reader`;
const BOOKS_DIR = `${CACHE_DIR}/books`;
const FIXTURES_DIR = new URL("./fixtures/books/", import.meta.url).pathname;
const BOOKS_JSON = new URL("./fixtures/books.json", import.meta.url);

let searchIndexReady = false;

function serveHtml(): Response {
  const html = Deno.readTextFileSync(
    new URL("./app/index.html", import.meta.url),
  );
  return new Response(html, {
    headers: { "content-type": "text/html" },
  });
}

function serveJson(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    headers: { "content-type": "application/json" },
  });
}

function serve404(): Response {
  return new Response("Not Found", { status: 404 });
}

/** Lazy-init the search index on first /api/search call */
async function ensureSearchIndex(): Promise<void> {
  if (searchIndexReady) return;
  searchIndexReady = true;

  try {
    const books = JSON.parse(Deno.readTextFileSync(BOOKS_JSON));
    for (const book of books) {
      const path = `${FIXTURES_DIR}/${book.fileName}`;
      try {
        Deno.statSync(path);
        await indexBook(path, book.id, CACHE_DIR);
      } catch {
        // PDF not found — skip
      }
    }
    console.log("[reader] Search index ready");
  } catch (err) {
    console.warn("[reader] Failed to build search index:", err);
  }
}

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);

  // API: books list
  if (url.pathname === "/api/books") {
    const books = JSON.parse(Deno.readTextFileSync(BOOKS_JSON));
    return serveJson(books);
  }

  // API: search (lazy-init index)
  if (url.pathname === "/api/search") {
    const q = url.searchParams.get("q");
    if (!q) return serveJson([]);
    await ensureSearchIndex();
    return serveJson(search(q, CACHE_DIR));
  }

  // PDF files — try cache, fallback fixtures
  if (url.pathname.startsWith("/books/")) {
    const fileName = url.pathname.slice("/books/".length);
    for (const dir of [BOOKS_DIR, FIXTURES_DIR]) {
      try {
        const file = Deno.readFileSync(`${dir}/${fileName}`);
        return new Response(file, {
          headers: { "content-type": "application/pdf" },
        });
      } catch { /* try next */ }
    }
    return serve404();
  }

  // Static assets
  const ext = url.pathname.slice(url.pathname.lastIndexOf("."));
  const mime: Record<string, string> = {
    ".js": "application/javascript",
    ".css": "text/css",
    ".html": "text/html",
    ".ts": "application/javascript",
  };
  if (url.pathname.startsWith("/dist/") || url.pathname.startsWith("/app/")) {
    try {
      const file = Deno.readFileSync(
        new URL(`.${url.pathname}`, import.meta.url),
      );
      return new Response(file, {
        headers: { "content-type": mime[ext] ?? "application/octet-stream" },
      });
    } catch {
      return serve404();
    }
  }

  // SPA fallback
  return serveHtml();
});
