/** @jsxImportSource @openelement/core */
/**
 * @openelement/ui - open-nav-linear
 *
 * Linear.app-style sticky navigation bar.
 * Transparent at top, gains backdrop-blur on scroll.
 * Supports desktop center links + mobile hamburger overlay.
 *
 * @csspart container - The nav inner wrapper
 * @csspart logo - The logo link
 * @csspart links - The desktop nav links container
 * @csspart cta - The "Get started" primary button
 * @csspart github - The GitHub secondary button
 * @csspart hamburger - The mobile hamburger toggle button
 * @csspart overlay - The mobile full-screen overlay
 *
 * Usage:
 * ```html
 * <open-nav-linear
 *   current-path="/guide/getting-started"
 *   nav-links='[{"label":"Guide","href":"/guide/getting-started"},{"label":"API","href":"/guide/api"},{"label":"Architecture","href":"/architecture/architecture"},{"label":"Blog","href":"/blog"},{"label":"Hub","href":"/docs"}]'
 *   logo-text="openElement"
 *   github-url="https://github.com/openelement/openelement"
 * ></open-nav-linear>
 * ```
 */

import { OpenElement } from '@openelement/element';
import { StyleSheet, type StyleSheetLike } from '@openelement/core/style-sheet';
import { linearTokenSheet } from './linear-token-sheet.js';
import { signal } from '@openelement/signal';
import { escapeAttr, escapeHtml } from '@openelement/core';

export const tagName = 'open-nav-linear';

interface NavLink {
  label: string;
  href: string;
}

