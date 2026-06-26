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
