/**
 * @kissjs/ui - kiss-theme-toggle
 *
 * Theme toggle Island component for Dark/Light mode switching.
 * Swiss International Style: Pure B&W, minimal.
 *
 * Features:
 * - Accepts initial theme via `theme` attribute (avoids localStorage race)
 * - Falls back to reading localStorage if no attribute is set
 * - Toggles between dark and light themes
 * - Updates document.documentElement data-theme attribute
 * - Persists preference to localStorage
 *
 * Usage:
 * ```html
 * <!-- SSR-rendered with known theme (avoids FOUC + race condition) -->
 * <kiss-theme-toggle theme="light"></kiss-theme-toggle>
 *
 * <!-- Or without attribute (falls back to localStorage) -->
 * <kiss-theme-toggle></kiss-theme-toggle>
 * ```
 *
 * KISS Architecture:
 * - This is an Island component (has Shadow DOM + hydration)
 * - Requires eager hydration (theme should be applied immediately)
 * - The `theme` attribute lets the SSR pipeline pass the resolved theme
 *   from the head inline script, avoiding a race between connectedCallback
 *   reading localStorage and the head script having already set data-theme.
 */

import { css, type CSSResult, html, LitElement, type TemplateResult } from '@kissjs/core';
import { kissDesignTokens } from './design-tokens.js';

export const tagName = 'kiss-theme-toggle';

export class KissThemeToggle extends LitElement {
  static override styles: CSSResult[] = [
    kissDesignTokens,
    css`
      :host {
        display: inline-block;
      }

      .theme-toggle {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        padding: 0;
        border: 1px solid var(--kiss-border);
        border-radius: var(--kiss-radius-md);
        background: transparent;
        color: var(--kiss-text-tertiary);
        cursor: pointer;
        font-size: 0;
        line-height: 1;
        transition:
          color var(--kiss-transition-normal),
          border-color var(--kiss-transition-normal),
          background var(--kiss-transition-normal);
        }

        .theme-toggle:hover {
          color: var(--kiss-text-primary);
          border-color: var(--kiss-border-hover);
          background: var(--kiss-accent-subtle);
        }

        .theme-toggle svg {
          width: 16px;
          height: 16px;
        }

        .theme-toggle .icon-sun {
          display: block;
        }

        .theme-toggle .icon-moon {
          display: none;
        }

        .theme-toggle.is-light .icon-sun {
          display: none;
        }

        .theme-toggle.is-light .icon-moon {
          display: block;
        }
      `,
    ];

    static override properties = {
      /** Initial theme from SSR/head script. Avoids localStorage race. */
      theme: { type: String, reflect: true },
      _isLight: { state: true },
    };

    /** Initial theme attribute — set by SSR or head inline script */
    theme?: string;

    /** Whether the current theme is light (false = dark) */
    _isLight = false;

    override connectedCallback() {
      super.connectedCallback();

      // Priority: `theme` attribute > document.documentElement > localStorage > default
      // The `theme` attribute is set by SSR/head inline script, which runs
      // BEFORE this connectedCallback. This eliminates the race condition.
      if (this.theme === 'light') {
        this._isLight = true;
      } else if (this.theme === 'dark') {
        this._isLight = false;
      } else if (document.documentElement.dataset.theme === 'light') {
        // Check the <html data-theme="..."> attribute set by the head inline script.
        // This is the standard path: the head script reads localStorage and sets
        // data-theme BEFORE any LitElement connects.
        this._isLight = true;
      } else {
        // Fallback: read from localStorage directly (edge case where neither
        // attribute nor data-theme is set)
        const saved = localStorage.getItem('kiss-theme');
        if (saved === 'light') {
          this._isLight = true;
        }
      }
    }

    private _handleToggle() {
      this._isLight = !this._isLight;
      const theme = this._isLight ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('kiss-theme', theme);
    }

    override render(): TemplateResult {
      return html`
        <button
          class="theme-toggle ${this._isLight ? 'is-light' : ''}"
          title="${this._isLight ? 'Switch to dark theme' : 'Switch to light theme'}"
          aria-label="Toggle theme"
          @click="${this._handleToggle}"
        >
          <svg
            class="icon-sun"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            stroke-width="1.2"
            stroke-linecap="round"
          >
            <circle cx="8" cy="8" r="3" />
            <line x1="8" y1="1" x2="8" y2="3" />
            <line x1="8" y1="13" x2="8" y2="15" />
            <line x1="1" y1="8" x2="3" y2="8" />
            <line x1="13" y1="8" x2="15" y2="8" />
            <line x1="3.05" y1="3.05" x2="4.46" y2="4.46" />
            <line x1="11.54" y1="11.54" x2="12.95" y2="12.95" />
            <line x1="3.05" y1="12.95" x2="4.46" y2="11.54" />
            <line x1="11.54" y1="4.46" x2="12.95" y2="3.05" />
          </svg>
          <svg
            class="icon-moon"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            stroke-width="1.2"
            stroke-linecap="round"
          >
            <path d="M13.5 9.14A5.5 5.5 0 0 1 6.86 2.5 5.5 5.5 0 1 0 13.5 9.14Z" />
          </svg>
        </button>
      `;
    }
  }

  // Auto-register when loaded as a module
  // This is needed for Island hydration
  customElements.define(tagName, KissThemeToggle);
