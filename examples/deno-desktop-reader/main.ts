// Deno.serve() HTTP server
// On startup: read READER_REPO env var (default "open-element/reader-fixtures")
// Serve:
//   - GET /          → app/index.html (SPA shell)
//   - GET /api/books → JSON list of books (stub: return fixtures/books.json)
//   - GET /api/search?q= → search results (stub: return [])
//   - GET /books/*   → serve PDF files from ~/.open-reader/books/
//   - SPA fallback: return index.html for all other routes

import { indexBook, search } from "./app/search.ts";
import { loadSearchIndex } from "./app/search.ts";
import { syncBooks } from "./app/repo.ts";

// ponytail: used in S4 for GitHub repo sync
const _repo = Deno.env.get("READER_REPO") ?? "open-element/reader-fixtures";
const cacheDir = Deno.env.get("HOME")
  ? `${Deno.env.get("HOME")}/.open-reader`
  : `~/.open-reader`;
const booksDir = `${cacheDir}/books`;
const fixturesDir = new URL("./fixtures/books/", import.meta.url).pathname;

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

// Index fixture PDFs at startup
try {
  const books = JSON.parse(
    Deno.readTextFileSync(new URL("./fixtures/books.json", import.meta.url)),
  );
  for (const book of books) {
    const fixturePath = `${fixturesDir}/${book.fileName}`;
    try {
      Deno.statSync(fixturePath);
      await indexBook(fixturePath, book.id, cacheDir);
    } catch {
      console.warn(`[reader] Skipping index: ${fixturePath} not found`);
    }
  }
} catch (err) {
  console.warn("[reader] Failed to index fixture PDFs:", err);
}

Deno.serve((req: Request) => {
  const url = new URL(req.url);

  // API routes
  if (url.pathname === "/api/books") {
    const books = JSON.parse(
      Deno.readTextFileSync(
        new URL("./fixtures/books.json", import.meta.url),
      ),
    );
    return serveJson(books);
  }

  if (url.pathname === "/api/search") {
    const q = url.searchParams.get("q");
    if (!q) return serveJson([]);
    // ponytail: search index built at startup from fixtures; GitHub-synced books added later
    return serveJson(search(q, cacheDir));
  }

  // PDF file serving — try local cache first, then fixtures fallback
  if (url.pathname.startsWith("/books/")) {
    const fileName = url.pathname.slice("/books/".length);
    try {
      const file = Deno.readFileSync(`${booksDir}/${fileName}`);
      return new Response(file, {
        headers: { "content-type": "application/pdf" },
      });
    } catch {
      try {
        const file = Deno.readFileSync(`${fixturesDir}/${fileName}`);
        return new Response(file, {
          headers: { "content-type": "application/pdf" },
        });
      } catch {
        return serve404();
      }
    }
  }

  // SPA fallback: index.html for all other routes
  return serveHtml();
});
