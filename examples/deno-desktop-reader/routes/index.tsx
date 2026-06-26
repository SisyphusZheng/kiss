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
      return <p class="empty-state">No books in library</p>;
    }

    return (
      <div class="bookshelf">
        <style>{`
          .bookshelf { font-family: system-ui, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
          .bookshelf h1 { font-size: 1.5rem; margin-bottom: 1rem; }
          .book-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; }
          .book-card { cursor: pointer; }
          .book-cover { height: 120px; border-radius: 4px 4px 0 0; }
          .book-title { font-size: 1rem; margin: 0.5rem 0 0 0; }
          .book-author { font-size: 0.85rem; color: #666; margin: 0.25rem 0 0 0; }
          .book-summary { font-size: 0.8rem; color: #888; margin: 0.5rem 0 0 0; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
          .book-pages { font-size: 0.75rem; color: #aaa; margin: 0.25rem 0 0 0; }
          .progress-indicator { font-size: 0.8rem; color: #2563eb; margin: 0.5rem 0 0 0; }
          .empty-state { color: #888; text-align: center; padding: 2rem; }
        `}</style>
        <h1>My Library</h1>
        <div class="book-grid">
          {books.map((book) => {
            const progress = progressByBook[book.id];
            return (
              <open-card
                key={book.id}
                class="book-card"
                onClick={() => navigate(`/books/${book.id}`)}
              >
                <div
                  class="book-cover"
                  style={{ backgroundColor: book.coverColor }}
                />
                <h2 class="book-title">{book.title}</h2>
                <p class="book-author">{book.author}</p>
                <p class="book-summary">{book.summary}</p>
                <p class="book-pages">{book.pageCount} pages</p>
                {progress && progress.pageNumber > 1 && (
                  <div>
                    <p class="progress-indicator">
                      Progress: Page {progress.pageNumber} / {book.pageCount}
                    </p>
                    <open-button
                      class="continue-btn"
                      onClick={(e: Event) => {
                        e.stopPropagation();
                        navigate(
                          `/books/${book.id}?page=${progress.pageNumber}`,
                        );
                      }}
                    >
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
