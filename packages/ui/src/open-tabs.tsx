/** @jsxImportSource @openelement/core */
/**
 * @openelement/ui - open-tabs
 *
 * DaisyUI-style tabs using DsdElement + Signals.
 * Reads light DOM children with `slot="tab"` and `slot="panel"`
 * to render tab buttons and panel content.
 *
 * Usage:
 * ```html
 * <open-tabs>
 *   <span slot="tab">Tab 1</span>
 *   <span slot="tab">Tab 2</span>
 *   <div slot="panel">Panel 1 content</div>
 *   <div slot="panel">Panel 2 content</div>
 * </open-tabs>
 * ```
 *
 * @slot tab - Tab button labels (multiple)
 * @slot panel - Tab panel content (multiple, one per tab)
 */

import { OpenElement, type VNode } from '@openelement/element';
import { signal } from '@openelement/signal';
import { daisyClassSheet } from './daisy-classes.ts';

export const tagName = 'open-tabs';

export class OpenTabs extends OpenElement {
  static override styles = [daisyClassSheet];
  #active = signal(0);

  #select(idx: number): void {
    this.#active.value = idx;
    this.update();
  }

  override render(): VNode {
    const tabs = this.querySelectorAll<HTMLElement>('[slot="tab"]');
    const panels = this.querySelectorAll<HTMLElement>('[slot="panel"]');
    const active = this.#active.value;

    return (
      <div>
        <div class='tabs'>
          {Array.from(tabs).map((tab, i) => (
            <button
              type='button'
              class={`tab ${i === active ? 'tab-active' : ''}`}
              onClick={() => this.#select(i)}
            >
              {tab.textContent}
            </button>
          ))}
        </div>
        <div>
          {Array.from(panels).map((panel, i) => (
            <div style={{ display: i === active ? 'block' : 'none' }}>{panel.innerHTML}</div>
          ))}
        </div>
      </div>
    );
  }
}

export default OpenTabs;

// Guard: idempotent across SSR paths
if (typeof customElements !== 'undefined' && !customElements.get(tagName)) {
  customElements.define(tagName, OpenTabs);
}
