/** @jsxImportSource @openelement/core */
import { OpenElement } from '@openelement/element';
import type { ReaderSearchResult } from '../app/types.ts';
import { searchLibrary } from '../app/api.ts';
import { navigate } from '../router.ts';

export interface SearchData {
  query: string;
  results: ReaderSearchResult[];
}

export function loader(
  ctx: { params: Record<string, string> },
): Promise<SearchData> {
  const query = (ctx.params.q || '').trim();
  if (!query) return Promise.resolve({ query, results: [] });
  return searchLibrary(query).then((results) => ({ query, results }));
}

export const tagName = 'reader-search';

export default class SearchPage extends OpenElement {
  override render() {
    const data = (this as unknown) as SearchPage & SearchData;
    const query = data.query || '';
    const results = data.results || [];

    if (!query) {
      return (
        <div>
          <h1>Search</h1>
          <search-box-island query={query} />
          <p class='empty-state'>
            Enter a search term. Try title, note, author, or indexed PDF text.
          </p>
        </div>
      );
    }

    if (results.length === 0) {
      return (
        <div>
          <h1>Search</h1>
          <search-box-island query={query} />
          <p class='search-term'>Results for: "{query}"</p>
          <p class='empty-state'>No results for '{query}'</p>
        </div>
      );
    }

    return (
      <div>
        <h1>Search</h1>
        <search-box-island query={query} />
        <p class='search-term'>Results for: "{query}"</p>
        <div class='search-results'>
          {results.map((result) => (
            <open-card
              key={`${result.source}:${result.bookId}:${result.page ?? 0}:${result.snippet}`}
              class='search-result-card'
              onClick={() =>
                navigate(
                  `/books/${result.bookId}${result.page ? `?page=${result.page}` : ''}`,
                )}
            >
              <p class='eyebrow'>
                {result.source}
                {result.page ? ` · page ${result.page}` : ''}
              </p>
              <h2 class='book-title'>{result.title}</h2>
              {result.author && <p class='book-author'>{result.author}</p>}
              <p class='book-summary'>{result.snippet}</p>
            </open-card>
          ))}
        </div>
      </div>
    );
  }
}
customElements.define(tagName, SearchPage);
