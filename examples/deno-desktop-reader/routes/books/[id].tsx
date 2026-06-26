/** @jsxImportSource @openelement/core */
import { OpenElement } from '@openelement/element';
import type { LibraryBook, ReaderNote, ReaderProgress } from '../../app/types.ts';
import { getBookDetails, saveNote } from '../../app/api.ts';
import { navigate } from '../../router.ts';

const readingStyles = `
:host {
  --reader-bg: #f6f1e8;
  --reader-panel: #fffdf8;
  --reader-line: #e6dccd;
  --reader-muted: #756f66;
  --reader-fg: #231f1b;
  --reader-accent: #1f6f63;
  color: var(--reader-fg);
  display: block;
  font-family: system-ui, -apple-system, sans-serif;
}
.reader-page {
  background: radial-gradient(circle at 12% 0, rgba(255,255,255,.86), transparent 28%), #f6f1e8;
  box-sizing: border-box;
  min-height: 100vh;
  padding: 28px 30px 56px;
}
.reading-shell {
  max-width: 1120px;
  margin: 0 auto;
}
.reader-toolbar {
  align-items: center;
  background: rgba(255,253,248,.86);
  border: 1px solid rgba(230,220,205,.9);
  border-radius: 22px;
  box-shadow: 0 16px 36px rgba(74,55,38,.08);
  display: grid;
  gap: 18px;
  grid-template-columns: auto 1fr auto;
  margin-bottom: 22px;
  padding: 18px 22px;
}
.reader-toolbar a {
  background: #fff;
  border: 1px solid var(--reader-line);
  border-radius: 999px;
  color: #2d4944;
  font-size: 14px;
  font-weight: 680;
  padding: 9px 14px;
  text-decoration: none;
}
h1 {
  font-size: clamp(24px, 3.4vw, 40px);
  letter-spacing: 0;
  line-height: 1.04;
  margin: 0;
  text-align: center;
}
.book-author {
  color: var(--reader-muted);
  font-size: 14px;
  margin: 7px 0 0;
  text-align: center;
}
pdf-reader-island {
  background: var(--reader-panel);
  border: 1px solid var(--reader-line);
  border-radius: 22px;
  box-shadow: 0 18px 45px rgba(74,55,38,.12);
  display: block;
  padding: 18px;
}
.pdf-surface {
  background: var(--reader-panel);
  border: 1px solid var(--reader-line);
  border-radius: 22px;
  box-shadow: 0 18px 45px rgba(74,55,38,.12);
  padding: 18px;
}
.pdf-controls {
  align-items: center;
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-bottom: 14px;
}
.pdf-controls a,
.pdf-controls span {
  border-radius: 999px;
  font-size: 13px;
  font-weight: 680;
  padding: 8px 12px;
  text-decoration: none;
}
.pdf-controls a {
  background: #fff;
  border: 1px solid var(--reader-line);
  color: #2d4944;
}
.pdf-controls span {
  color: var(--reader-muted);
}
.pdf-frame {
  background: #f8f2e8;
  border: 1px solid #e0d6c8;
  border-radius: 14px;
  box-shadow: inset 0 1px rgba(255,255,255,.8);
  height: 62vh;
  width: 100%;
}
note-panel-island {
  display: block;
  margin: 18px 0 0;
}
.reader-notes-panel {
  display: grid;
  gap: 18px;
  grid-template-columns: minmax(0, 1fr) minmax(260px, 340px);
  margin-top: 18px;
}
.note-form,
.note-stack {
  background: rgba(255,253,248,.9);
  border: 1px solid var(--reader-line);
  border-radius: 18px;
  box-shadow: 0 12px 30px rgba(74,55,38,.07);
  padding: 18px;
}
.note-form label {
  color: #3c352f;
  display: block;
  font-size: 13px;
  font-weight: 720;
  margin: 12px 0 7px;
}
.note-form label:first-child {
  margin-top: 0;
}
.note-form textarea {
  background: #fffaf2;
  border: 1px solid #dfd2bf;
  border-radius: 12px;
  box-sizing: border-box;
  color: var(--reader-fg);
  font: 15px/1.55 system-ui, -apple-system, sans-serif;
  padding: 11px 12px;
  resize: vertical;
  width: 100%;
}
.note-stack h2 {
  font-size: 16px;
  margin: 0 0 12px;
}
.note-card {
  border-top: 1px solid var(--reader-line);
  padding: 12px 0;
}
.note-card:first-of-type {
  border-top: 0;
}
.note-card blockquote {
  border-left: 3px solid #cdbfaa;
  color: #6f675d;
  margin: 0 0 8px;
  padding-left: 10px;
}
.toast-inline,
.form-error {
  border-radius: 14px;
  margin: 0 0 16px;
  padding: 11px 14px;
}
.toast-inline {
  background: #e9f7ef;
  color: #15564e;
}
.form-error {
  background: #fde8e0;
  color: #8a3320;
}
@media (max-width: 800px) {
  .reader-page { padding: 18px 16px 42px; }
  .reader-toolbar { display: block; }
  .reader-toolbar h1 { margin: 14px 0; text-align: left; }
  .book-author { text-align: left; }
  .reader-notes-panel { grid-template-columns: 1fr; }
}
`;

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
          <style>{readingStyles}</style>
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
        <style>{readingStyles}</style>
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

        <section class='pdf-surface' aria-label='PDF reader'>
          <div class='pdf-controls'>
            <a
              href={`/books/${book.id}?page=${Math.max(1, page - 1)}`}
              onClick={(e: Event) => {
                e.preventDefault();
                navigate(`/books/${book.id}?page=${Math.max(1, page - 1)}`);
              }}
            >
              Prev
            </a>
            <span>Page {page} / {totalPages}</span>
            <a
              href={`/books/${book.id}?page=${Math.min(totalPages, page + 1)}`}
              onClick={(e: Event) => {
                e.preventDefault();
                navigate(`/books/${book.id}?page=${Math.min(totalPages, page + 1)}`);
              }}
            >
              Next
            </a>
            <span>{Math.round(zoom * 100)}%</span>
          </div>
          <iframe
            class='pdf-frame'
            title={`${book.title} PDF`}
            src={`/api/books/${book.id}/file#page=${page}&zoom=${Math.round(zoom * 100)}`}
          />
        </section>

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
