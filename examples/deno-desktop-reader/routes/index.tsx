/** @jsxImportSource @openelement/core */
import { OpenElement } from '@openelement/element';
import type { ReaderProgress, ReaderSource } from '../app/types.ts';
import { loadProgress } from '../app/storage.ts';
import { listBooks, listSources, syncSource } from '../app/api.ts';
import { navigate } from '../router.ts';
import BookCard from '../components/BookCard.tsx';
import type { LibraryBook } from '../app/types.ts';

const bookshelfStyles = `
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
  background: radial-gradient(circle at 10% 0, rgba(255,255,255,.86), transparent 30%), #f6f1e8;
  box-sizing: border-box;
  min-height: 100vh;
  padding: 28px 30px 56px;
}
.reader-hero {
  align-items: center;
  background: rgba(255,253,248,.82);
  border: 1px solid rgba(230,220,205,.9);
  border-radius: 22px;
  box-shadow: 0 16px 36px rgba(74,55,38,.08);
  display: flex;
  gap: 18px;
  justify-content: space-between;
  margin: 0 auto 24px;
  max-width: 1120px;
  padding: 24px 26px;
}
.eyebrow {
  color: #1f6f63;
  font-size: 12px;
  font-weight: 760;
  letter-spacing: 0;
  margin: 0 0 8px;
  text-transform: uppercase;
}
h1 {
  font-size: clamp(34px, 5vw, 56px);
  letter-spacing: 0;
  line-height: .96;
  margin: 0;
}
.reader-hero p {
  color: var(--reader-muted);
  margin: 12px 0 0;
}
.top-actions {
  display: flex;
  gap: 8px;
}
.top-actions a {
  background: #fff;
  border: 1px solid var(--reader-line);
  border-radius: 999px;
  color: #2d4944;
  font-size: 14px;
  font-weight: 680;
  padding: 9px 14px;
  text-decoration: none;
}
.source-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 0 auto 34px;
  max-width: 1120px;
}
.source-pill {
  align-items: center;
  background: rgba(255,253,248,.9);
  border: 1px solid var(--reader-line);
  border-radius: 16px;
  box-shadow: 0 10px 24px rgba(74,55,38,.07);
  display: flex;
  gap: 12px;
  padding: 10px 12px 10px 16px;
}
.source-pill span {
  font-weight: 680;
}
.source-pill small {
  color: var(--reader-muted);
  font-size: 12px;
}
.book-grid {
  display: grid;
  gap: 34px 30px;
  grid-template-columns: repeat(auto-fill, minmax(178px, 1fr));
  margin: 0 auto;
  max-width: 1120px;
}
.book-card {
  cursor: pointer;
  min-width: 0;
  text-align: center;
  transition: transform .18s ease;
}
.book-card:hover {
  transform: translateY(-5px);
}
.book-cover-wrap {
  filter: drop-shadow(0 20px 18px rgba(58,43,31,.2));
  margin: 0 auto 17px;
  max-width: 148px;
  perspective: 900px;
}
.book-cover {
  aspect-ratio: .72;
  border-radius: 5px 13px 13px 5px;
  box-shadow: inset 11px 0 18px rgba(0,0,0,.24), inset -1px 0 rgba(255,255,255,.35);
  color: #fff;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
  padding: 18px 16px 16px;
  position: relative;
  transform: rotateY(-7deg);
}
.book-cover::before {
  background: linear-gradient(90deg, rgba(255,255,255,.24), transparent 26%), radial-gradient(circle at 74% 16%, rgba(255,255,255,.22), transparent 22%);
  content: "";
  inset: 0;
  position: absolute;
}
.book-cover::after {
  background: rgba(255,255,255,.24);
  content: "";
  inset: 0 auto 0 16px;
  position: absolute;
  width: 1px;
}
.book-cover-title,
.book-cover-author {
  position: relative;
  z-index: 1;
}
.book-cover-title {
  font-size: 16px;
  font-weight: 780;
  line-height: 1.16;
}
.book-cover-author {
  font-size: 12px;
  opacity: .84;
}
.book-title {
  font-size: 17px;
  font-weight: 760;
  line-height: 1.22;
  margin: 0 0 5px;
}
.book-author {
  color: var(--reader-muted);
  font-size: 14px;
  margin: 0 0 7px;
}
.book-summary {
  color: #756f66;
  display: -webkit-box;
  font-size: 13px;
  line-height: 1.42;
  margin: 0 auto 8px;
  max-width: 210px;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
.book-foot {
  color: #91887b;
  display: flex;
  font-size: 12px;
  gap: 8px;
  justify-content: center;
}
.progress-block {
  margin: 10px auto 0;
  max-width: 150px;
}
.progress-bar {
  background: rgba(35,31,27,.1);
  border-radius: 999px;
  height: 4px;
  overflow: hidden;
}
.progress-bar span {
  background: var(--reader-accent);
  display: block;
  height: 100%;
}
@media (max-width: 720px) {
  .reader-page { padding: 18px 16px 42px; }
  .reader-hero { align-items: flex-start; display: block; }
  .top-actions { margin-top: 16px; }
  .book-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
`;

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
          <style>{bookshelfStyles}</style>
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
        <style>{bookshelfStyles}</style>
        <header class='reader-hero'>
          <div>
            <p class='eyebrow'>OpenElement Reader</p>
            <h1>My Bookshelf</h1>
            <p>
              Calm local PDF reading across fixtures, folders, and GitHub repositories.
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
