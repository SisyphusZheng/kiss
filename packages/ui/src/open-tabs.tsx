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
  /** WAI-ARIA tabs keyboard pattern: ArrowLeft/ArrowRight/Home/End. */
  #onKeydown(e: KeyboardEvent, count: number): void {
    if (count === 0) return;
    const key = e.key;
    const next = key === 'Home' ? 0 : key === 'End' ? count - 1 : key === 'ArrowLeft'
      ? (this.#active.value - 1 + count) % count : key === 'ArrowRight'
      ? (this.#active.value + 1) % count : undefined;
    if (next === undefined) return;
    e.preventDefault();
    this.#select(next);
  }
  override render(): VNode {
    const tabs = [...this.querySelectorAll<HTMLElement>('[slot="tab"]')];
    const panels = [...this.querySelectorAll<HTMLElement>('[slot="panel"]')];
    const count = Math.min(tabs.length, panels.length);
    return (
      <div>
        <div class='tabs' role='tablist' onKeydown={(e: KeyboardEvent) => this.#onKeydown(e, count)}>
          {tabs.map((tab, i) => (
            <button
              type='button'
              role='tab'
              id={`${tagName}-tab-${i}`}
              aria-selected={i === this.#active.value ? 'true' : 'false'}
              aria-controls={`${tagName}-panel-${i}`}
              aria-disabled={i >= count}
              class={`control tab ${i === this.#active.value ? 'tab-active' : ''}`}
              onClick={() => i < count && this.#select(i)}
            >
              {tab.textContent}
            </button>
          ))}
        </div>
        {panels.map((panel, i) => (
          <div
            role='tabpanel'
            id={`${tagName}-panel-${i}`}
            aria-labelledby={`${tagName}-tab-${i}`}
            hidden={i !== this.#active.value}
          >
            {panel.textContent}
          </div>
        ))}
      </div>
    );
  }
}
