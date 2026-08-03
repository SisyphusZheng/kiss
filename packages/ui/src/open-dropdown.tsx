/** @jsxImportSource @openelement/element */
/**
 * @openelement/ui - open-dropdown
 * Popover-API dropdown with CSS Anchor Positioning placement.
 * The content is a native popover (top layer, built-in light dismiss and
 * focus return); placement anchors to the host, no hand-rolled fallback.
 *
 * @slot trigger - Control used to toggle the dropdown
 * @slot - Dropdown content
 * @csspart trigger - Trigger wrapper
 * @csspart content - Popover content
 */
import { OpenElement, type StyleSheetLike } from '@openelement/element';
import { overlayRecipe, recipe, type RenderResult } from './component-recipes.ts';

export const tagName = 'open-dropdown';

const sheet: StyleSheetLike = recipe(`
  :host {
    display: inline-block;
    anchor-name: --open-dropdown-trigger;
  }

  .trigger {
    display: contents;
  }

  .content {
    /* The base inset is the placement fallback for engines without CSS Anchor
       Positioning; it must stay present because Firefox's anchor resolution
       only applies anchor() longhands on top of an explicit inset. */
    position: absolute;
    inset: 100% auto auto 0;
    position-anchor: --open-dropdown-trigger;
    top: anchor(bottom);
    left: anchor(left);
    min-width: 12rem;
    /* The gap rides on margin-top: calc(anchor() + length) resolves without
       the added length in Firefox. */
    margin: var(--size-2) 0 0;
    padding: var(--size-2);
    font-family: var(--font-sans);
  }
`);

export class OpenDropdown extends OpenElement {
  static override styles = [overlayRecipe, sheet];

  // A mouse click on the trigger is preceded by a pointerdown that natively
  // light-dismisses an open popover; the click that follows must not re-open
  // it. Keyboard/programmatic clicks have no pointerdown and toggle normally.
  private _openAtTriggerPointerDown = false;

  private _onTriggerPointerDown(): void {
    const content = this.shadowRoot?.querySelector<HTMLElement>('.content');
    this._openAtTriggerPointerDown = content?.matches(':popover-open') ?? false;
  }

  private _toggle(): void {
    if (this._openAtTriggerPointerDown) {
      this._openAtTriggerPointerDown = false;
      return;
    }
    const content = this.shadowRoot?.querySelector<HTMLElement>('.content');
    content?.togglePopover();
  }

  override render(): RenderResult {
    return (
      <div>
        <span
          className='trigger'
          part='trigger'
          onPointerDown={() => this._onTriggerPointerDown()}
          onClick={() => this._toggle()}
        >
          <slot name='trigger'></slot>
        </span>
        <div className='overlay content' part='content' popover='auto'>
          <slot></slot>
        </div>
      </div>
    );
  }
}