const sheet: StyleSheetLike = new StyleSheet();
sheet.replaceSync(`
  :host {
    display: block;
    position: sticky;
    top: 0;
    z-index: 50;
  }

  .nav-scroll-sentinel {
    position: absolute;
    top: 0;
    left: 0;
    width: 1px;
    height: 1px;
    pointer-events: none;
    opacity: 0;
  }

  .nav-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: var(--nav-height, 56px);
    padding: 0 var(--space-xl, 32px);
    transition: background 150ms ease, border-color 150ms ease;
  }

  :host([scrolled]) .nav-inner {
    background: var(--nav-bg, var(--bg-canvas));
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--color-border);
  }

  :host(:not([scrolled])) .nav-inner {
    background: transparent;
    border-bottom: 1px solid transparent;
  }

  /* Logo */
  .logo {
    font-size: 18px;
    font-weight: var(--font-weight-semibold, 600);
    letter-spacing: -0.02em;
    color: var(--color-text-primary);
    text-decoration: none;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .logo:hover {
    opacity: 0.8;
  }

  /* Desktop nav links - center */
  .nav-links {
    display: flex;
    gap: var(--space-lg, 24px);
    align-items: center;
  }
  .nav-links a {
    font-size: var(--nav-link-size, 14px);
    color: var(--nav-link-color, var(--color-text-secondary));
    text-decoration: none;
    white-space: nowrap;
    transition: color 150ms ease;
  }
  .nav-links a:hover {
    color: var(--nav-link-hover, var(--color-text-primary));
  }
  .nav-links a[aria-current="page"] {
    color: var(--color-text-primary);
    font-weight: var(--font-weight-medium, 500);
  }

  /* Right side */
  .nav-actions {
    display: flex;
    gap: var(--space-xs, 8px);
    align-items: center;
    flex-shrink: 0;
  }

  .btn-github,
  .btn-cta {
    display: inline-flex;
    align-items: center;
    font-family: var(--font-sans);
    font-weight: var(--font-weight-medium, 500);
    font-size: 14px;
    text-decoration: none;
    white-space: nowrap;
    cursor: pointer;
    transition: all 150ms ease;
    box-sizing: border-box;
  }

  .btn-github {
    padding: 8px 14px;
    border-radius: var(--radius-md, 8px);
    background: var(--surface-1);
    color: var(--color-text-primary);
    border: 1px solid var(--color-border);
    gap: 6px;
  }
  .btn-github:hover {
    background: var(--surface-2);
    border-color: var(--color-border-hover);
  }

  .btn-cta {
    padding: 8px 14px;
    border-radius: var(--radius-md, 8px);
    background: var(--color-brand);
    color: #ffffff;
    border: 1px solid var(--color-brand);
  }
  .btn-cta:hover {
    background: var(--color-brand-hover);
    border-color: var(--color-brand-hover);
  }

  /* Hamburger button */
  .hamburger {
    display: none;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: none;
    border-radius: var(--radius-sm, 6px);
    background: transparent;
    color: var(--color-text-secondary);
    cursor: pointer;
    padding: 0;
  }
  .hamburger:hover {
    background: var(--surface-1);
    color: var(--color-text-primary);
  }

  /* Mobile overlay */
  .overlay {
    display: none;
    position: fixed;
    inset: 0;
    z-index: 100;
    background: var(--bg-canvas);
    padding-top: calc(var(--nav-height, 56px) + 24px);
    overflow-y: auto;
  }
  .overlay[open] {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .overlay-close {
    position: absolute;
    top: calc(var(--nav-height, 56px) / 2 - 12px);
    right: var(--space-xl, 32px);
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: none;
    border-radius: var(--radius-sm, 6px);
    background: transparent;
    color: var(--color-text-secondary);
    cursor: pointer;
    padding: 0;
  }
  .overlay-close:hover {
    color: var(--color-text-primary);
  }

  .overlay-links {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-lg, 24px);
    padding: var(--space-xxl, 48px) var(--space-xl, 32px);
  }
  .overlay-links a {
    font-size: 24px;
    color: var(--nav-link-color, var(--color-text-secondary));
    text-decoration: none;
    transition: color 150ms ease;
  }
  .overlay-links a:hover,
  .overlay-links a[aria-current="page"] {
    color: var(--color-text-primary);
  }

  .overlay-actions {
    display: flex;
    flex-direction: column;
    gap: var(--space-md, 16px);
    width: 100%;
    max-width: 280px;
    padding: 0 var(--space-xl, 32px);
  }
  .overlay-actions a {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12px 20px;
    border-radius: var(--radius-md, 8px);
    font-family: var(--font-sans);
    font-weight: var(--font-weight-medium, 500);
    font-size: 16px;
    text-decoration: none;
    text-align: center;
  }
  .overlay-actions .btn-github {
    background: var(--surface-1);
    color: var(--color-text-primary);
    border: 1px solid var(--color-border);
  }
  .overlay-actions .btn-cta {
    background: var(--color-brand);
    color: #ffffff;
    border: 1px solid var(--color-brand);
  }

  /* Mobile breakpoint */
  @media (max-width: 767px) {
    .nav-links,
    .nav-actions {
      display: none;
    }
    .hamburger {
      display: flex;
    }
  }
`);

export class OpenNavLinear extends OpenElement {
  static override styles = [linearTokenSheet, sheet];
  static override observedAttributes = ['current-path', 'logo-text', 'github-url', 'nav-links'];

  private _menuOpen = signal(false);
  private _scrollObserver: IntersectionObserver | null = null;

