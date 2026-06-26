/** @jsxImportSource @openelement/core */
import { OpenElement } from '@openelement/element';
import type { LibraryBook, ReaderNote } from '../app/types.ts';
import { deleteNote, listBooks, listNotes } from '../app/api.ts';
import { navigate } from '../router.ts';

export interface NotesData {
  allNotes: ReaderNote[];
  books: LibraryBook[];
}

export async function loader(): Promise<NotesData> {
  const [allNotes, books] = await Promise.all([listNotes(), listBooks()]);
  return { allNotes, books };
}

export async function action(
  ctx: { formData?: FormData },
): Promise<{ deleted?: string; error?: string }> {
  const noteId = String(ctx.formData?.get('note-id') ?? '');
  if (!noteId) return { error: 'Missing note id.' };
  await deleteNote(noteId);
  return { deleted: noteId };
}

export const tagName = 'reader-notes';

export default class NotesPage extends OpenElement {
  override render() {
    const data = (this as unknown) as NotesPage & NotesData;
    const actionData = (this as unknown as { actionData?: { deleted?: string; error?: string } })
      .actionData;
    const allNotes = data.allNotes || [];
    const books = data.books || [];

    if (allNotes.length === 0) {
      return (
        <main class='reader-page'>
          <h1>Notes</h1>
          {actionData?.deleted && <p class='toast-inline'>Note deleted.</p>}
          <p class='empty-state'>
            No notes yet. Add notes from the reading surface.
          </p>
        </main>
      );
    }

    // Group notes by book
    const grouped = new Map<
      string,
      { book: LibraryBook; notes: ReaderNote[] }
    >();
    for (const note of allNotes) {
      const book = books.find((b) => b.id === note.bookId);
      if (!book) continue;
      if (!grouped.has(book.id)) {
        grouped.set(book.id, { book, notes: [] });
      }
      grouped.get(book.id)!.notes.push(note);
    }

    return (
      <main class='reader-page'>
        <h1>Notes</h1>
        {actionData?.deleted && <p class='toast-inline'>Note deleted.</p>}
        {actionData?.error && <p class='form-error'>{actionData.error}</p>}

        <open-button
          class='export-btn'
          onClick={() => {
            location.href = '/api/notes/export.md';
          }}
        >
          Export Notes (Markdown)
        </open-button>

        {Array.from(grouped.values()).map(({ book, notes }) => (
          <div class='notes-book-section' key={book.id}>
            <h2 class='notes-book-title'>{book.title}</h2>
            {notes.map((note) => (
              <div class='note-card' key={note.id}>
                {note.quote && (
                  <blockquote class='note-quote-preview'>
                    {note.quote}
                  </blockquote>
                )}
                <p class='note-text-preview'>{note.text}</p>
                <p class='note-meta'>
                  Page {note.page ?? 1} — {new Date(note.createdAt).toLocaleDateString()}
                </p>
                <a
                  href={`/books/${book.id}?page=${note.page ?? 1}`}
                  class='note-link'
                  onClick={(e: Event) => {
                    e.preventDefault();
                    navigate(`/books/${book.id}?page=${note.page ?? 1}`);
                  }}
                >
                  Go to page →
                </a>
                <form class='inline-form'>
                  <input type='hidden' name='note-id' value={note.id} />
                  <open-button class='note-delete-btn' type='submit'>
                    Delete
                  </open-button>
                </form>
              </div>
            ))}
          </div>
        ))}
      </main>
    );
  }
}
customElements.define(tagName, NotesPage);
