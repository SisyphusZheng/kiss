/** @jsxImportSource @openelement/element */
/**
 * @openelement/ui - open-modal
 *
 * DaisyUI-style modal using DsdElement + Signals.
 * Uses signal-to-DOM binding on the `open` attribute; the daisyUI
 * `.modal[open]` CSS selector handles show/hide without re-renders.
 *
 * Usage:
 * ```html
 * <open-modal>
 *   <div>Modal content here</div>
 * </open-modal>
 * ```
 *
 * @slot - Modal body content
 */

import { OpenElement, type VNode } from '@openelement/element';
import { signal } from '@openelement/element';
import { daisyClassSheet } from './daisy-classes.ts';

export const tagName = 'open-modal';

export class OpenModal extends OpenElement {
  static override styles = [daisyClassSheet];
  #open = signal(false);

  open(): void {
    this.#open.value = true;
  }
  close(): void {
    this.#open.value = false;
  }

  #closeOnBackdrop(e: Event): void {
    if ((e.target as HTMLElement).classList.contains('modal-backdrop')) this.close();
  }

  override render(): VNode {
    return (
      <div class='modal' open={this.#open} role='dialog' aria-modal='true'>
        <div class='modal-backdrop' onClick={(e: Event) => this.#closeOnBackdrop(e)} />
        <div class='modal-content'>
          <slot />
        </div>
      </div>
    );
  }
}

export default OpenModal;
