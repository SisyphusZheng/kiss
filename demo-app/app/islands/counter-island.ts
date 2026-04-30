import { css, html, LitElement } from '@kissjs/core';

export const tagName = 'counter-island';

export default class CounterIsland extends LitElement {
  static override styles = css`
    :host { display: inline-flex; gap: 0.75rem; align-items: center; padding: 0.75rem 1.25rem; border: 1px solid #ddd; border-radius: 8px; }
    button { width: 36px; height: 36px; border: 1px solid #ccc; border-radius: 6px; background: #f9f9f9; cursor: pointer; font-size: 1.25rem; }
    button:hover { background: #eee; }
    .value { min-width: 2rem; text-align: center; font-size: 1.25rem; font-weight: 500; font-variant-numeric: tabular-nums; }
  `;
  static override properties = { count: { type: Number } };
  count = 0;

  override render() {
    return html`
      <button @click=${() => this.count--}>−</button>
      <span class="value">${this.count}</span>
      <button @click=${() => this.count++}>+</button>
    `;
  }
}
