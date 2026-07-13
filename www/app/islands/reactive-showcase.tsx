/**
 * Reactive DSD Showcase — OpenElement + Signals (v0.21)
 *
 * Demonstrates three core Reactive DSD patterns:
 *   1. Counter with signal() — fine-grained reactivity
 *   2. Theme toggle with signal() — attribute/property binding
 *   3. Live filter with signal() — computed display
 *
 * v0.24.1: Migrated from html`` template to JSX (ADR-0057).
 * v0.28: G5 fix — data-signal-attr for theme attribute binding.
 *   Replaces manual computed() in prop with data-signal + data-signal-attr.
 *
 * Zero framework runtime — pure DSD + Signals.
 * Replaces Lit Island pattern with Ocean (OpenElement) reactivity.
 */
import { defineCustomElement } from '@openelement/element';
import { OpenElement } from '@openelement/element';
import { defineIslandConfig } from '@openelement/app';
import { computed, signal } from '@openelement/element';
import { StyleSheet } from '@openelement/element';

export const tagName = 'reactive-showcase';
export const openElement = defineIslandConfig({ hydrate: 'idle', ssr: true, dsd: true });

const showcaseStyles = new StyleSheet();
showcaseStyles.replaceSync(`
  :host { display: block; }
  .showcase { display: flex; flex-direction: column; gap: var(--size-4); }
  .card {
    padding: var(--size-4);
    border: var(--border-size-1) solid var(--gray-3);
    border-radius: var(--radius-2);
    background: var(--gray-0);
  }
  .card h3 { margin: 0 0 var(--size-2); font-size: var(--font-size-1); }
  .card p { margin: 0 0 var(--size-2); color: var(--gray-6); font-size: var(--font-size-00); }

  /* Counter */
  .counter-row { display: inline-flex; align-items: center; gap: var(--size-2); }
  .counter-row span { font-size: var(--font-size-3); font-weight: var(--font-weight-7); min-width: 3rem; text-align: center; }
  .counter-row button {
    width: 2.5rem; height: 2.5rem; border: var(--border-size-1) solid var(--gray-4); border-radius: var(--radius-round);
    background: var(--gray-0); font-size: var(--font-size-2); cursor: pointer; display: flex;
    align-items: center; justify-content: center; transition: background 0.15s;
  }
  .counter-row button:hover { background: var(--gray-2); }

  /* Theme */
  .theme-preview {
    padding: var(--size-4); border-radius: var(--radius-2); transition: 0.3s;
  }
  .theme-preview[data-theme="light"] { background: var(--gray-0); color: var(--gray-9); border: var(--border-size-1) solid var(--gray-3); }
  .theme-preview[data-theme="dark"]  { background: var(--gray-12); color: var(--gray-2); border: var(--border-size-1) solid var(--gray-10); }
  .theme-preview button {
    padding: var(--size-1) var(--size-3); border: none; border-radius: var(--radius-1);
    cursor: pointer; font-size: var(--font-size-00); font-weight: var(--font-weight-6);
  }
  .theme-preview[data-theme="light"] button { background: var(--gray-9); color: var(--gray-0); }
  .theme-preview[data-theme="dark"]  button { background: var(--gray-2); color: var(--gray-9); }

  /* Filter */
  .filter-input {
    width: 100%; padding: var(--size-2) var(--size-3); border: var(--border-size-1) solid var(--gray-4);
    border-radius: var(--radius-1); font-size: var(--font-size-00); box-sizing: border-box;
  }
  .filter-input:focus { outline: 2px solid var(--indigo-5); outline-offset: -1px; }
  .item-list { margin-top: var(--size-2); display: flex; flex-direction: column; gap: var(--size-1); }
  .item-list div {
    padding: var(--size-1) var(--size-2); border-radius: var(--radius-1);
    background: var(--gray-1); font-size: var(--font-size-00);
  }
`);

const FRAMEWORKS = [
  'openElement',
  'Astro',
  'Fresh',
  'Next.js',
  'Nuxt',
  'SvelteKit',
  'Remix',
  'Qwik',
  'SolidStart',
  'Enhance',
  'Hono',
  'Eleventy',
];

export default class ReactiveShowcase extends OpenElement {
  static override styles = [showcaseStyles];

  #count = signal(0);
  #isDark = signal(false);
  #filter = signal('');
  #filtered = computed(() =>
    FRAMEWORKS.filter((f) => f.toLowerCase().includes(this.#filter.value.toLowerCase()))
  );
  /** v0.28 (G5): Computed theme string for data-signal-attr binding. */
  #theme = computed(() => this.#isDark.value ? 'dark' : 'light');
  /** v0.28: Button label — separate signal to avoid textContent conflict with theme. */
  #buttonLabel = computed(() => `Toggle ${this.#isDark.value ? 'light' : 'dark'}`);

  constructor() {
    super();
    this.registerSignal('count', this.#count);
    this.registerSignal('isDark', this.#isDark);
    this.registerSignal('theme', this.#theme);
    this.registerSignal('buttonLabel', this.#buttonLabel);
  }

  override render() {
    return (
      <div className='showcase'>
        {/* Counter: signal + fine-grained binding */}
        <div className='card'>
          <h3>Signal Counter</h3>
          <p>
            A single <code>signal(0)</code> drives this counter. No Lit, no React, no framework.
          </p>
          <div className='counter-row'>
            <button type='button' onClick={() => this.decrement()}>−</button>
            <span data-signal='count'></span>
            <button type='button' onClick={() => this.increment()}>+</button>
          </div>
        </div>

        {/* Theme: signal + data-signal-attr attribute binding (v0.28 G5 fix) */}
        <div className='card'>
          <h3>Theme Preview</h3>
          <p>
            One <code>signal(false)</code>{' '}
            controls the entire component theme. Reactive attribute binding via{' '}
            <code>data-signal-attr</code>.
          </p>
          <div
            class='theme-preview'
            data-signal='theme'
            data-signal-attr='data-theme'
          >
            <p>
              Current theme: <strong data-signal='theme'></strong>
            </p>
            <button
              type='button'
              onClick={() => this.toggleTheme()}
              data-signal='buttonLabel'
            >
            </button>
          </div>
        </div>

        {/* Filter: signal + computed */}
        <div className='card'>
          <h3>
            Live Filter (<code>computed</code>)
          </h3>
          <p>
            A <code>computed()</code> signal filters a list in real-time. Zero DOM diffing overhead.
          </p>
          <input
            className='filter-input'
            placeholder='Type to filter frameworks...'
            onInput={(e: Event) => this._onFilterInput(e)}
          />
          <div className='item-list'>
            {this.#filtered.value.map((f) => <div key={f}>{f}</div>)}
          </div>
        </div>
      </div>
    );
  }

  decrement() {
    this.#count.value--;
  }
  increment() {
    this.#count.value++;
  }
  toggleTheme() {
    this.#isDark.value = !this.#isDark.value;
  }
  _onFilterInput(e: Event) {
    this.#filter.value = (e.target as HTMLInputElement).value;
  }
}

defineCustomElement(tagName, ReactiveShowcase);
