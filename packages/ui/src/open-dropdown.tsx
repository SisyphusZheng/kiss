/** @jsxImportSource @openelement/element */
/**
 * @openelement/ui - open-dropdown
 * Native Popover-first dropdown with a small fallback state.
 *
 * @slot trigger - Control used to toggle the dropdown
 * @slot - Dropdown content
 * @csspart trigger - Trigger wrapper
 * @csspart content - Popover content
 */
import { OpenElement, StyleSheet, type StyleSheetLike, type VNode } from '@openelement/element';
import { overlayRecipe } from './component-recipes.ts';

export const tagName = 'open-dropdown';

const sheet: StyleSheetLike = new StyleSheet();
sheet.replaceSync(`
  :host { display:inline-block; position:relative; }
  .trigger { display:contents; }
  .content {
    position:absolute;
    inset:calc(100% + var(--size-2)) auto auto 0;
    z-index:1000;
    min-width:12rem;
    margin:0;
    padding:var(--size-2);
    font-family:var(--font-sans);
  }
  .content:not(:popover-open) { display:none; }
  :host([data-open]) .content { display:block; }
  @supports (position-anchor: --open-dropdown-trigger) {
    .trigger { anchor-name:--open-dropdown-trigger; }
    .content { position-anchor:--open-dropdown-trigger; top:anchor(bottom); left:anchor(left); }
  }
`);

export class OpenDropdown extends OpenElement {
  static override styles = [overlayRecipe, sheet];

  #toggle(): void {
    const content = this.shadowRoot?.querySelector<HTMLElement>('.content');
    if (!content) return;
    if (typeof content.togglePopover === 'function') {
      content.togglePopover();
      this.toggleAttribute('data-open', content.matches(':popover-open'));
      return;
    }
    this.toggleAttribute('data-open');
  }

  #close(): void {
    const content = this.shadowRoot?.querySelector<HTMLElement>('.content');
    if (content && typeof content.hidePopover === 'function' && content.matches(':popover-open')) {
      content.hidePopover();
    }
    this.removeAttribute('data-open');
  }

  override render(): VNode {
    return (
      <div>
        <span class='trigger' part='trigger' onClick={() => this.#toggle()}>
          <slot name='trigger'></slot>
        </span>
        <div
          class='overlay content'
          part='content'
          popover='auto'
          onToggle={(event: Event) => {
            const state = (event as ToggleEvent).newState;
            this.toggleAttribute('data-open', state === 'open');
          }}
          onKeyDown={(event: KeyboardEvent) => {
            if (event.key === 'Escape') this.#close();
          }}
        >
          <slot></slot>
        </div>
      </div>
    );
  }
}
