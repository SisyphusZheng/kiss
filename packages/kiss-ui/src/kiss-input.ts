/**
 * @kissjs/ui - kiss-input
 *
 * Minimal input field following Swiss International Style.
 * Clean borders, subtle focus states.
 *
 * Usage:
 * ```html
 * <kiss-input placeholder="Enter text"></kiss-input>
 * <kiss-input type="email" label="Email"></kiss-input>
 * <kiss-input type="password" label="Password" required></kiss-input>
 * ```
 */

import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { kissDesignTokens } from './design-tokens.js';

export const tagName = 'kiss-input';

@customElement(tagName)
export class KissInput extends LitElement {
  static override styles = [
    kissDesignTokens,
    css`
      :host {
        display: block;
      }

      .input-wrapper {
        display: flex;
        flex-direction: column;
        gap: var(--kiss-size-2);
      }

      label {
        font-size: var(--kiss-font-size-sm);
        font-weight: var(--kiss-font-weight-medium);
        color: var(--kiss-text-tertiary);
        letter-spacing: var(--kiss-letter-spacing-wide);
      }

      .input {
        width: 100%;
        padding: var(--kiss-size-2) var(--kiss-size-3);
        font-family: var(--kiss-font-sans);
        font-size: var(--kiss-font-size-md);
        color: var(--kiss-text-primary);
        background: var(--kiss-bg-base);
        border: 1px solid var(--kiss-border);
        border-radius: var(--kiss-radius-md);
        transition:
          border-color var(--kiss-transition-normal),
          box-shadow var(--kiss-transition-normal);
        outline: none;
      }

      .input::placeholder {
        color: var(--kiss-text-muted);
      }

      .input:hover {
        border-color: var(--kiss-border-hover);
      }

      .input:focus {
        border-color: var(--kiss-accent);
        box-shadow: 0 0 0 1px var(--kiss-accent);
      }

      .input:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        background: var(--kiss-bg-surface);
      }

      .input--error {
        border-color: var(--kiss-text-tertiary);
      }

      .error-message {
        font-size: var(--kiss-font-size-xs);
        color: var(--kiss-text-tertiary);
      }
    `,
  ];

  @property({ type: String })
  type: 'text' | 'email' | 'password' | 'number' | 'url' = 'text';

  @property({ type: String })
  placeholder?: string;

  @property({ type: String })
  label?: string;

  @property({ type: String })
  value?: string;

  @property({ type: String })
  name?: string;

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Boolean })
  required = false;

  @property({ type: String })
  error?: string;

  override render() {
    return html`
      <div class="input-wrapper">
        ${this.label
          ? html`
            <label for="input">${this.label}${this.required ? ' *' : ''}</label>
          `
          : ''}
        <input
          id="input"
          class="input ${this.error ? 'input--error' : ''}"
          type="${this.type}"
          placeholder="${this.placeholder}"
          value="${this.value}"
          name="${this.name}"
          ?disabled="${this.disabled}"
          ?required="${this.required}"
          @input="${this._handleInput}"
        />
        ${this.error
          ? html`
            <span class="error-message">${this.error}</span>
          `
          : ''}
      </div>
    `;
  }

  private _handleInput(e: Event) {
    const input = e.target as HTMLInputElement;
    this.value = input.value;
    this.dispatchEvent(
      new CustomEvent('kiss-input', {
        detail: { value: input.value },
        bubbles: true,
        composed: true,
      }),
    );
  }
}
