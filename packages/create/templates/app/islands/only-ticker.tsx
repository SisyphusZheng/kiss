/** @jsxImportSource @openelement/element */
import { defineIslandConfig } from '@openelement/app';
import { OpenElement, signal, StyleSheet } from '@openelement/element';

export const tagName = 'only-ticker';
export const openElement = defineIslandConfig({ hydrate: 'only', ssr: false, dsd: false });

const sheet = new StyleSheet();
sheet.replaceSync(`
  :host { display: inline-flex; gap: 0.75rem; align-items: center; }
  button {
    height: 2rem; padding: 0 0.9rem; border: 1px solid var(--line); border-radius: 6px;
    background: #fff; color: var(--ink); font-size: 0.9rem; cursor: pointer;
    transition: border-color 0.15s ease, color 0.15s ease;
  }
  button:hover { border-color: var(--brand); color: var(--brand); }
  span { min-width: 2ch; text-align: center; font-variant-numeric: tabular-nums; font-weight: 600; }
`);

const tick = signal(0);

export default class OnlyTicker extends OpenElement {
  static override styles = [sheet];

  constructor() {
    super();
    this.registerSignal('tick', tick);
  }

  override render() {
    return (
      <>
        <span data-signal='tick'></span>
        <button type='button' onClick={() => tick.value++}>tick</button>
      </>
    );
  }
}
