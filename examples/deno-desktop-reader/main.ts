// Deno.serve() HTTP server
// On startup: read READER_REPO env var (default "open-element/reader-fixtures")
// Serve:
//   - GET /          → app/index.html (SPA shell)
//   - GET /api/books → JSON list of books (stub: return fixtures/books.json)
//   - GET /api/search?q= → search results (stub: return [])
//   - GET /books/*   → serve PDF files from ~/.open-reader/books/
//   - SPA fallback: return index.html for all other routes

// ponytail: used in S4 for GitHub repo sync
const _repo = Deno.env.get("READER_REPO") ?? "open-element/reader-fixtures";
const booksDir = Deno.env.get("HOME")
  ? `${Deno.env.get("HOME")}/.open-reader/books`
  : `~/.open-reader/books`;

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
    // Stub: return empty results
    return serveJson([]);
  }

  // PDF file serving
  if (url.pathname.startsWith("/books/")) {
    const fileName = url.pathname.slice("/books/".length);
    try {
      const file = Deno.readFileSync(`${booksDir}/${fileName}`);
      return new Response(file, {
        headers: { "content-type": "application/pdf" },
      });
    } catch {
      return serve404();
    }
  }

  // SPA fallback: index.html for all other routes
  return serveHtml();
});
