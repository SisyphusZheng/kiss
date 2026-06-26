/** @jsxImportSource @openelement/core */
import { OpenElement } from "@openelement/element";
import type { ReaderBook, ReaderProgress } from "../app/types.ts";
import { loadProgress } from "../app/storage.ts";
import { navigate } from "../router.ts";

// ponytail: direct import of books JSON for the SPA client
import booksData from "../fixtures/books.json" with { type: "json" };

export interface BookshelfData {
  books: ReaderBook[];
  progressByBook: Record<string, ReaderProgress>;
}

export function loader(): Promise<BookshelfData> {
  const books = booksData as unknown as ReaderBook[];
  const progressByBook: Record<string, ReaderProgress> = {};
  for (const book of books) {
    const progress = loadProgress(book.id);
    if (progress) progressByBook[book.id] = progress;
  }
  return Promise.resolve({ books, progressByBook });
}

export const tagName = "reader-bookshelf";

export default class BookshelfPage extends OpenElement {
  override render() {
    const books = ((this as unknown) as BookshelfPage & BookshelfData).books ||
      [];
    const progressByBook =
      ((this as unknown) as BookshelfPage & BookshelfData).progressByBook || {};

    if (books.length === 0) {
      return <p style="color:#888;text-align:center;padding:2rem">No books in library</p>;
    }

    return (
      <div style="font-family:system-ui,sans-serif;max-width:800px;margin:2rem auto;padding:0 1rem">
        <h1>My Library</h1>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:1rem">
          {books.map((book) => {
            const progress = progressByBook[book.id];
            return (
              <open-card key={book.id} style="cursor:pointer" onClick={() => navigate(`/books/${book.id}`)}>
                <div style={`background:${book.coverColor};height:120px;border-radius:4px 4px 0 0`} />
                <h2 style="font-size:1rem;margin:0.5rem 0 0 0">{book.title}</h2>
                <p style="font-size:0.85rem;color:#666;margin:0.25rem 0 0 0">{book.author}</p>
                <p style="font-size:0.8rem;color:#888;margin:0.25rem 0 0 0;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">{book.summary}</p>
                <p style="font-size:0.75rem;color:#aaa;margin:0.25rem 0 0 0">{book.pageCount} pages</p>
                {progress && progress.pageNumber > 1 && (
                  <div>
                    <p style="font-size:0.8rem;color:#2563eb;margin:0.5rem 0 0 0">Progress: Page {progress.pageNumber} / {book.pageCount}</p>
                    <open-button onClick={(e: Event) => { e.stopPropagation(); navigate(`/books/${book.id}?page=${progress.pageNumber}`); }}>
                      Continue Reading (Page {progress.pageNumber})
                    </open-button>
                  </div>
                )}
              </open-card>
            );
          })}
        </div>
      </div>
    );
  }
}
customElements.define(tagName, BookshelfPage);
