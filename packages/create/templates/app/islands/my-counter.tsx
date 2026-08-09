/** @jsxImportSource @openelement/element */
import { defineIslandConfig } from '@openelement/app';
import { OpenElement, signal, StyleSheet } from '@openelement/element';

export const tagName = 'my-counter';
export const openElement = defineIslandConfig({ hydrate: 'idle', ssr: true, dsd: true });

const sheet = new StyleSheet();
sheet.replaceSync(`
  :host { display: inline-flex; gap: 0.5rem; align-items: center; margin-top: 1rem; }
  button { padding: 0.25rem 0.75rem; cursor: pointer; }
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
