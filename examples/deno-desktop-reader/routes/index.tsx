/** @jsxImportSource @openelement/core */
import type { ReaderBook } from '../app/types.ts';
import { loadProgress } from '../app/storage.ts';
import { navigate } from '../router.ts';

// ponytail: direct import of books JSON for the SPA client
import booksData from '../fixtures/books.json' with { type: 'json' };

export default function BookshelfRoute() {
  const books: ReaderBook[] = booksData as unknown as ReaderBook[];

  return (
    <div class='bookshelf'>
      <h1>My Library</h1>
      {books.length === 0 ? <p class='empty-state'>No books in library</p> : (
        <div class='book-grid'>
          {books.map((book) => {
            const progress = loadProgress(book.id);
            return (
              <open-card
                key={book.id}
                class='book-card'
                onClick={() => navigate(`/books/${book.id}`)}
              >
                <div
                  class='book-cover'
                  style={{ backgroundColor: book.coverColor }}
                />
                <h2 class='book-title'>{book.title}</h2>
                <p class='book-author'>{book.author}</p>
                <p class='book-summary'>{book.summary}</p>
                <p class='book-pages'>{book.pageCount} pages</p>
                {progress && progress.pageNumber > 1 && (
                  <div>
                    <p class='progress-indicator'>
                      Progress: Page {progress.pageNumber} / {book.pageCount}
                    </p>
                    <open-button
                      class='continue-btn'
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
      )}
    </div>
  );
}
