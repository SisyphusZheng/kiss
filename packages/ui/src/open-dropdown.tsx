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
import { nextInstanceId, overlayRecipe, recipe, type RenderResult } from './component-recipes.ts';

export const tagName = 'open-dropdown';

const sheet: StyleSheetLike = recipe(`
  :host {
    display: inline-block;
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

  // #1061: every instance anchors its popover to its own host — with one
  // shared `--open-dropdown-trigger` anchor name, every popover on the page
  // resolved to the last host in document order. The render() inline style
  // keeps the SSR markup positionable; connectedCallback rewrites both
  // halves with the client-side name.
  private _anchorName = `--open-dropdown-trigger-${nextInstanceId()}`;

  override connectedCallback(): void {
    super.connectedCallback();
    this._syncAnchorName();
  }

  // Both anchor halves must hold a name from the same realm. The render()
  // inline style bakes the server counter into DSD and hydration preserves
  // that DOM, while the host half only exists once connectedCallback runs —
  // and the module-level instance counter does not count in the same order
  // on both sides (SSG renders every page in one process, island hydration
  // order is not document order), so the two values diverge on multi-page
  // sites and the popover loses its anchor. Rewriting both here makes the
  // client value win on both ends; on CSR it re-applies the same value
  // render() already baked.
  private _syncAnchorName(): void {
    this.style.setProperty('anchor-name', this._anchorName);
    this.shadowRoot?.querySelector<HTMLElement>('.content')
      ?.style.setProperty('position-anchor', this._anchorName);
  }

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
        <div
          className='overlay content'
          part='content'
          popover='auto'
          style={`position-anchor: ${this._anchorName}`}
        >
          <slot></slot>
        </div>
      </div>
    );
  }
}
