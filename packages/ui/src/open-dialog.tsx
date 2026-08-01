/** @jsxImportSource @openelement/element */
/**
 * @openelement/ui - open-dialog
 *
 * Dialog component using native <dialog> element + popover API.
 * Per WHATWG HTML Living Standard sections 4.11.4 (dialog) and 6.9.2 (popover).
 *
 * v0.24.1: Migrated from html`` template to JSX (ADR-0057).
 *
 * @csspart overlay - The dialog backdrop/element
 * @csspart header -The header bar
 * @csspart close -The close button
 * @csspart body -The content area (<slot>)
 * @csspart footer -The optional footer slot
 *
 * Usage:
 * ```html
 * <open-dialog>
 *   <button slot="trigger">Open Dialog</button>
 *   <div>Dialog content here</div>
 * </open-dialog>
 * ```
 */

import { OpenElement } from '@openelement/element';
import type { StyleSheetLike } from '@openelement/element';
import { overlayRecipe, recipe } from './component-recipes.ts';

export const tagName = 'open-dialog';

const sheet: StyleSheetLike = recipe(`
  :host {
    display: inline-block;
  }

  ::slotted([slot="trigger"]) {
    cursor: pointer;
  }

  dialog {
    border: var(--border-size-1) solid var(--surface-border-strong);
    border-radius: var(--overlay-radius);
    background: var(--surface-overlay);
    color: var(--text-primary);
    padding: var(--size-6);
    max-width: min(90vw, 480px);
    box-shadow: var(--surface-highlight), var(--overlay-shadow);
    font-family: var(--font-sans);
  }

  dialog::backdrop {
    background: color-mix(in srgb, var(--gray-12) 68%, transparent);
    backdrop-filter: blur(8px);
  }

  dialog[open] {
    animation: dialogFadeIn 0.2s ease-out;
  }

  @keyframes dialogFadeIn {
    from { opacity: 0; transform: translateY(-8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .dialog-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--size-4);
  }

  .dialog-title {
    font-size: var(--font-size-2);
    font-weight: var(--font-weight-6);
    color: var(--text-primary);
    margin: 0;
  }

  .dialog-close {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--text-muted);
    font-size: var(--font-size-2);
    line-height: var(--font-lineheight-1);
    padding: var(--size-1);
    border-radius: var(--radius-1);
    transition: color 0.15s ease;
  }

  .dialog-close:hover {
    color: var(--text-primary);
    background: var(--brand-subtle);
  }

  .dialog-body {
    font-size: var(--font-size-1);
    color: var(--text-secondary);
    line-height: var(--font-lineheight-3);
  }

  .dialog-footer {
    margin-top: var(--size-5);
    display: flex;
    justify-content: flex-end;
    gap: var(--size-2);
  }

  :host(:state(open)) dialog {
    display: block;
  }
`);

export class OpenDialog extends OpenElement {
  static override styles = [overlayRecipe, sheet];
  static override delegatesFocus = true;
  // Only `open` is observed: attributeChangedCallback reacts to it alone.
  // `label` is read at render time and `mode` at open time — observing them
  // was a dead listener (nothing synced on change).
  static override observedAttributes = ['open'];

  override render(): ReturnType<typeof OpenElement.prototype.render> {
    // Keep the custom state in sync on every render. When the `open`
    // attribute arrives via SSR markup, attributeChangedCallback fires at
    // upgrade time — before ElementInternals and the shadow DOM exist — so
    // the initial state would otherwise never be applied.
    this._updateStates();
    const label = this.getAttribute('label') || '';
    return (
      <>
        <slot name='trigger' onClick={() => this._handleTrigger()}></slot>
        <dialog
          open={this.hasAttribute('open') ? true : undefined}
          aria-label={this.getAttribute('label') || ''}
          part='overlay'
          onCancel={(e: Event) => this._handleCancel(e)}
          onClose={() => this._handleClose()}
        >
          <div className='dialog-header' part='header'>
            <h2 className='dialog-title'>{label}</h2>
            <button
              type='button'
              className='dialog-close'
              part='close'
              aria-label='Close'
              onClick={() => this._handleClose()}
            >
              &times;
            </button>
          </div>
          <div className='dialog-body' part='body'>
            <slot></slot>
          </div>
          <div className='dialog-footer' part='footer'>
            <slot name='footer'></slot>
          </div>
        </dialog>
      </>
    );
  }

  override attributeChangedCallback(name: string, old: string | null, val: string | null): void {
    if (old === val) return;
    if (name === 'open') {
      this._updateStates();
      this._syncDialogElement();
    }
  }

  protected override onCsrRendered(): void {
    this._syncOpenState();
  }

  protected override onDsdHydrated(): void {
    this._syncOpenState();
  }

  /**
   * Apply the initial `open` state once the shadow DOM exists. SSR markup
   * like `<open-dialog open>` fires attributeChangedCallback at upgrade time,
   * before the shadow root is populated — without this hook the inner
   * <dialog> would stay closed/non-modal until the attribute changes again.
   */
  private _syncOpenState(): void {
    this._updateStates();
    this._syncDialogElement();
  }

  private _updateStates(): void {
    if (!this._internals?.states) return;
    if (this.hasAttribute('open')) {
      this._internals.states.add('open');
      this._internals.states.delete('closed');
    } else {
      this._internals.states.delete('open');
      this._internals.states.add('closed');
    }
  }

  show(): void {
    this.setAttribute('open', '');
  }

  close(): void {
    this.removeAttribute('open');
  }

  toggle(): void {
    if (this.hasAttribute('open')) this.removeAttribute('open');
    else this.setAttribute('open', '');
  }

  private _syncDialogElement(): void {
    const dialog = this.shadowRoot?.querySelector('dialog');
    if (!dialog) return;
    if (this.hasAttribute('open') && !dialog.open) {
      // Modal: showModal() puts the rest of the page on the inert top layer
      // natively — focus, hit-testing, and the accessibility tree are all
      // covered by the platform, so no hand-rolled sibling inert is needed.
      // Non-modal: show() leaves the page interactive by design.
      if ((this.getAttribute('mode') || 'modal') === 'modal') dialog.showModal();
      else dialog.show();
    } else if (!this.hasAttribute('open') && dialog.open) {
      dialog.close();
    }
  }

  private _handleClose(): void {
    // removeAttribute('open') fires attributeChangedCallback, which already
    // runs _updateStates() + _syncDialogElement() — no duplicate sync here.
    this.removeAttribute('open');
    this.dispatchEvent(new CustomEvent('open-dialog-close', { bubbles: true, composed: true }));
  }

  private _handleCancel(e: Event): void {
    e.preventDefault();
    this._handleClose();
  }

  private _handleTrigger(): void {
    this.toggle();
  }
}
