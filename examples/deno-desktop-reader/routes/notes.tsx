/** @jsxImportSource @openelement/core */
import type { ReaderBook, ReaderNote } from '../app/types.ts';
import { deleteNote, loadNotes } from '../app/storage.ts';
import { navigate } from '../router.ts';
import { exportNotesToMarkdown } from '../app/export.ts';

// ponytail: direct import of books JSON
import booksData from '../fixtures/books.json' with { type: 'json' };

function showToast(message: string): void {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

export default function NotesRoute() {
  const allNotes: ReaderNote[] = loadNotes() as unknown as ReaderNote[];
  const books: ReaderBook[] = booksData as unknown as ReaderBook[];

  if (allNotes.length === 0) {
    return (
      <div>
        <h1>Notes</h1>
        <p class='empty-state'>
          No notes yet. Add notes from the reading surface.
        </p>
      </div>
    );
  }

  // Group notes by book
  const grouped = new Map<string, { book: ReaderBook; notes: ReaderNote[] }>();
  for (const note of allNotes) {
    const book = books.find((b) => b.id === note.bookId);
    if (!book) continue;
    if (!grouped.has(book.id)) {
      grouped.set(book.id, { book, notes: [] });
    }
    grouped.get(book.id)!.notes.push(note);
  }

  return (
    <div>
      <h1>Notes</h1>

      <open-button
        class='export-btn'
        onClick={() => {
          const md = exportNotesToMarkdown(allNotes, books);
          const blob = new Blob([md], { type: 'text/markdown' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'reader-notes.md';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          showToast('Notes exported!');
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
              <p class='note-text-preview'>{note.note}</p>
              <p class='note-meta'>
                Page {note.pageNumber} — {new Date(note.createdAt).toLocaleDateString()}
              </p>
              <a
                href={`/books/${book.id}?page=${note.pageNumber}`}
                class='note-link'
                onClick={(e: Event) => {
                  e.preventDefault();
                  navigate(`/books/${book.id}?page=${note.pageNumber}`);
                }}
              >
                Go to page →
              </a>
              <open-button
                class='note-delete-btn'
                onClick={() => {
                  deleteNote(note.id);
                  navigate(
                    globalThis.location.pathname + globalThis.location.search,
                  );
                }}
              >
                Delete
              </open-button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
