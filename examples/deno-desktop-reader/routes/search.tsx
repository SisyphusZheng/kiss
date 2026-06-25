/** @jsxImportSource @openelement/core */
import type { ReaderBook } from '../app/types.ts';
import { navigate } from '../router.ts';

// ponytail: direct import
import booksData from '../fixtures/books.json' with { type: 'json' };

export default function SearchRoute() {
  const books: ReaderBook[] = booksData as unknown as ReaderBook[];
  const params = new URLSearchParams(globalThis.location.search);
  const rawQuery = params.get('q') || '';
  const query = rawQuery.trim();

  if (!query) {
    return (
      <div>
        <h1>Search</h1>
        <p class='empty-state'>
          Enter a search term. Try /search?q=kafka
        </p>
      </div>
    );
  }

  const lowerQuery = query.toLowerCase();
  const results = books.filter(
    (book) =>
      book.title.toLowerCase().includes(lowerQuery) ||
      book.author.toLowerCase().includes(lowerQuery),
  );

  if (results.length === 0) {
    return (
      <div>
        <h1>Search</h1>
        <p class='search-term'>Results for: "{query}"</p>
        <p class='empty-state'>No results for '{query}'</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Search</h1>
      <p class='search-term'>Results for: "{query}"</p>
      <div class='search-results'>
        {results.map((book) => (
          <open-card
            key={book.id}
            class='search-result-card'
            onClick={() => navigate(`/books/${book.id}`)}
          >
            <div
              class='book-cover-sm'
              style={{ backgroundColor: book.coverColor }}
            />
            <h2 class='book-title'>{book.title}</h2>
            <p class='book-author'>{book.author}</p>
            <p class='book-summary'>{book.summary}</p>
          </open-card>
        ))}
      </div>
    </div>
  );
}
