/** @jsxImportSource @openelement/element */
import { defineIslandConfig } from '@openelement/app';
import { OpenElement, signal, StyleSheet } from '@openelement/element';

export const tagName = 'my-counter';
export const openElement = defineIslandConfig({ hydrate: 'idle', ssr: true, dsd: true });

const sheet = new StyleSheet();
sheet.replaceSync(`
  :host { display: inline-flex; gap: 0.75rem; align-items: center; }
  button {
    width: 2rem; height: 2rem; border: 1px solid var(--line); border-radius: 6px;
    background: #fff; color: var(--ink); font-size: 1rem; line-height: 1; cursor: pointer;
    transition: border-color 0.15s ease, color 0.15s ease;
  }
  button:hover { border-color: var(--brand); color: var(--brand); }
  span { min-width: 2ch; text-align: center; font-variant-numeric: tabular-nums; font-weight: 600; }
`);

export default class MyCounter extends OpenElement {
  static override styles = [sheet];

  #count = signal(0);

  constructor() {
    super();
    this.registerSignal('count', this.#count);
  }

  override render() {
    return (
      <>
        <button type='button' onClick={() => this.#count.value--}>-</button>
        <span data-signal='count'></span>
        <button type='button' onClick={() => this.#count.value++}>+</button>
      </>
    );
  }
}
