/** @jsxImportSource @openelement/core */
import { OpenElement } from '@openelement/element';
import type { ReaderProgress, ReaderSource } from '../app/types.ts';
import { loadProgress } from '../app/storage.ts';
import { listBooks, listSources, syncSource } from '../app/api.ts';
import { navigate } from '../router.ts';
import BookCard from '../components/BookCard.tsx';
import type { LibraryBook } from '../app/types.ts';

export interface BookshelfData {
  books: LibraryBook[];
  progressByBook: Record<string, ReaderProgress>;
  sources: ReaderSource[];
}

export async function loader(): Promise<BookshelfData> {
  const [books, sources] = await Promise.all([listBooks(), listSources()]);
  const progressByBook: Record<string, ReaderProgress> = {};
  for (const book of books) {
    const progress = loadProgress(book.id);
    if (progress) progressByBook[book.id] = progress;
  }
  return { books, progressByBook, sources };
}

export async function action(
  ctx: { formData?: FormData },
): Promise<{ synced?: string; error?: string }> {
  const sourceId = String(ctx.formData?.get('source-id') ?? 'fixtures');
  try {
    await syncSource(sourceId);
    return { synced: sourceId };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export const tagName = 'reader-bookshelf';

export default class BookshelfPage extends OpenElement {
  override render() {
    const data = (this as unknown) as BookshelfPage & BookshelfData;
    const actionData = (this as unknown as { actionData?: { synced?: string; error?: string } })
      .actionData;
    const books = data.books || [];
    const sources = data.sources || [];

    if (books.length === 0) {
      return (
        <main class='reader-page'>
          <header class='reader-hero'>
            <div>
              <p class='eyebrow'>OpenElement Reader</p>
              <h1>Library</h1>
              <p>
                No books yet. Sync the fixture source or add a source in settings.
              </p>
            </div>
          </header>
          <form class='source-strip'>
            <input type='hidden' name='source-id' value='fixtures' />
            <open-button type='submit'>Sync fixtures</open-button>
          </form>
        </main>
      );
    }

    return (
      <main class='reader-page'>
        <header class='reader-hero'>
          <div>
            <p class='eyebrow'>OpenElement Reader</p>
            <h1>Library</h1>
            <p>
              Local-first PDF reading across fixtures, local folders, and GitHub repositories.
            </p>
          </div>
          <nav class='top-actions'>
            <a
              href='/search'
              onClick={(e: Event) => {
                e.preventDefault();
                navigate('/search');
              }}
            >
              Search
            </a>
            <a
              href='/notes'
              onClick={(e: Event) => {
                e.preventDefault();
                navigate('/notes');
              }}
            >
              Notes
            </a>
            <a
              href='/settings'
              onClick={(e: Event) => {
                e.preventDefault();
                navigate('/settings');
              }}
            >
              Sources
            </a>
          </nav>
        </header>

        {actionData?.synced && <p class='toast-inline'>Synced {actionData.synced}.</p>}
        {actionData?.error && <p class='form-error'>{actionData.error}</p>}

        <section class='source-strip' aria-label='Reader sources'>
          {sources.map((source) => (
            <form key={source.id} class='source-pill'>
              <input type='hidden' name='source-id' value={source.id} />
              <span>{source.label}</span>
              <small>
                {source.kind}
                {source.lastSyncedAt
                  ? ` · ${new Date(source.lastSyncedAt).toLocaleDateString()}`
                  : ''}
              </small>
              <open-button type='submit'>Sync</open-button>
            </form>
          ))}
        </section>

        <section class='book-grid' aria-label='Bookshelf'>
          {books.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onNavigate={(id) => navigate(`/books/${id}`)}
            />
          ))}
        </section>
      </main>
    );
  }
}
customElements.define(tagName, BookshelfPage);
