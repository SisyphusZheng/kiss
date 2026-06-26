/** @jsxImportSource @openelement/core */
import { OpenElement } from '@openelement/element';
import type { LibraryBook, ReaderNote, ReaderProgress } from '../../app/types.ts';
import { getBookDetails, saveNote } from '../../app/api.ts';
import { navigate } from '../../router.ts';

export interface ReadingData {
  book: LibraryBook | null;
  notes: ReaderNote[];
  progress: ReaderProgress | null;
  page: number;
  zoom: number;
  totalPages: number;
}

export interface ReadingActionData {
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
  const bookId = ctx.params.id;
  const page = readPage(ctx.params);
  return getBookDetails(bookId).then((details) => ({
    book: details?.book ?? null,
    notes: details?.notes ?? [],
    progress: details?.progress ?? null,
    page: details?.progress?.page ?? page,
    zoom: details?.progress?.zoom ?? 1,
    totalPages: details?.book.pageCount ?? 0,
  }));
}

export function action(
  ctx: { params: Record<string, string>; formData?: FormData },
): Promise<ReadingActionData> {
  const quote = (ctx.formData?.get('note-quote') as string ?? '').trim();
  const note = (ctx.formData?.get('note-text') as string ?? '').trim();
  if (!note) {
    return Promise.resolve({ error: 'Write a note before saving.' });
  }

  const page = readPage(ctx.params);
  return saveNote({
    bookId: ctx.params.id,
    page,
    quote,
    text: note,
  }).then(() => ({ saved: true })).catch((err) => ({
    error: err instanceof Error ? err.message : String(err),
  }));
}

export const tagName = 'reader-reading';

export default class ReadingPage extends OpenElement {
  override render() {
    const data = (this as unknown) as ReadingPage & ReadingData;
    const actionData: ReadingActionData | undefined = (this as unknown as Record<string, unknown>)
      .actionData as
        | ReadingActionData
        | undefined;
    const book = data.book;
    const page = data.page;
    const zoom = data.zoom;
    const totalPages = data.totalPages;
    const notes = data.notes || [];

    if (!book) {
      return (
        <main class='reader-page'>
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
        </main>
      );
    }

    return (
      <main class='reader-page reading-shell'>
        <header class='reader-toolbar'>
          <a
            href='/'
            onClick={(e: Event) => {
              e.preventDefault();
              navigate('/');
            }}
          >
            ← Library
          </a>
          <div>
            <h1>{book.title}</h1>
            {book.author && <p class='book-author'>by {book.author}</p>}
          </div>
          <a
            href='/notes'
            onClick={(e: Event) => {
              e.preventDefault();
              navigate('/notes');
            }}
          >
            Notes
          </a>
        </header>

        {actionData?.saved && <p class='toast-inline'>Note saved.</p>}
        {actionData?.error && <p class='form-error'>{actionData.error}</p>}

        <pdf-reader-island
          book-id={book.id}
          src={`/api/books/${book.id}/file`}
          page={String(page)}
          zoom={String(zoom)}
          pages={String(totalPages)}
        />

        <note-panel-island count={String(notes.length)} />

        <section class='reader-notes-panel'>
          <form class='note-form'>
            <label>Quote:</label>
            <textarea
              name='note-quote'
              class='note-quote'
              rows={3}
              placeholder='Paste the passage you want to annotate...'
            />

            <label>Your Note:</label>
            <textarea
              name='note-text'
              class='note-text'
              rows={4}
              placeholder='Write your thoughts...'
            />

            <open-button type='submit'>
              Save Note
            </open-button>
          </form>
          {notes.length > 0 && (
            <div class='note-stack'>
              <h2>Saved notes</h2>
              {notes.map((note) => (
                <article class='note-card' key={note.id}>
                  {note.quote && <blockquote>{note.quote}</blockquote>}
                  <p>{note.text}</p>
                  <small>Page {note.page ?? 1}</small>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    );
  }
}
customElements.define(tagName, ReadingPage);
