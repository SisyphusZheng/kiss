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
  const percent = progress
    ? Math.min(100, Math.round((progress.page / Math.max(book.pageCount, 1)) * 100))
    : 0;

  return (
    <article
      class='book-card'
      onClick={() => onNavigate(book.id)}
    >
      <div class='book-cover-wrap'>
        <div
          class='book-cover'
          style={`background:${book.coverColor}`}
        >
          <span class='book-cover-title'>{book.title}</span>
          {book.author && <span class='book-cover-author'>{book.author}</span>}
        </div>
      </div>
      <div class='book-meta'>
        <h2 class='book-title'>{book.title}</h2>
        {book.author && <p class='book-author'>{book.author}</p>}
        <p class='book-summary'>{book.summary ?? book.fileName}</p>
        <div class='book-foot'>
          <span>{book.pageCount} pages</span>
          {progress && progress.page > 1 && <span>{percent}%</span>}
        </div>
      </div>
      {progress && progress.page > 1 && (
        <div class='progress-block'>
          <div class='progress-bar'>
            <span style={{ width: `${percent}%` }} />
          </div>
          <open-button
            class='continue-btn'
            onClick={(e: Event) => {
              e.stopPropagation();
              onNavigate(
                `${book.id}?page=${progress.page}`,
              );
            }}
          >
            Continue page {progress.page}
          </open-button>
        </div>
      )}
    </article>
  );
}
