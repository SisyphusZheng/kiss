/** @jsxImportSource @openelement/element */
/**
 * @openelement/ui - open-button
 *
 * Minimal button component following Swiss International Style.
 * Pure B&W design with subtle hover states.
 *
 * v0.24.1: Migrated from html`` template to JSX (ADR-0057).
 *
 * Variants: default (outlined), primary (filled), ghost (no border), accent (gradient)
 * Sizes: sm, md (default), lg
 *
 * @csspart control -The button or anchor element
 *
 * Usage:
 * ```html
 * <open-button>Click me</open-button>
 * <open-button variant="primary">Submit</open-button>
 * <open-button size="sm" disabled>Small</open-button>
 * ```
 */

import { OpenElement } from '@openelement/element';
import { StyleSheet, type StyleSheetLike } from '@openelement/element';
import { controlRecipe } from './component-recipes.ts';

export const tagName = 'open-button';

const sheet: StyleSheetLike = new StyleSheet();
sheet.replaceSync(`
  :host {
    display: inline-block;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--size-2);
    font-family: var(--font-sans);
    font-weight: var(--font-weight-8);
    text-decoration: none;
    cursor: pointer;
    border: var(--border-size-1) solid color-mix(in srgb, var(--border) 72%, var(--brand));
    background: color-mix(in srgb, var(--bg-elevated) 78%, transparent);
    color: var(--ui-control-text);
    border-radius: var(--ui-control-radius);
    box-shadow: var(--ui-control-highlight);
    transition: color var(--ease-3) var(--duration-2), border-color var(--ease-3) var(--duration-2), background var(--ease-3) var(--duration-2), transform var(--ease-3) var(--duration-2), box-shadow var(--ease-3) var(--duration-2);
    white-space: nowrap;
    letter-spacing: 0;
  }

  /* Sizes */
  .btn--sm {
    padding: var(--size-1) var(--size-3);
    font-size: var(--font-size-0);
    min-height: 30px;
  }

  .btn--md {
    padding: var(--size-2) var(--size-4);
    font-size: var(--font-size-1);
    min-height: 38px;
  }

  .btn--lg {
    padding: var(--size-3) var(--size-5);
    font-size: var(--font-size-2);
    min-height: 48px;
  }

  /* Variants */
  .btn--default:hover {
    color: var(--brand-deep);
    border-color: var(--brand-light);
    background: color-mix(in srgb, var(--brand-pale) 52%, var(--bg-elevated));
  }

  .btn--primary {
    background: linear-gradient(135deg, var(--brand), var(--brand-light));
    color: var(--on-brand);
    border-color: transparent;
    box-shadow: 0 var(--size-2) var(--size-5) color-mix(in srgb, var(--brand) 22%, transparent);
  }

  .btn--primary:hover {
    background: linear-gradient(135deg, var(--brand-hover), var(--brand-light));
    border-color: transparent;
    transform: translateY(calc(var(--border-size-1) * -1));
    box-shadow: 0 var(--size-3) var(--size-6) color-mix(in srgb, var(--brand) 28%, transparent);
  }

  .btn--ghost {
    border-color: transparent;
  }

  .btn--ghost:hover {
    background: color-mix(in srgb, var(--brand-pale) 38%, transparent);
    border-color: transparent;
  }

  .btn--accent {
    background: var(--brand);
    color: var(--on-brand);
    border-color: transparent;
  }
  .btn--accent:hover {
    transform: translateY(-1px);
    filter: brightness(1.05);
  }
  .btn--accent:active {
    transform: translateY(0);
    box-shadow: var(--shadow-1);
  }

  /* States */
  .btn:disabled,
  .btn[aria-disabled="true"] {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }

  .btn:focus-visible {
    outline: 2px solid var(--brand, var(--indigo-6));
    outline-offset: 2px;
  }

  :host(:state(disabled)) .btn {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }
`);

function closestForm(element: Element): HTMLFormElement | null {
  return typeof element.closest === 'function' ? element.closest('form') : null;
}

export class OpenButton extends OpenElement {
  static override styles = [controlRecipe, sheet];
  static override delegatesFocus = true;
  static override formAssociated = true;
  static override observedAttributes = ['variant', 'size', 'disabled', 'href', 'target', 'type'];

  override render(): ReturnType<typeof OpenElement.prototype.render> {
    const v = this.getAttribute('variant') || 'default';
    const s = this.getAttribute('size') || 'md';
    const d = this.hasAttribute('disabled');
    const href = this.getAttribute('href') || '';
    const target = this.getAttribute('target') || '';
    const type = this.getAttribute('type') || 'button';
    const classes = `control btn btn--${v} btn--${s}`;

    if (href) {
      return (
        <a
          className={classes}
          part='control'
          href={d ? '' : href}
          target={target || undefined}
          aria-disabled={d ? 'true' : undefined}
          rel={target === '_blank' ? 'noopener noreferrer' : undefined}
          onClick={this._handleClick}
        >
          <slot></slot>
        </a>
      );
    }

    return (
      <button
        className={classes}
        part='control'
        disabled={d}
        type={type}
        onClick={this._handleClick}
      >
        <slot></slot>
      </button>
    );
  }

