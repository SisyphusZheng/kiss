/**
 * WWW search island.
 *
 * Full-text search using Pagefind (ADR-0123 item 17, #867).
 * Loads the build-time Pagefind index emitted to /pagefind by
 * www/build-pagefind.ts and performs client-side search.
 * Triggered by Cmd+K or clicking the search icon.
 *
 * v0.30.1 (ADR-0081): dynamic results are VNodes, and events are JSX handlers.
 * Text escaping is owned by JSX, so this island does not manually concatenate
 * HTML or import escape helpers.
 *
 * @csspart trigger - The search trigger button
 * @csspart icon - The search SVG icon
 * @csspart label - The "Search" text span
 * @csspart shortcut - The keyboard shortcut kbd
 */

import { defineCustomElement } from '@openelement/element';
import { OpenElement } from '@openelement/element';
import type { VNode } from '@openelement/element';
import { defineIslandConfig } from '@openelement/app';
import { computed, signal } from '@openelement/element';
import { StyleSheet } from '@openelement/element';

interface SearchEntry {
  path: string;
  title: string;
  section: string;
  text: string;
}

interface PagefindResultData {
  url: string;
  meta?: { title?: string };
  excerpt?: string;
}

interface PagefindSearchResult {
  data: () => Promise<PagefindResultData>;
}

interface PagefindModule {
  init?: () => Promise<void>;
  search: (query: string) => Promise<{ results: PagefindSearchResult[] }>;
}

export const tagName = 'open-search';
export const openElement = defineIslandConfig({ hydrate: 'load', ssr: true, dsd: true });

const sheet = new StyleSheet();
sheet.replaceSync(`
  :host {
    display: inline-flex;
    align-items: center;
    contain: none;
  }

  .search-trigger {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--size-9);
    height: var(--size-9);
    padding: 0;
    border: 0;
    border-radius: var(--radius-round);
    background: transparent;
    color: var(--text-primary);
    font-size: var(--font-size-00);
    font-weight: var(--font-weight-7);
    letter-spacing: 0;
    box-shadow: none;
    cursor: pointer;
    transition: all var(--ease-2) var(--duration-2);
  }
  .search-trigger:hover {
    color: var(--brand);
    border-color: transparent;
    background: color-mix(in srgb, var(--brand-pale) 34%, transparent);
  }
  .search-trigger kbd {
    font-family: inherit;
    padding: var(--size-1) var(--size-1);
    border: var(--border-size-1) solid var(--border);
    border-radius: var(--radius-1);
    font-size: var(--font-size-00);
    margin-left: var(--size-1);
  }
  .search-trigger span, .search-trigger kbd { display: none; }
  .search-icon { display: inline-block; width: var(--size-5); height: var(--size-5); }

  .overlay {
    position: fixed;
    inset: 0;
    z-index: 99999;
    width: 100vw;
    height: 100vh;
    max-width: none;
    max-height: none;
    margin: 0;
    padding: 15vh 0 0;
    border: 0;
    color: inherit;
    background: color-mix(in srgb, var(--gray-12) 44%, transparent);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    display: none;
    justify-content: center;
    align-items: flex-start;
    box-sizing: border-box;
  }
  .overlay.open {
    display: flex;
  }
  .panel {
    width: 100%;
    max-width: 560px;
    max-height: 70vh;
    margin: 0 var(--size-4);
    background: var(--gray-0);
    border: var(--border-size-1) solid var(--border);
    border-radius: var(--radius-4);
    box-shadow: 0 var(--size-4) var(--size-16) color-mix(in srgb, var(--brand) 18%, transparent);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .search-input {
    width: 100%;
    padding: var(--size-3) var(--size-3);
    border: none;
    border-bottom: 0.5px solid var(--gray-3);
    background: transparent;
    color: var(--gray-10);
    font-size: var(--font-size-1);
    outline: none;
    box-sizing: border-box;
    font-family: inherit;
  }
  .results {
    flex: 1;
    overflow-y: auto;
    padding: var(--size-3) 0;
  }
  .item {
    display: block;
    padding: var(--size-3) var(--size-3);
    text-decoration: none;
    color: inherit;
    transition: background var(--ease-2) var(--duration-2);
    cursor: pointer;
  }
  .item:hover { background: var(--gray-2); }
  .item-section {
    font-size: var(--font-size-00);
    text-transform: uppercase;
    letter-spacing: var(--font-letterspacing-5);
    color: var(--gray-6);
    margin-bottom: var(--size-1);
  }
  .item-title {
    font-size: var(--font-size-0);
    font-weight: var(--font-weight-5);
    color: var(--gray-10);
    margin-bottom: var(--size-1);
  }
  .item-text {
    font-size: var(--font-size-0);
    color: var(--gray-7);
    line-height: var(--font-lineheight-3);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .empty {
    padding: var(--size-9) var(--size-3);
    text-align: center;
    color: var(--gray-5);
    font-size: var(--font-size-0);
  }
`);

