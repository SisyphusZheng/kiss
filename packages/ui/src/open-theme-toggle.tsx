/** @jsxImportSource @openelement/element */
/**
 * @openelement/ui - open-theme-toggle
 *
 * Theme toggle Reactive DSD component for Dark/Light mode switching.
 * Swiss International Style: Pure B&W, minimal.
 *
 * v0.24.1: Migrated from html`` template to JSX (ADR-0057).
 *
 * @csspart toggle -The button element
 * @csspart icon-sun -The sun SVG icon
 * @csspart icon-moon -The moon SVG icon
 *
 * Usage:
 * ```html
 * <open-theme-toggle theme="light"></open-theme-toggle>
 * ```
 */

import { OpenElement } from '@openelement/element';
import { StyleSheet, type StyleSheetLike } from '@openelement/element';
import { signal } from '@openelement/element';
export const tagName = 'open-theme-toggle';

const sheet: StyleSheetLike = new StyleSheet();
sheet.replaceSync(`
  :host {
    display: inline-block;
  }

  .theme-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 38px; height: 38px; padding: 0;
    border: var(--border-size-1) solid color-mix(in srgb, var(--border) 72%, var(--brand));
    border-radius: var(--radius-round);
    background: color-mix(in srgb, var(--bg-elevated) 76%, transparent);
    color: var(--text-muted);
    box-shadow: inset 0 1px 0 color-mix(in srgb, var(--gray-0) 70%, transparent);
    cursor: pointer;
    transition: all var(--ease-2) var(--duration-2);
  }
  .theme-toggle:hover {
    color: var(--text-primary);
    border-color: var(--brand-light);
    background: color-mix(in srgb, var(--brand-pale) 42%, var(--bg-elevated));
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

  .theme-toggle[data-theme="light"] .icon-sun {
    display: none;
  }

  .theme-toggle[data-theme="light"] .icon-moon {
    display: block;
  }
`);

export class OpenThemeToggle extends OpenElement {
  // Safari does not recompute adoptedStyleSheets when
  // :host([data-theme]) changes. The token sheets (openPropsTokenSheet,
  // semantic token sheets are already injected as page-level <style> by
  // vite.config.ts — CSS custom properties cascade from :root naturally.
  // Only adopt the component-specific sheet.
  static override styles = [sheet];
  static override delegatesFocus = true;
  static override observedAttributes = ['theme'];

  private _theme = signal<'dark' | 'light'>('dark');
  private _initDone = false;
  private _lastPropagatedTheme: 'dark' | 'light' | undefined;

  override connectedCallback(): void {
    super.connectedCallback();
    this._requestAnimationFrame(() => this._initTheme());
  }

  /**
   * v0.23.0: Theme initialization lives in _initTheme(), called from
   * both onDsdHydrated() and onCsrRendered() so that the priority
   * chain works regardless of hydration path.
   *
   * Priority: theme attribute > document.documentElement.dataset.theme
   * > localStorage > prefers-color-scheme > default 'dark'.
   */
  private _initTheme(): void {
    if (this._initDone) return;
    this._initDone = true;
    const themeAttr = this.getAttribute('theme');
    if (themeAttr === 'light') {
      this._theme.value = 'light';
    } else if (themeAttr === 'dark') {
      this._theme.value = 'dark';
    } else {
      const docTheme = document.documentElement?.dataset?.theme;
      if (docTheme === 'light') {
        this._theme.value = 'light';
      } else if (docTheme === 'dark') {
        this._theme.value = 'dark';
      } else {
        let resolved = false;
        try {
          const saved = localStorage.getItem('open-theme');
          if (saved === 'light') {
            this._theme.value = 'light';
            resolved = true;
          } else if (saved === 'dark') {
            this._theme.value = 'dark';
            resolved = true;
          }
        } catch { /* localStorage blocked */ }
        if (!resolved && globalThis.matchMedia) {
          this._theme.value = globalThis.matchMedia('(prefers-color-scheme: light)').matches
            ? 'light'
            : 'dark';
        }
      }
    }

    this._applyTheme(this._theme.value);
  }

  private _applyTheme(theme: 'dark' | 'light'): void {
    const changed = this._lastPropagatedTheme !== theme;
    this._theme.value = theme;
    this.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    if (document.documentElement.style) document.documentElement.style.colorScheme = theme;

    try {
      const root = this.getRootNode();
      if (typeof ShadowRoot !== 'undefined' && root instanceof ShadowRoot && root.host) {
        root.host.setAttribute('data-theme', theme);
      }
    } catch { /* getRootNode unavailable */ }

    if (changed) {
      this._lastPropagatedTheme = theme;
      this._dispatchThemeChange(theme);
      this._persistTheme(theme);
    }
  }

  private _persistTheme(theme: 'dark' | 'light'): void {
    try {
      localStorage.setItem('open-theme', theme);
    } catch { /* blocked */ }
  }

  protected override onDsdHydrated(): void {
    super.onDsdHydrated();
    this._requestAnimationFrame(() => this._initTheme());
  }

  protected override onCsrRendered(): void {
    super.onCsrRendered();
  }

  override render(): ReturnType<typeof OpenElement.prototype.render> {
    // Zero signal.value reads in render (ADR-0062).
    // effect binding that updates the attribute when theme changes.
    // CSS selectors ([data-theme="light"]) handle icon visibility.
    return (
      <button
        type='button'
        className='theme-toggle'
        part='toggle'
        data-theme={this._theme}
        aria-label='Toggle theme'
        onClick={() => this._handleToggle()}
      >
        <svg
          className='icon-sun'
          part='icon-sun'
          viewBox='0 0 16 16'
          fill='none'
          stroke='currentColor'
          stroke-width='1.2'
          stroke-linecap='round'
        >
          <circle cx='8' cy='8' r='3' />
          <line x1='8' y1='1' x2='8' y2='3' />
          <line x1='8' y1='13' x2='8' y2='15' />
          <line x1='1' y1='8' x2='3' y2='8' />
          <line x1='13' y1='8' x2='15' y2='8' />
          <line x1='3.05' y1='3.05' x2='4.46' y2='4.46' />
          <line x1='11.54' y1='11.54' x2='12.95' y2='12.95' />
          <line x1='3.05' y1='12.95' x2='4.46' y2='11.54' />
          <line x1='11.54' y1='4.46' x2='12.95' y2='3.05' />
        </svg>
        <svg
          className='icon-moon'
          part='icon-moon'
          viewBox='0 0 16 16'
          fill='none'
          stroke='currentColor'
          stroke-width='1.2'
          stroke-linecap='round'
        >
          <path d='M13.5 9.14A5.5 5.5 0 0 1 6.86 2.5 5.5 5.5 0 1 0 13.5 9.14Z' />
        </svg>
      </button>
    );
  }

  private _handleToggle(): void {
    const theme = this._theme.value === 'light' ? 'dark' : 'light';
    this._applyTheme(theme);
  }

  private _dispatchThemeChange(theme: 'dark' | 'light'): void {
    try {
      if (typeof CustomEvent !== 'undefined' && typeof globalThis.dispatchEvent === 'function') {
        globalThis.dispatchEvent(new CustomEvent('open:theme-change', { detail: { theme } }));
      }
    } catch (e) {
      console.debug('[open-theme-toggle] theme event dispatch unavailable:', e);
    }
  }

  override attributeChangedCallback(name: string, old: string | null, val: string | null): void {
    if (old === val) return;
    if (name === 'theme' && val) {
      this._applyTheme(val === 'light' ? 'light' : 'dark');
    }
  }
}

