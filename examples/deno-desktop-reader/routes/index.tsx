/** @jsxImportSource @openelement/core */
import { OpenElement } from "@openelement/element";
import type { ReaderBook, ReaderProgress } from "../app/types.ts";
import { loadProgress } from "../app/storage.ts";
import { navigate } from "../router.ts";
import BookCard from "../components/BookCard.tsx";

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

    if (books.length === 0) {
      return <p style="color:#888;text-align:center;padding:2rem">No books in library</p>;
    }

    return (
      <div style="font-family:system-ui,sans-serif;max-width:800px;margin:2rem auto;padding:0 1rem">
        <h1>My Library</h1>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:1rem">
          {books.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onNavigate={(id) => navigate(`/books/${id}`)}
            />
          ))}
        </div>
      </div>
    );
  }
}
customElements.define(tagName, BookshelfPage);
