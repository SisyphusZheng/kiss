import { defineIslandConfig } from '@openelement/app';
import { defineCustomElement } from '@openelement/core';
import { consumeContext } from '@openelement/core';
import { StyleSheet } from '@openelement/core/style-sheet';
import { OpenElement } from '@openelement/element';
import { signal } from '@openelement/signal';
import { openPropsTokenSheet } from '@openelement/ui';
import { THEME_CTX } from '@openelement/ui/open-layout';

export const tagName = 'home-console';
export const openElement = defineIslandConfig({ hydrate: 'idle', ssr: true, dsd: true });

const styles = new StyleSheet();
styles.replaceSync(`
  :host {
    display: block;
    min-width: 0;
  }

  * {
    box-sizing: border-box;
  }

  .panel {
    display: grid;
    min-height: 100%;
    overflow: hidden;
    border: var(--border-size-1) solid var(--code-border);
    border-radius: var(--radius-1);
    background: var(--bg-code);
    color: var(--code-text);
  }

  .rp-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--size-3);
    padding: var(--size-3) var(--size-4);
    border-bottom: var(--border-size-1) solid var(--code-border);
    background: color-mix(in srgb, var(--bg-code) 82%, var(--code-border));
  }

  .rp-title {
    overflow: hidden;
    color: var(--brand);
    font-family: var(--font-mono);
    font-size: var(--font-size-00);
    font-weight: var(--font-weight-8);
    letter-spacing: 0;
    text-overflow: ellipsis;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .pane {
    display: grid;
    align-content: center;
    gap: var(--size-4);
    padding: var(--size-5) var(--size-4);
  }

  .counter-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--size-3);
  }

  .counter-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--size-8);
    height: var(--size-8);
    padding: 0;
    border: var(--border-size-1) solid var(--code-border);
    border-radius: var(--radius-1);
    background: color-mix(in srgb, var(--bg-code) 78%, var(--code-border));
    color: var(--code-text);
    cursor: pointer;
    font-size: var(--font-size-3);
    font-weight: var(--font-weight-7);
    transition:
      transform var(--duration-2) var(--ease-2),
      border-color var(--duration-2) var(--ease-2),
      background var(--duration-2) var(--ease-2);
  }

  .counter-btn:hover {
    transform: translateX(var(--size-1));
    border-color: var(--brand);
    background: var(--brand);
    color: var(--on-brand);
  }

  .counter-btn:focus-visible {
    outline: var(--border-size-2) solid var(--brand);
    outline-offset: var(--size-1);
  }

  .counter-value {
    min-width: var(--size-16);
    padding: 0 var(--size-7);
    color: var(--code-text);
    font-size: var(--font-size-5);
    font-variant-numeric: tabular-nums;
    font-weight: var(--font-weight-9);
    text-align: center;
  }

  .counter-caption {
    margin: 0;
    color: color-mix(in srgb, var(--code-text) 66%, transparent);
    font-family: var(--font-mono);
    font-size: var(--font-size-00);
    line-height: var(--font-lineheight-3);
    text-align: center;
  }

  .counter-caption b {
    color: var(--brand);
    font-weight: var(--font-weight-8);
  }

  @media (max-width: 768px) {
    .counter-value {
      padding-inline: var(--size-4);
    }
  }
`);

export default class HomeConsole extends OpenElement {
  static override styles = [openPropsTokenSheet, styles];
  #count = signal(42);

  constructor() {
    super();
    this.registerSignal('count', this.#count);
  }

  override connectedCallback() {
    super.connectedCallback();
    const theme = consumeContext(THEME_CTX);
    this.setAttribute('data-theme', theme.value);
    theme.subscribe((t) => this.setAttribute('data-theme', t));
  }

  override render() {
    return (
      <div class='panel'>
        <div class='rp-header'>
          <span class='rp-title'>LIVE VERIFICATION CONSOLE</span>
        </div>
        <div class='pane'>
          <div class='counter-row'>
            <button type='button' class='counter-btn' onClick={() => this.decrement()}>-</button>
            <span class='counter-value' data-signal='count' textContent={this.#count}></span>
            <button type='button' class='counter-btn' onClick={() => this.increment()}>+</button>
          </div>
          <p class='counter-caption'>
            <b>METRICS</b> packages verified: <b data-signal='count' textContent={this.#count}></b>
          </p>
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
}

defineCustomElement(tagName, HomeConsole);
