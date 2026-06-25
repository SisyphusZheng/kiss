/** @jsxImportSource @openelement/core */
import type { ReaderBook } from '../../app/types.ts';
import { currentParams, currentPath, navigate } from '../../router.ts';
import { saveNote, saveProgress } from '../../app/storage.ts';

// ponytail: direct import of books JSON for the SPA client
import booksData from '../../fixtures/books.json' with { type: 'json' };

let _showAddNoteForm = false;

// Toast helper (ponytail: simple DOM toast, lives outside #root so survives routing)
function showToast(message: string): void {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

export default function ReadingRoute() {
  const params = currentParams();
  const bookId = params.id;
  const books: ReaderBook[] = booksData as unknown as ReaderBook[];
  const book = books.find((b) => b.id === bookId);

  if (!book) {
    return (
      <div>
        <h1>Book not found</h1>
        <a
          href='/'
          onClick={(e: Event) => {
            e.preventDefault();
            navigate('/');
          }}
        >
          ← Back to Bookshelf
        </a>
      </div>
    );
  }

  const pageParam = parseInt(currentParams().page || '1', 10);
  const page = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
  const totalPages = book.pageCount;

  // Save reading progress
  saveProgress(book.id, page);

  return (
    <div>
      <h1>{book.title}</h1>
      <p class='book-author'>by {book.author}</p>

      <embed
        src={`/books/${book.fileName}#page=${page}`}
        type='application/pdf'
        width='100%'
        height='600'
      />

      <div class='page-nav'>
        <span class='page-info'>Page {page} of {totalPages}</span>
        <open-button
          disabled={page <= 1}
          onClick={() => navigate(`/books/${book.id}?page=${page - 1}`)}
        >
          ← Previous
        </open-button>
        <open-button
          disabled={page >= totalPages}
          onClick={() => navigate(`/books/${book.id}?page=${page + 1}`)}
        >
          Next →
        </open-button>
      </div>

      <open-button
        class='add-note-btn'
        onClick={() => {
          _showAddNoteForm = !_showAddNoteForm;
          navigate(currentPath());
        }}
      >
        + Add Note
      </open-button>

      {_showAddNoteForm && (
        <div class='note-form'>
          <label>Quote:</label>
          <textarea
            id='note-quote'
            class='note-quote'
            rows={3}
            placeholder='Paste the passage you want to annotate...'
          />

          <label>Your Note:</label>
          <textarea
            id='note-text'
            class='note-text'
            rows={4}
            placeholder='Write your thoughts...'
          />

          <open-button
            onClick={() => {
              const quoteEl = document.getElementById(
                'note-quote',
              ) as HTMLTextAreaElement;
              const noteEl = document.getElementById(
                'note-text',
              ) as HTMLTextAreaElement;
              const note = {
                id: crypto.randomUUID(),
                bookId: book.id,
                pageNumber: page,
                quote: quoteEl?.value ?? '',
                note: noteEl?.value ?? '',
                createdAt: new Date().toISOString(),
              };
              saveNote(note);
              _showAddNoteForm = false;
              showToast('Note saved!');
              navigate(currentPath());
            }}
          >
            Save Note
          </open-button>
        </div>
      )}
    </div>
  );
}
