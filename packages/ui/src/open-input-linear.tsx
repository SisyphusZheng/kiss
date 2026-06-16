/** @jsxImportSource @openelement/core */
/**
 * @openelement/ui - open-input-linear
 *
 * Linear.app-style input component with three variants (standard, cli,
 * search), three sizes (sm, md, lg), and native form association.
 *
 * v0.1.0
 *
 * Features:
 * - Form-associated: participates in native <form> submission
 * - Variants: standard, cli (mono font, $ prefix, optional copy button),
 *   search (inline search icon, default "Search documentation..." placeholder)
 * - Sizes: sm (32px), md (36px), lg (44px)
 * - prefix / suffix named slots for additional content
 * - Dispatches 'open-input', 'open-change', 'open-focus', 'open-blur'
 *
 * @csspart wrapper - The outer input row wrapper
 * @csspart control - The actual <input> element
 *
 * Usage:
 * ```html
 * <!-- Standard -->
 * <open-input-linear placeholder="Email" label="Email"></open-input-linear>
 *
 * <!-- CLI with copy -->
 * <open-input-linear variant="cli" value="npm install" copy></open-input-linear>
 *
 * <!-- Search (defaults to "Search documentation..." placeholder) -->
 * <open-input-linear variant="search"></open-input-linear>
 *
 * <!-- Sizes -->
 * <open-input-linear size="sm" placeholder="Small"></open-input-linear>
 * <open-input-linear size="md" placeholder="Medium"></open-input-linear>
 * <open-input-linear size="lg" placeholder="Large"></open-input-linear>
 *
 * <!-- Form association -->
 * <form onsubmit="console.info(new FormData(this))">
 *   <open-input-linear name="q" label="Query" variant="search"></open-input-linear>
 *   <button type="submit">Submit</button>
 * </form>
 * ```
 */

import { OpenElement } from '@openelement/element';
import { StyleSheet, type StyleSheetLike } from '@openelement/core/style-sheet';
import { escapeAttr, escapeHtml } from '@openelement/core';
import { linearTokenSheet } from './linear-token-sheet.js';

export const tagName = 'open-input-linear';

const sheet: StyleSheetLike = new StyleSheet();
sheet.replaceSync(`
  :host {
    display: inline-block;
    position: relative;
  }

  .linear-wrapper {
    width: 100%;
  }

  .input-row {
    position: relative;
    display: flex;
    align-items: center;
  }

  .linear-input {
    flex: 1;
    min-width: 0;
    width: 100%;
    background: var(--input-bg, var(--surface-1));
    border: 1px solid var(--input-border-color, var(--color-border));
    border-radius: var(--input-radius, 8px);
    font-family: var(--font-sans);
    font-size: 14px;
    font-weight: 400;
    color: var(--color-text-primary);
    outline: none;
    transition: border-color 150ms ease;
    box-sizing: border-box;
    -webkit-appearance: none;
    appearance: none;
  }

  .linear-input::placeholder {
    color: var(--color-text-muted);
  }

  .linear-input:hover {
    border-color: var(--color-border-hover);
  }

  .linear-input:focus-visible {
    border-color: var(--input-focus-ring, var(--color-brand));
    outline: 2px solid color-mix(in srgb, var(--color-brand) 50%, transparent);
    outline-offset: -1px;
  }

  /* ── Disabled ── */
  .linear-input:disabled,
  :host([disabled]) .linear-input {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* ── Error ── */
  .linear-input--error {
    border-color: var(--color-error);
  }

  /* ── Sizes ── */
  .linear-input--sm {
    padding: 6px 10px;
    height: 32px;
  }

  .linear-input--md {
    padding: var(--space-xs) var(--space-sm);
    height: 36px;
  }

  .linear-input--lg {
    padding: 12px 16px;
    height: 44px;
  }

  /* ── CLI variant ── */
  .linear-input--cli {
    font-family: var(--font-mono);
  }

  .cli-prefix {
    position: absolute;
    left: 12px;
    color: var(--color-success);
    font-family: var(--font-mono);
    font-size: 14px;
    pointer-events: none;
    user-select: none;
  }

  .linear-input--cli.linear-input--sm + .cli-prefix,
  .linear-input--sm ~ .cli-prefix {
    left: 10px;
  }

  .linear-input--cli.linear-input--lg + .cli-prefix,
  .linear-input--lg ~ .cli-prefix {
    left: 16px;
  }

  .linear-input--cli.linear-input--sm {
    padding-left: 24px;
  }

  .linear-input--cli.linear-input--md {
    padding-left: 28px;
  }

  .linear-input--cli.linear-input--lg {
    padding-left: 32px;
  }

  .copy-button {
    position: absolute;
    right: 8px;
    background: transparent;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm, 6px);
    color: var(--color-text-muted);
    font-family: var(--font-sans);
    font-size: 11px;
    padding: 2px 8px;
    cursor: pointer;
    transition: border-color 150ms ease, color 150ms ease;
    line-height: 1.4;
  }

  .copy-button:hover {
    border-color: var(--color-border-hover);
    color: var(--color-text-primary);
  }

  /* extra right padding for copy button */
  .linear-input--cli.has-copy {
    padding-right: 48px;
  }

  /* ── Search variant ── */
  .search-icon {
    position: absolute;
    left: 10px;
    color: var(--color-text-muted);
    pointer-events: none;
    display: flex;
    align-items: center;
  }

  .linear-input--search.linear-input--sm {
    padding-left: 28px;
  }

  .linear-input--search.linear-input--md {
    padding-left: 32px;
  }

  .linear-input--search.linear-input--lg {
    padding-left: 36px;
  }

  /* ── Slots ── */
  .slot-prefix,
  .slot-suffix {
    display: flex;
    align-items: center;
  }

  .slot-prefix {
    margin-right: 4px;
  }

  .slot-suffix {
    margin-left: 4px;
  }

  /* ── Error message ── */
  .error-message {
    font-size: var(--font-size-caption, 0.75rem);
    color: var(--color-error);
    margin-top: 4px;
    display: block;
  }
`);