  override attributeChangedCallback(name: string, old: string | null, val: string | null): void {
    if (old === val) return;
    // href change may switch element type (a vs button) -full re-render
    if (name === 'href') {
      this._reRender();
    } else if (name === 'disabled') {
      this._syncDOM();
      this._updateState();
    } else {
      this._syncDOM();
    }
  }

  private _syncDOM(): void {
    const el = this.shadowRoot?.querySelector('.btn') as HTMLElement | null;
    if (!el) return;
    const v = this.getAttribute('variant') || 'default';
    const s = this.getAttribute('size') || 'md';
    el.className = `control btn btn--${v} btn--${s}`;
    if (el instanceof HTMLButtonElement) {
      el.disabled = this.hasAttribute('disabled');
    }
    if (el instanceof HTMLAnchorElement && this.hasAttribute('disabled')) {
      el.setAttribute('aria-disabled', 'true');
    }
  }

  private _reRender(): void {
    // NOTE: We do NOT capture assignedNodes before innerHTML replacement.
    // Light DOM children remain in the host element and automatically
    // re-project to the new <slot> - no manual DOM manipulation needed.
    // The previous approach (replaceChildren) incorrectly moved light DOM
    // children into the shadow root, breaking slot projection.
    this.update();
  }

  private _updateState(): void {
    if (!this._internals?.states) return;
    if (this.hasAttribute('disabled')) {
      this._internals.states.delete('enabled');
      this._internals.states.add('disabled');
    } else {
      this._internals.states.delete('disabled');
      this._internals.states.add('enabled');
    }
  }

  private _handleClick(_e: Event): void {
    this.dispatchEvent(new CustomEvent('open-click', { bubbles: true, composed: true }));

    // An <a> (href) branch is a navigation control, not a form control — it must
    // never submit/reset a form (异味③, #637). Only the <button> branch may
    // trigger form submission below.
    if (this.hasAttribute('href')) return;

    // Form submission: when type="submit" or type="reset" and this element is
    // associated with a <form> (via formAssociated), the inner <button> lives
    // inside the shadow DOM and its native submit/reset behavior does NOT
    // reach the outer form. We must explicitly trigger it here.
    const type = this.getAttribute('type') || 'button';
    // formAssociated internals.form is only available when attached to DOM.
    // Fall back to closest('form') for elements without _internals (test env).
    const form = this._internals?.form ?? closestForm(this);
    if (!form) return;
    if (type === 'submit') {
      this._submitForm(form);
    } else if (type === 'reset') {
      this._resetForm(form);
    }
  }

  /**
   * Submit `form` on behalf of this element (v0.42.0-alpha.9, #637).
   *
   * Critical: the native 'submit' event is NOT composed (it does not cross
   * shadow boundaries). open-button typically lives inside another custom
   * element's shadow root (e.g. <reader-reading>), so a natively submitted
   * form would never reach the SPA's root listener. We re-dispatch a
   * composed, cancelable submit event on the form so the SPA's delegated
   * handler (bound on #root) can intercept it; at that listener
   * event.target is retargeted to this host, so the handler locates the
   * form through event.composedPath() (see spa.ts handleFormSubmit).
   */
  private _submitForm(form: HTMLFormElement): void {
    // SubmitEvent may be unavailable in older runtimes; fall back to Event.
    const SubmitEventCtor = (globalThis as { SubmitEvent?: typeof SubmitEvent }).SubmitEvent;
    const submitEvent: Event = SubmitEventCtor
      ? new SubmitEventCtor('submit', {
        bubbles: true,
        cancelable: true,
        composed: true,
      })
      : new Event('submit', { bubbles: true, cancelable: true, composed: true });
    form.dispatchEvent(submitEvent);
    // If the SPA prevented default, the action was handled — do NOT call
    // requestSubmit() (which would cause native form GET navigation).
    if (!submitEvent.defaultPrevented) {
      const formEl = form as HTMLFormElement & {
        requestSubmit?: () => void;
        submit: () => void;
      };
      if (typeof formEl.requestSubmit === 'function') {
        formEl.requestSubmit();
      } else {
        formEl.submit();
      }
    }
  }

  /** Reset `form` on behalf of this element (v0.42.0-alpha.9, #637). */
  private _resetForm(form: HTMLFormElement): void {
    form.reset();
  }
}

