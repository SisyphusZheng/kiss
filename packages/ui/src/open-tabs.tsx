/** @jsxImportSource @openelement/element */
/**
 * @openelement/ui - open-tabs
 *
 * WAI-ARIA tabs pattern. The slotted [slot="tab"] and [slot="panel"] elements
 * stay live in the light DOM — the component decorates them with role/aria
 * wiring instead of copying textContent into the shadow root, so child markup
 * structure and event listeners are preserved.
 *
 * Keyboard: ArrowLeft/ArrowRight move between tabs (wrapping), Home/End jump
 * to the first/last tab. Focus follows selection.
 *
 * @slot tab - Tab label element (one per panel)
 * @slot panel - Panel shown while its tab is active
 */
import { OpenElement, StyleSheet, type StyleSheetLike, type VNode } from '@openelement/element';
import { signal } from '@openelement/element';

export const tagName = 'open-tabs';
const sheet: StyleSheetLike = new StyleSheet();
sheet.replaceSync(`
  :host{display:block}.tabs{display:flex;gap:var(--size-1);padding:var(--size-1);border-bottom:1px solid var(--surface-border)}
  ::slotted([slot="tab"]){padding:var(--size-2) var(--size-4);border-color:transparent;background:transparent;color:var(--text-secondary);cursor:pointer}
  ::slotted([slot="tab"]:hover){color:var(--text-primary)}::slotted(.tab-active){color:var(--text-primary);background:var(--brand-subtle);border-color:var(--surface-border-strong)}
  ::slotted([slot="panel"]){padding-block:var(--size-4);color:var(--text-secondary)}
`);

export class OpenTabs extends OpenElement {
  static override styles = [sheet];
  #active = signal(0);
  #wiredTabs = new WeakSet<HTMLElement>();

  #tabs(): HTMLElement[] {
    return [...this.querySelectorAll<HTMLElement>('[slot="tab"]')];
  }

  #count(): number {
    return Math.min(this.#tabs().length, this.querySelectorAll('[slot="panel"]').length);
  }

  #select(idx: number): void {
    this.#active.value = idx;
    this.update();
  }

  /** WAI-ARIA tabs keyboard pattern: ArrowLeft/ArrowRight/Home/End. */
  #onKeydown(e: KeyboardEvent): void {
    const count = this.#count();
    if (count === 0) return;
    const key = e.key;
    const next = key === 'Home'
      ? 0
      : key === 'End'
      ? count - 1
      : key === 'ArrowLeft'
      ? (this.#active.value - 1 + count) % count
      : key === 'ArrowRight'
      ? (this.#active.value + 1) % count
      : undefined;
    if (next === undefined) return;
    e.preventDefault();
    this.#select(next);
    // Selection follows focus: move DOM focus onto the newly active tab.
    const tab = this.#tabs()[next];
    if (tab && typeof tab.focus === 'function') tab.focus();
  }

  /**
   * Decorate the light-DOM tabs/panels with the WAI-ARIA tabs wiring. Runs on
   * every render so aria-selected/hidden track the active index; click
   * listeners are attached only once per tab element.
   */
  #decorate(tabs: HTMLElement[], panels: HTMLElement[], count: number): void {
    const active = this.#active.value;
    tabs.forEach((tab, i) => {
      const enabled = i < count;
      tab.setAttribute('role', 'tab');
      tab.setAttribute('id', `${tagName}-tab-${i}`);
      tab.setAttribute('aria-selected', i === active && enabled ? 'true' : 'false');
      tab.setAttribute('aria-controls', `${tagName}-panel-${i}`);
      tab.setAttribute('tabindex', i === active ? '0' : '-1');
      tab.classList.toggle('tab-active', i === active);
      if (enabled) tab.removeAttribute('aria-disabled');
      else tab.setAttribute('aria-disabled', 'true');
      if (!this.#wiredTabs.has(tab)) {
        this.#wiredTabs.add(tab);
        tab.addEventListener('click', () => {
          const idx = this.#tabs().indexOf(tab);
          if (idx >= 0 && idx < this.#count()) this.#select(idx);
        });
      }
    });
    panels.forEach((panel, i) => {
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('id', `${tagName}-panel-${i}`);
      panel.setAttribute('aria-labelledby', `${tagName}-tab-${i}`);
      if (i === active) panel.removeAttribute('hidden');
      else panel.setAttribute('hidden', '');
    });
  }

  override render(): VNode {
    const tabs = this.#tabs();
    const panels = [...this.querySelectorAll<HTMLElement>('[slot="panel"]')];
    const count = Math.min(tabs.length, panels.length);
    this.#decorate(tabs, panels, count);
    return (
      <div>
        <div
          class='tabs'
          role='tablist'
          onKeydown={(e: KeyboardEvent) => this.#onKeydown(e)}
        >
          <slot name='tab'></slot>
        </div>
        <slot name='panel'></slot>
      </div>
    );
  }
}
