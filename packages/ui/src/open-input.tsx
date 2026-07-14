/** @jsxImportSource @openelement/element */
/**
 * @openelement/ui - open-input
 *
 * Minimal input field following Swiss International Style.
 * Clean borders, subtle focus states.
 *
 * v0.20.0: Migrated from DsdLitElement to DsdElement (Ocean component).
 * v0.24.1: Migrated from html`` template to JSX (ADR-0057).
 *
 * Features:
 * - Form-associated: participates in native <form> submission
 * - Supports label, placeholder, error, disabled, required
 * - Dispatches 'open-input' custom event on value change
 *
 * @csspart wrapper -The outer input-wrapper div
 * @csspart label -The label element
 * @csspart control -The input/textarea/select element
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
import { StyleSheet, type StyleSheetLike } from '@openelement/element';
import { escapeHtml } from '@openelement/element';
import { controlRecipe } from './component-recipes.ts';

export const tagName = 'open-input';

const sheet: StyleSheetLike = new StyleSheet();
sheet.replaceSync(`
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

  override render(): ReturnType<typeof OpenElement.prototype.render> {
    const type = this.getAttribute('type') || 'text';
    const placeholder = this.getAttribute('placeholder') || '';
    const label = this.getAttribute('label') || '';
    const value = this.getAttribute('value') || '';
    const name = this.getAttribute('name') || '';
    const d = this.hasAttribute('disabled');
    const r = this.hasAttribute('required');
    const error = this.getAttribute('error') || '';
    const errorClass = error ? ' input--error' : '';

    return (
      <div className='input-wrapper' part='wrapper'>
        {label && (
          <label htmlFor='input' part='label'>
            {this._esc(label)}
            {r ? ' *' : ''}
          </label>
        )}
        <input
          id='input'
          className={`control input${errorClass}`}
          part='control'
          type={type}
          placeholder={placeholder}
          value={value}
          name={name}
          disabled={d}
          required={r}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? 'input-error' : undefined}
          aria-errormessage={error ? 'input-error' : undefined}
          onInput={(e: Event) => this._handleInput(e)}
          onChange={(e: Event) => this._handleChange(e)}
          onFocus={() => this._handleFocus()}
          onBlur={() => this._handleBlur()}
        />
        {error && (
          <small id='input-error' role='alert' className='error-message' part='error'>
            {this._esc(error)}
          </small>
        )}
      </div>
    );
  }

  override attributeChangedCallback(name: string, old: string | null, val: string | null): void {
    if (old === val) return;
    if (name === 'disabled' || name === 'error') {
      this._syncDOM();
      this._updateStates();
    } else if (name === 'value') {
      this._syncDOM();
      if (this._internals) {
        this._internals.setFormValue(val || '');
      }
    } else {
      this._syncDOM();
    }
  }

  private _syncDOM(): void {
    const input = this.shadowRoot?.querySelector('input, textarea, select') as
      | HTMLInputElement
      | null;
    if (!input) return;
    input.disabled = this.hasAttribute('disabled');
    const val = this.getAttribute('value');
    if (val !== null && input.value !== val) {
      input.value = val;
    }
  }

  private _updateStates(): void {
    if (!this._internals?.states) return;
    if (this.hasAttribute('disabled')) {
      this._internals.states.add('disabled');
      this._internals.states.delete('enabled');
    } else {
      this._internals.states.delete('disabled');
      this._internals.states.add('enabled');
    }
    if (this.getAttribute('error')) {
      this._internals.states.add('invalid');
    } else {
      this._internals.states.delete('invalid');
    }
  }

  private _handleInput(e: Event): void {
    const input = e.target as HTMLInputElement;
    this.setAttribute('value', input.value);
    this._internals?.setFormValue(input.value);
    this.dispatchEvent(
      new CustomEvent('open-input', {
        detail: { value: input.value },
        bubbles: true,
        composed: false,
      }),
    );
  }

  private _handleChange(e: Event): void {
    const input = e.target as HTMLInputElement;
    this.dispatchEvent(
      new CustomEvent('open-change', {
        detail: { value: input.value },
        bubbles: true,
        composed: false,
      }),
    );
  }

  private _handleFocus(): void {
    this.dispatchEvent(new CustomEvent('open-focus', { bubbles: true, composed: false }));
  }

  private _handleBlur(): void {
    this.dispatchEvent(new CustomEvent('open-blur', { bubbles: true, composed: false }));
  }

  formResetCallback(): void {
    this.setAttribute('value', '');
    this.removeAttribute('error');
    this._internals?.setFormValue('');
    this._syncDOM();
  }

  formDisabledCallback(disabled: boolean): void {
    if (disabled) {
      this.setAttribute('disabled', '');
    } else {
      this.removeAttribute('disabled');
    }
  }

  private _esc = escapeHtml;
}

export default OpenInput;