export class OpenInputLinear extends OpenElement {
  static _instanceCount = 0;
  static override styles = [linearTokenSheet, sheet];
  static override formAssociated = true;
  static override delegatesFocus = true;
  static override observedAttributes = [
    'variant',
    'size',
    'placeholder',
    'value',
    'disabled',
    'error',
    'label',
    'type',
    'name',
    'copy',
  ];

  override render(): ReturnType<typeof OpenElement.prototype.render> {
    const variant = this.getAttribute('variant') || 'standard';
    const size = this.getAttribute('size') || 'md';
    const type = this.getAttribute('type') || 'text';
    const placeholder = variant === 'search' && !this.hasAttribute('placeholder')
      ? 'Search documentation...'
      : this.getAttribute('placeholder') || '';
    const label = this.getAttribute('label') || '';
    const value = this.getAttribute('value') || '';
    const name = this.getAttribute('name') || '';
    const d = this.hasAttribute('disabled');
    const error = this.getAttribute('error') || '';
    const hasCopy = this.hasAttribute('copy');

    const inputId = `linear-input-${++OpenInputLinear._instanceCount}`;
    const errorId = `${inputId}-error`;
    const errorClass = error ? ' linear-input--error' : '';
    const sizeClass = ` linear-input--${size}`;
    const variantClass = variant !== 'standard' ? ` linear-input--${variant}` : '';
    const copyClass = hasCopy ? ' has-copy' : '';
    const inputClasses = `linear-input${errorClass}${sizeClass}${variantClass}${copyClass}`;

    return (
      <div className='linear-wrapper' part='wrapper'>
        {label && (
          <label
            htmlFor={inputId}
            style={{
              display: 'block',
              marginBottom: '4px',
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--color-text-secondary)',
            }}
          >
            {this._esc(label)}
          </label>
        )}
        <div className='input-row'>
          {/* named prefix slot (flex item, before input) */}
          <slot name='prefix' className='slot-prefix' />

          {/* CLI decorative $ prefix */}
          {variant === 'cli' && <span className='cli-prefix'>$</span>}

          {/* Search icon */}
          {variant === 'search' && (
            <span className='search-icon'>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='16'
                height='16'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                stroke-width='1.5'
                stroke-linecap='round'
                stroke-linejoin='round'
              >
                <circle cx='11' cy='11' r='8' />
                <line x1='21' y1='21' x2='16.65' y2='16.65' />
              </svg>
            </span>
          )}

          <input
            id={inputId}
            className={inputClasses}
            part='control'
            type={type}
            placeholder={placeholder}
            value={value}
            name={name}
            disabled={d}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error ? errorId : undefined}
            aria-errormessage={error ? errorId : undefined}
            onInput={(e: Event) => this._handleInput(e)}
            onChange={(e: Event) => this._handleChange(e)}
            onFocus={() => this._handleFocus()}
            onBlur={() => this._handleBlur()}
          />

          {/* Copy button for CLI variant */}
          {variant === 'cli' && hasCopy && (
            <button
              className='copy-button'
              onClick={() => this._handleCopy()}
              type='button'
            >
              Copy
            </button>
          )}

          {/* named suffix slot (flex item, after input) */}
          <slot name='suffix' className='slot-suffix' />
        </div>
        {error && (
          <small id={errorId} role='alert' className='error-message'>
            {this._esc(error)}
          </small>
        )}
      </div>
    );
  }

  override attributeChangedCallback(
    name: string,
    old: string | null,
    val: string | null,
  ): void {
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
    const input = this.shadowRoot?.querySelector('input') as
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
    this.dispatchEvent(
      new CustomEvent('open-focus', { bubbles: true, composed: false }),
    );
  }

  private _handleBlur(): void {
    this.dispatchEvent(
      new CustomEvent('open-blur', { bubbles: true, composed: false }),
    );
  }

  private _handleCopy(): void {
    const val = this.getAttribute('value') || '';
    navigator.clipboard.writeText(val).catch(() => {
      // ponytail: fallback for environments without clipboard API
      const ta = document.createElement('textarea');
      ta.value = val;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    });
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
  private _escAttr = escapeAttr;
}

export default OpenInputLinear;

// Guard: idempotent across SSR paths
if (
  typeof customElements !== 'undefined' &&
  !customElements.get(tagName)
) {
  customElements.define(tagName, OpenInputLinear);
}