export default class OpenSearch extends OpenElement {
  static override styles = [sheet];

  // ── Signals ──────────────────────────────────────────────────────────────

  #open = signal(false);
  #query = signal('');
  #results = signal<SearchEntry[]>([]);
  #indexMissing = signal(false);

  /** v0.28: Computed overlay class string for data-signal-attr binding. */
  #overlayClass = computed(() => this.#open.value ? 'overlay open' : 'overlay');

  /** v0.30.1 (ADR-0081): Computed results VNodes for data-signal-render binding. */
  #resultsNodes = computed(() => this._buildResultsNodes());

  // ── Internal state ───────────────────────────────────────────────────────

  private _pagefind: PagefindModule | null = null;
  private _loaded = false;
  private _searchSeq = 0;
  private _inputRef: HTMLInputElement | null = null;

  constructor() {
    super();
    this.registerSignal('open', this.#open);
    this.registerSignal('query', this.#query);
    this.registerSignal('overlayClass', this.#overlayClass);
    this.registerSignal('resultsNodes', this.#resultsNodes);
  }

  // ── Keyboard shortcut ────────────────────────────────────────────────────

  private _onKeydown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      this.#open.value ? this._close() : this._open();
    } else if (e.key === 'Escape' && this.#open.value) {
      this._close();
    }
  };

  override connectedCallback(): void {
    super.connectedCallback();
    globalThis.addEventListener('keydown', this._onKeydown);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    globalThis.removeEventListener('keydown', this._onKeydown);
  }

  // ── Event handlers ───────────────────────────────────────────────────────

  private _open(): void {
    this.#open.value = true;
    this._loadPagefind();
    requestAnimationFrame(() => this._focusInput());
  }

  private _close(): void {
    this.#open.value = false;
    this.#query.value = '';
    this.#results.value = [];
    this._inputRef = null;
  }

  private _closeOnBackdrop(e: Event): void {
    // Firefox shadow DOM event retargeting makes currentTarget
    // unreliable. Instead, walk composedPath to check if the click origin
    // is inside the panel. Close only when panel is not in the path.
    const path = e.composedPath();
    const inPanel = path.some((el) => (el as Element).classList?.contains('panel'));
    if (!inPanel) this._close();
  }

  private _stopPropagation(e: Event): void {
    e.stopPropagation();
  }

  private _onInput(e: Event): void {
    const target = e.target as HTMLInputElement;
    this.#query.value = target.value;
    this._runSearch();
  }

  private _focusInput(): void {
    this._inputRef ??= this.shadowRoot?.querySelector<HTMLInputElement>('.search-input') ?? null;
    this._inputRef?.focus();
  }

  // ── Search ───────────────────────────────────────────────────────────────

  private async _runSearch(): Promise<void> {
    const query = this.#query.value.trim();
    const pagefind = this._pagefind;
    if (query.length < 2 || !pagefind) {
      this.#results.value = [];
      return;
    }
    // Out-of-order guard: only the latest keystroke may publish results.
    const seq = ++this._searchSeq;
    try {
      const response = await pagefind.search(query);
      const hits = await Promise.all(response.results.slice(0, 10).map((r) => r.data()));
      if (seq !== this._searchSeq) return;
      this.#results.value = hits.map((hit) => ({
        path: hit.url,
        title: hit.meta?.title || hit.url,
        section: this._sectionFor(hit.url),
        text: this._plainExcerpt(hit.excerpt ?? ''),
      }));
    } catch {
      // A failed chunk fetch keeps the previous result list rather than
      // blanking the overlay mid-typing.
    }
  }

  /** '/zh/guide/routing-and-data/' -> 'Guide'; '/' -> 'Home'. */
  private _sectionFor(url: string): string {
    const segments = url.split('/').filter(Boolean);
    if (segments[0] && /^[a-z]{2}$/.test(segments[0])) segments.shift();
    const first = segments[0] ?? '';
    return first ? first.charAt(0).toUpperCase() + first.slice(1) : 'Home';
  }

  /**
   * Pagefind excerpts are HTML-escaped text plus <mark> highlight tags.
   * Strip the marks and decode entities so JSX can render plain text safely.
   */
  private _plainExcerpt(excerpt: string): string {
    const entities: Record<string, string> = {
      lt: '<',
      gt: '>',
      amp: '&',
      quot: '"',
      '#39': "'",
    };
    return excerpt
      .replace(/<\/?mark>/g, '')
      .replace(/&(lt|gt|amp|quot|#39);/g, (_, name: string) => entities[name] ?? _);
  }

  // ── Index loading ────────────────────────────────────────────────────────

  private async _loadPagefind(): Promise<void> {
    if (this._loaded) return;
    this._loaded = true;
    try {
      // The Pagefind assets are emitted post-build into /pagefind, outside
      // Vite's module graph, so the specifier must stay runtime-dynamic.
      const pagefindUrl = '/pagefind/pagefind.js';
      const module = (await import(/* @vite-ignore */ pagefindUrl)) as PagefindModule;
      await module.init?.();
      this._pagefind = module;
      this.#indexMissing.value = false;
      await this._runSearch();
    } catch {
      // Dev mode (no built index) or a missing/corrupt index: keep the
      // overlay usable and surface the empty-state hint instead.
      this._loaded = false;
      this.#indexMissing.value = true;
    }
  }

  // ── VNode builder (v0.30.1 / ADR-0081) ───────────────────────────────────

  /**
   * Build results VNode array from current signals.
   * Called by the #resultsNodes computed signal — zero manual escape,
   * zero document.createElement, zero innerHTML.
   * XSS protection via JSX auto-escaping; events via VNode onClick.
   */
  private _buildResultsNodes(): VNode[] {
    const results = this.#results.value;

    if (results.length > 0) {
      return results.map((r) => (
        <a href={r.path} class='result item' onClick={() => this._close()}>
          <div class='item-section'>{r.section}</div>
          <div class='item-title'>{r.title}</div>
          <div class='item-text'>{r.text}</div>
        </a>
      ));
    }

    if (this.#indexMissing.value) {
      return [
        <div key='empty-index-missing' class='empty'>
          Search index not found — run deno task build to generate it
        </div>,
      ];
    }

    if (this.#query.value.length >= 2) {
      return [
        <div key='empty-no-results' class='empty'>
          No results found for &ldquo;{this.#query.value}&rdquo;
        </div>,
      ];
    }

    return [<div key='empty-min-query' class='empty'>Type at least 2 characters to search</div>];
  }

  // ── Render ───────────────────────────────────────────────────────────────

  override render() {
    return (
      <>
        <button
          type='button'
          class='search-trigger'
          part='trigger'
          aria-label='Search'
          onClick={() => this._open()}
        >
          <svg
            class='search-icon'
            part='icon'
            viewBox='0 0 16 16'
            fill='none'
            stroke='currentColor'
            stroke-width='1.5'
            stroke-linecap='round'
          >
            <circle cx='7' cy='7' r='4.5' />
            <path d='M10.5 10.5L14 14' />
          </svg>
          <span part='label'>Search</span>
          <kbd part='shortcut'>&#x2318;K</kbd>
        </button>

        <div
          class='overlay'
          data-signal='overlayClass'
          data-signal-attr='class'
          onClick={(e: Event) => this._closeOnBackdrop(e)}
        >
          <div class='panel' onClick={(e: Event) => this._stopPropagation(e)}>
            <input
              type='text'
              class='search-input'
              placeholder='Search documentation...'
              onInput={(e: Event) => this._onInput(e)}
              ref={(el: HTMLInputElement) => {
                this._inputRef = el;
              }}
            />
            <div class='results' data-signal-render='resultsNodes' />
          </div>
        </div>
      </>
    );
  }
}

defineCustomElement(tagName, OpenSearch);