  override render(): ReturnType<typeof OpenElement.prototype.render> {
    const currentPath = this.getAttribute('current-path') || '';
    const logoText = this.getAttribute('logo-text') || 'openElement';
    const githubUrl = this.getAttribute('github-url') ||
      'https://github.com/openelement/openelement';
    const navLinks = this._parseNavLinks();

    return (
      <div className='nav-inner' part='container'>
        <div className='nav-scroll-sentinel'></div>

        <a className='logo' part='logo' href='/'>{this._esc(logoText)}</a>

        <nav className='nav-links' part='links' aria-label='Primary navigation'>
          {navLinks.map((link) => (
            <a
              href={this._escAttr(link.href)}
              aria-current={currentPath === link.href ? 'page' : undefined}
            >
              {this._esc(link.label)}
            </a>
          ))}
        </nav>

        <div className='nav-actions'>
          <a
            className='btn-github'
            part='github'
            href={this._escAttr(githubUrl)}
            aria-label='GitHub repository'
          >
            <svg width='16' height='16' viewBox='0 0 16 16' fill='currentColor'>
              <path d='M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z' />
            </svg>
            GitHub
          </a>
          <a className='btn-cta' part='cta' href='/docs'>Get started</a>
        </div>

        <button
          type='button'
          className='hamburger'
          part='hamburger'
          aria-label='Toggle navigation'
          aria-expanded={this._menuOpen.value ? 'true' : 'false'}
          onClick={() => this._toggleMenu()}
        >
          <svg
            width='18'
            height='18'
            viewBox='0 0 18 18'
            fill='none'
            stroke='currentColor'
            stroke-width='1.5'
            stroke-linecap='round'
          >
            <line x1='3' y1='4.5' x2='15' y2='4.5' />
            <line x1='3' y1='9' x2='15' y2='9' />
            <line x1='3' y1='13.5' x2='15' y2='13.5' />
          </svg>
        </button>

        <div className='overlay' part='overlay' open={this._menuOpen.value || undefined}>
          <button
            type='button'
            className='overlay-close'
            aria-label='Close navigation'
            onClick={() => this._toggleMenu()}
          >
            <svg
              width='18'
              height='18'
              viewBox='0 0 18 18'
              fill='none'
              stroke='currentColor'
              stroke-width='1.5'
              stroke-linecap='round'
            >
              <line x1='3' y1='3' x2='15' y2='15' />
              <line x1='15' y1='3' x2='3' y2='15' />
            </svg>
          </button>
          <div className='overlay-links'>
            {navLinks.map((link) => (
              <a
                href={this._escAttr(link.href)}
                aria-current={currentPath === link.href ? 'page' : undefined}
                onClick={() => this._toggleMenu()}
              >
                {this._esc(link.label)}
              </a>
            ))}
          </div>
          <div className='overlay-actions'>
            <a className='btn-github' href={this._escAttr(githubUrl)}>GitHub</a>
            <a className='btn-cta' href='/docs'>Get started</a>
          </div>
        </div>
      </div>
    );
  }

  // --- Lifecycle ---

  override connectedCallback(): void {
    super.connectedCallback();
    this._setupScrollDetection();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._teardownScrollDetection();
  }

  override attributeChangedCallback(_name: string, old: string | null, val: string | null): void {
    if (old === val) return;
    this.update();
  }

  // --- Scroll detection via IntersectionObserver on a sentinel ---

  private _setupScrollDetection(): void {
    // Wait for shadow root to be available
    requestAnimationFrame(() => {
      const sentinel = this.shadowRoot?.querySelector('.nav-scroll-sentinel');
      if (!sentinel) return;

      this._scrollObserver = new IntersectionObserver(
        ([entry]) => {
          // sentinel is at top: when scrolled, it's not intersecting
          this.toggleAttribute('scrolled', !entry.isIntersecting);
        },
        { rootMargin: '-1px 0px 0px 0px' },
      );
      this._scrollObserver.observe(sentinel);
    });
  }

  private _teardownScrollDetection(): void {
    this._scrollObserver?.disconnect();
    this._scrollObserver = null;
  }

  // --- Mobile menu ---

  private _toggleMenu(): void {
    this._menuOpen.value = !this._menuOpen.value;
    this.update();
  }

  // --- Helpers ---

  private _parseNavLinks(): NavLink[] {
    try {
      const raw = this.getAttribute('nav-links');
      if (raw) return JSON.parse(raw);
      return [];
    } catch {
      return [];
    }
  }

  private _esc = escapeHtml;
  private _escAttr = escapeAttr;
}

export default OpenNavLinear;

// Guard: idempotent across SSR paths
if (typeof customElements !== 'undefined' && !customElements.get(tagName)) {
  customElements.define(tagName, OpenNavLinear);
}
