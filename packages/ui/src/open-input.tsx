/** @jsxImportSource @openelement/element */
/**
 * @openelement/ui - open-input
 *
 * Minimal input field following Swiss International Style.
 * Clean borders, subtle focus states.
 *
 * v0.24.1: Migrated from html`` template to JSX (ADR-0057).
 *
 * Features:
 * - Form-associated: participates in native <form> submission via
 *   ElementInternals (setFormValue), including the initial `value`
 *   attribute synced on connect
 * - Native constraint validation: required + empty value maps to
 *   valueMissing via internals.setValidity
 * - Supports label, placeholder, error, disabled, required
 * - Dispatches 'open-input' custom event on value change
 *
 * @csspart wrapper -The outer input-wrapper div
 * @csspart label -The label element
 * @csspart control -The input element
 * @csspart error -The error message small element
 *
 * Usage:
 * ```html
 * <open-input placeholder="Enter text"></open-input>
 * <open-input type="email" label="Email"></open-input>
 * <form onsubmit="console.info(new FormData(this))">
 *   <open-input name="username" label="Username"></open-input>
 *   <button type="submit">Submit</button>
 * </form>
 * ```
 */

import { OpenElement } from '@openelement/element';
import type { StyleSheetLike } from '@openelement/element';
import {
  controlRecipe,
  nextInstanceId,
  recipe,
  type RenderResult,
  syncDisabledState,
} from './component-recipes.ts';

export const tagName = 'open-input';

const sheet: StyleSheetLike = recipe(`
  :host {
    display: block;
  }

  .input-wrapper {
    display: flex;
    flex-direction: column;
    gap: var(--size-2);
  }

  label {
    font-size: var(--font-size-0);
    font-weight: var(--font-weight-5);
    color: var(--text-secondary);
    letter-spacing: var(--font-letterspacing-2);
  }

  .input {
    width: 100%;
    padding: var(--size-2) var(--size-3);
    font-family: var(--font-sans);
    font-size: var(--font-size-1);
    color: var(--ui-control-text);
    background: var(--ui-control-bg);
    border: var(--border-size-1) solid var(--ui-control-border);
    border-radius: var(--ui-control-radius);
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
    outline: none;
  }

  .input::placeholder {
    color: var(--text-muted);
  }

  .input:hover {
    border-color: var(--ui-control-border-hover);
  }

  .input:focus {
    border-color: var(--brand, var(--indigo-6));
    box-shadow: 0 0 0 1px var(--brand, var(--indigo-6));
  }

  .input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: var(--bg-muted);
  }

  .input--error {
    border-color: var(--error);
  }

  :host(:state(disabled)) .input {
    opacity: 0.5;
    cursor: not-allowed;
    background: var(--bg-muted);
  }

  :host(:state(invalid)) .input {
    border-color: var(--error);
  }

  .error-message {
    font-size: var(--font-size-00);
    color: var(--error);
  }
`);

export class OpenInput extends OpenElement {
  static override styles = [controlRecipe, sheet];
  static override formAssociated = true;
  static override delegatesFocus = true;
  static override observedAttributes = [
    'type',
    'placeholder',
    'label',
    'value',
    'name',
    'disabled',
    'required',
    'error',
  ];

  private _uid = nextInstanceId();

  override connectedCallback(): void {
    super.connectedCallback();
    // Pre-upgrade attributes fire attributeChangedCallback before
    // connectedCallback, so the initial `value` never reaches the internals
    // there. Sync form value + validity here or the field submits empty.
    this._syncFormValue();
    this._syncValidity();
  }

