/** @jsxImportSource @openelement/core */
import type { ReaderBook } from '../app/types.ts';
import { loadProgress } from '../app/storage.ts';

export interface BookCardProps {
  key?: string;
  book: ReaderBook;
  onNavigate: (bookId: string) => void;
}

export default function BookCard({ book, onNavigate }: BookCardProps) {
  const progress = loadProgress(book.id);

  return (
    <open-card
      class='book-card'
      onClick={() => onNavigate(book.id)}
    >
      <div
        class='book-cover'
        style={{ backgroundColor: book.coverColor }}
      />
      <h2 class='book-title'>{book.title}</h2>
      {book.author && <p class='book-author'>{book.author}</p>}
      <p class='book-summary'>{book.summary ?? book.fileName}</p>
      <p class='book-pages'>{book.pageCount} pages</p>
      {progress && progress.page > 1 && (
        <div>
          <p class='progress-indicator'>
            Progress: Page {progress.page} / {book.pageCount}
          </p>
          <open-button
            class='continue-btn'
            onClick={(e: Event) => {
              e.stopPropagation();
              onNavigate(
                `${book.id}?page=${progress.page}`,
              );
            }}
          >
            Continue Reading (Page {progress.page})
          </open-button>
        </div>
      )}
    </open-card>
  );
}
