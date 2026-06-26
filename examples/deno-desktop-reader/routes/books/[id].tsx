/** @jsxImportSource @openelement/core */
import { OpenElement } from "@openelement/element";
import { signal } from "@openelement/signal";
import type { ReaderBook } from "../../app/types.ts";
import { navigate } from "../../router.ts";
import { saveNote, saveProgress } from "../../app/storage.ts";

// ponytail: direct import of books JSON for the SPA client
import booksData from "../../fixtures/books.json" with { type: "json" };

export interface ReadingData {
  book: ReaderBook | null;
  page: number;
  totalPages: number;
}

export interface ReadingActionData {
  saved?: boolean;
  error?: string;
}

function readPage(params: Record<string, string>): number {
  const pageParam = parseInt(params.page || "1", 10);
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
  ctx: { params: Record<string, string>; formData?: FormData },
): Promise<ReadingActionData> {
  const books = booksData as unknown as ReaderBook[];
  const book = books.find((b) => b.id === ctx.params.id);
  if (!book) return Promise.resolve({ error: "Book not found" });

  const quote = (ctx.formData?.get("note-quote") as string ?? "").trim();
  const note = (ctx.formData?.get("note-text") as string ?? "").trim();
  if (!note) {
    return Promise.resolve({ error: "Write a note before saving." });
  }

  const page = readPage(ctx.params);
  saveNote({
    id: crypto.randomUUID(),
    bookId: book.id,
    pageNumber: page,
    quote,
    note,
    createdAt: new Date().toISOString(),
  });
  return Promise.resolve({ saved: true });
}

export const tagName = "reader-reading";

export default class ReadingPage extends OpenElement {
  #showAddNoteForm = signal(false);

  override render() {
    const data = (this as unknown) as ReadingPage & ReadingData;
    const actionData: ReadingActionData | undefined =
      (this as unknown as Record<string, unknown>).actionData as
        | ReadingActionData
        | undefined;
    const book = data.book;
    const page = data.page;
    const totalPages = data.totalPages;

    if (!book) {
      return (
        <div>
          <h1>Book not found</h1>
          <a
            href="/"
            onClick={(e: Event) => {
              e.preventDefault();
              navigate("/");
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
        <p class="book-author">by {book.author}</p>
        {actionData?.saved && <p class="toast-inline">Note saved.</p>}
        {actionData?.error && <p class="form-error">{actionData.error}</p>}

        <embed
          src={`/books/${book.fileName}#page=${page}`}
          type="application/pdf"
          width="100%"
          height="600"
        />

        <div class="page-nav">
          <span class="page-info">Page {page} of {totalPages}</span>
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
          class="add-note-btn"
          onClick={() => {
            this.#showAddNoteForm.value = !this.#showAddNoteForm.value;
          }}
        >
          + Add Note
        </open-button>

        {this.#showAddNoteForm.value && (
          <form class="note-form">
            <label>Quote:</label>
            <textarea
              name="note-quote"
              class="note-quote"
              rows={3}
              placeholder="Paste the passage you want to annotate..."
            />

            <label>Your Note:</label>
            <textarea
              name="note-text"
              class="note-text"
              rows={4}
              placeholder="Write your thoughts..."
            />

            <open-button type="submit">
              Save Note
            </open-button>
          </form>
        )}
      </div>
    );
  }
}
customElements.define(tagName, ReadingPage);