  override render(): RenderResult {
    const type = this.getAttribute('type') || 'text';
    const placeholder = this.getAttribute('placeholder') || '';
    const label = this.getAttribute('label') || '';
    const value = this.getAttribute('value') || '';
    const name = this.getAttribute('name') || '';
    const d = this.hasAttribute('disabled');
    const r = this.hasAttribute('required');
    const error = this.getAttribute('error') || '';
    const errorClass = error ? ' input--error' : '';
    const inputId = `input-${this._uid}`;
    const errorId = `${inputId}-error`;

    return (
      <div className='input-wrapper' part='wrapper'>
        {label && (
          <label htmlFor={inputId} part='label'>
            {label}
            {r ? ' *' : ''}
          </label>
        )}
        <input
          id={inputId}
          className={`control input${errorClass}`}
          part='control'
          type={type}
          placeholder={placeholder}
          value={value}
          name={name}
          disabled={d}
          required={r}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? errorId : undefined}
          aria-errormessage={error ? errorId : undefined}
          onInput={(e: Event) => this._handleInput(e)}
          onChange={(e: Event) => this._handleChange(e)}
          onFocus={() => this._handleFocus()}
          onBlur={() => this._handleBlur()}
        />
        {error && (
          <small id={errorId} role='alert' className='error-message' part='error'>
            {error}
          </small>
        )}
      </div>
    );
  }

  override attributeChangedCallback(name: string, old: string | null, val: string | null): void {
    if (old === val) return;
    if (name === 'value') {
      // Sync in place instead of re-rendering: _handleInput writes `value`
      // back on every keystroke, and a re-render would replace the focused
      // <input> mid-typing.
      this._syncDOM();
      this._syncFormValue();
      this._syncValidity();
      return;
    }
    if (name === 'disabled' || name === 'error') {
      this._updateStates();
    }
    if (name === 'disabled') {
      // Sync in place so toggling disabled does not drop focus.
      this._syncDOM();
    } else {
      // label/error/type/placeholder/name/required change the rendered tree
      // (label and error elements appear or disappear), so re-render (#770).
      this.update();
    }
    if (name === 'required') {
      this._syncValidity();
    }
  }

  private _syncDOM(): void {
    const input = this.shadowRoot?.querySelector('input') as
      | HTMLInputElement
      | null;
    if (!input) return;
    input.disabled = this.hasAttribute('disabled');
    // A removed `value` attribute means the native default (''): without
    // clearing here the inner input keeps stale text while the form value
    // is already reset by _syncFormValue.
    const val = this.getAttribute('value') || '';
    if (input.value !== val) {
      input.value = val;
    }
  }

  private _updateStates(): void {
    if (!this._internals?.states) return;
    syncDisabledState(this._internals, this.hasAttribute('disabled'));
    if (this.getAttribute('error')) {
      this._internals.states.add('invalid');
    } else {
      this._internals.states.delete('invalid');
    }
  }

  private _syncFormValue(): void {
    this._internals?.setFormValue(this.getAttribute('value') || '');
  }

  /**
   * Validity basics (pilot scope): required + empty value → valueMissing.
   * The inner native <input> is inside the shadow root, so its own
   * constraints never reach the outer form; mirroring them onto the host
   * internals is what makes the custom element a real form citizen.
   * Full constraint mirroring (type=email, minlength, …) is future work.
   */
  private _syncValidity(): void {
    const internals = this._internals;
    // Feature-checked: test stubs and older engines may lack setValidity.
    if (!internals || typeof internals.setValidity !== 'function') return;
    if (this.hasAttribute('required') && !(this.getAttribute('value') || '')) {
      // No anchor: bubble placement is UA-dependent, and the inner <input>
      // gets replaced on re-render. Reuse its localized message when present.
      const inner = this.shadowRoot?.querySelector('input') as
        | HTMLInputElement
        | null;
      internals.setValidity(
        { valueMissing: true },
        inner?.validationMessage || 'Please fill out this field.',
      );
    } else {
      internals.setValidity({});
    }
  }

  private _handleInput(e: Event): void {
    const input = e.target as HTMLInputElement;
    this.setAttribute('value', input.value);
    this._syncFormValue();
    this._syncValidity();
    this.dispatchEvent(
      new CustomEvent('open-input', {
        detail: { value: input.value },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _handleChange(e: Event): void {
    const input = e.target as HTMLInputElement;
    this.dispatchEvent(
      new CustomEvent('open-change', {
        detail: { value: input.value },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _handleFocus(): void {
    this.dispatchEvent(new CustomEvent('open-focus', { bubbles: true, composed: true }));
  }

  private _handleBlur(): void {
    this.dispatchEvent(new CustomEvent('open-blur', { bubbles: true, composed: true }));
  }

  formResetCallback(): void {
    this.setAttribute('value', '');
    this.removeAttribute('error');
    this._syncFormValue();
    this._syncValidity();
    this._syncDOM();
  }

  formDisabledCallback(disabled: boolean): void {
    if (disabled) {
      this.setAttribute('disabled', '');
    } else {
      this.removeAttribute('disabled');
    }
  }
}
