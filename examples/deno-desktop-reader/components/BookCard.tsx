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
              onNavigate(
                `${book.id}?page=${progress.pageNumber}`,
              );
            }}
          >
            Continue Reading (Page {progress.pageNumber})
          </open-button>
        </div>
      )}
    </open-card>
  );
}
