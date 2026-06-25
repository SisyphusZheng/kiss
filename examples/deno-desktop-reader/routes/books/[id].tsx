/** @jsxImportSource @openelement/core */
import { useActionData, useLoaderData } from '@openelement/router/data-context';
import type { ReaderBook } from '../../app/types.ts';
import { currentPath, navigate } from '../../router.ts';
import { saveNote, saveProgress } from '../../app/storage.ts';

// ponytail: direct import of books JSON for the SPA client
import booksData from '../../fixtures/books.json' with { type: 'json' };

let _showAddNoteForm = false;

interface ReadingData {
  book: ReaderBook | null;
  page: number;
  totalPages: number;
}

interface ReadingActionData {
  saved?: boolean;
  error?: string;
}

function readPage(params: Record<string, string>): number {
  const pageParam = parseInt(params.page || '1', 10);
  return isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
}

export function loader(
  ctx: { params: Record<string, string> },
): Promise<ReadingData> {
  const books = booksData as unknown as ReaderBook[];
  const book = books.find((b) => b.id === ctx.params.id) ?? null;
  const page = readPage(ctx.params);
  if (book) saveProgress(book.id, page);
  return Promise.resolve({
    book,
    page,
    totalPages: book?.pageCount ?? 0,
  });
}

export function action(
  ctx: { params: Record<string, string> },
): Promise<ReadingActionData> {
  const books = booksData as unknown as ReaderBook[];
  const book = books.find((b) => b.id === ctx.params.id);
  if (!book) return Promise.resolve({ error: 'Book not found' });

  const quoteEl = document.getElementById('note-quote') as HTMLTextAreaElement | null;
  const noteEl = document.getElementById('note-text') as HTMLTextAreaElement | null;
  const page = readPage(ctx.params);
  const note = (noteEl?.value ?? '').trim();
  if (!note) {
    return Promise.resolve({ error: 'Write a note before saving.' });
  }

  saveNote({
    id: crypto.randomUUID(),
    bookId: book.id,
    pageNumber: page,
    quote: quoteEl?.value ?? '',
    note,
    createdAt: new Date().toISOString(),
  });
  _showAddNoteForm = false;
  return Promise.resolve({ saved: true });
}

export default function ReadingRoute() {
  const { book, page, totalPages } = useLoaderData<ReadingData>();
  const actionData = useActionData<ReadingActionData>();

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

  return (
    <div>
      <h1>{book.title}</h1>
      <p class='book-author'>by {book.author}</p>
      {actionData?.saved && <p class='toast-inline'>Note saved.</p>}
      {actionData?.error && <p class='form-error'>{actionData.error}</p>}

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
        <form class='note-form'>
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

          <open-button type='submit'>
            Save Note
          </open-button>
        </form>
      )}
    </div>
  );
}
