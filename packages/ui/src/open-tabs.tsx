/** @jsxImportSource @openelement/element */
/** @openelement/ui - open-tabs */
import { OpenElement, StyleSheet, type StyleSheetLike, type VNode } from '@openelement/element';
import { signal } from '@openelement/element';
import { controlRecipe } from './component-recipes.ts';

export const tagName = 'open-tabs';
const sheet: StyleSheetLike = new StyleSheet();
sheet.replaceSync(`
  :host{display:block}.tabs{display:flex;gap:var(--size-1);padding:var(--size-1);border-bottom:1px solid var(--surface-border)}
  .tab{padding:var(--size-2) var(--size-4);border-color:transparent;background:transparent;color:var(--text-secondary);cursor:pointer}
  .tab:hover{color:var(--text-primary)}.tab-active{color:var(--text-primary);background:var(--brand-subtle);border-color:var(--surface-border-strong)}
  [role="tabpanel"]{padding-block:var(--size-4);color:var(--text-secondary)}
`);

export class OpenTabs extends OpenElement {
  static override styles = [controlRecipe, sheet];
  #active = signal(0);
  #select(idx: number): void {
    this.#active.value = idx;
    this.update();
  }
  override render(): VNode {
    const tabs = [...this.querySelectorAll<HTMLElement>('[slot="tab"]')];
    const panels = [...this.querySelectorAll<HTMLElement>('[slot="panel"]')];
    return (
      <div>
        <div class='tabs' role='tablist'>
          {tabs.map((tab, i) => (
            <button
              type='button'
              role='tab'
              aria-selected={i === this.#active.value ? 'true' : 'false'}
              class={`control tab ${i === this.#active.value ? 'tab-active' : ''}`}
              onClick={() => this.#select(i)}
            >
              {tab.textContent}
            </button>
          ))}
        </div>
        {panels.map((panel, i) => (
          <div role='tabpanel' hidden={i !== this.#active.value}>{panel.textContent}</div>
        ))}
      </div>
    );
  }
}
