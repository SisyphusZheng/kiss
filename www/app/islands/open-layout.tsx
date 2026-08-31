/** @jsxImportSource @openelement/element */
/** Compiler-owned WWW app shell (v0.44, ADR-0143). */
import { defineIslandConfig } from '@openelement/app';
import { OpenElement } from '@openelement/element';
import '@openelement/ui/open-theme-toggle';
import { compiledStyle } from '../site-ui/compiled-style.ts';
import './open-search.tsx';

interface HeaderNavLink {
  href: string;
  label: string;
}

declare function element(tag: string): ClassDecorator;
declare function property(
  options: { reflect: boolean; attribute?: false },
): (target: undefined, context: ClassFieldDecoratorContext) => void;

export const openElement = defineIslandConfig({ hydrate: 'load', ssr: true, dsd: true });

@element('open-layout')
export default class OpenLayout extends OpenElement {
  static override styles = [compiledStyle(`
  :host {
    display: block;
  }

  * { font-family: var(--font-sans); }

  .app-layout {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background: var(--bg-base);
    color: var(--text-primary);
    font-family: var(--font-sans);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  .layout-body {
    display: flex;
    flex: 1;
    max-width: none;
    margin: 0 auto;
    width: 100%;
    background:
      linear-gradient(90deg, color-mix(in srgb, var(--border) 18%, transparent) 1px, transparent 1px),
      var(--bg-base);
    background-size: 220px 100%;
  }

  .layout-main {
    flex: 1;
    min-width: 0;
    width: 100%;
    isolation: isolate;
  }

  /* Header */
  .app-header {
    position: sticky;
    top: 0;
    z-index: 100;
    background: var(--nav-bg);
    border-bottom: var(--border-size-1) solid var(--border);
    backdrop-filter: blur(18px) saturate(150%);
    -webkit-backdrop-filter: blur(18px) saturate(150%);
    transition: background .32s var(--motion-standard), border-color .32s var(--motion-standard), box-shadow .32s var(--motion-standard), padding .32s var(--motion-standard);
  }
  .header-inner {
    max-width: none;
    margin: 0 auto;
    padding: 0 clamp(var(--size-5), 3.5vw, var(--size-9));
    display: flex;
    align-items: center;
    min-height: var(--nav-height);
    gap: var(--size-6);
  }

  .mobile-menu-btn {
    display: none;
    align-items: center;
    justify-content: center;
    width: var(--size-10);
    height: var(--size-10);
    border: var(--border-size-1) solid var(--border);
    border-radius: var(--radius-round);
    background: color-mix(in srgb, var(--bg-elevated) 74%, transparent);
    color: var(--text-secondary);
    cursor: pointer;
    padding: 0;
    transition: all 0.15s ease;
  }
  .mobile-menu-btn:hover {
    color: var(--text-primary);
    border-color: var(--border-hover);
    background: var(--bg-hover);
  }
  .mobile-menu {
    position: relative;
  }
  .mobile-menu-btn {
    list-style: none;
  }
  .mobile-menu-btn::-webkit-details-marker {
    display: none;
  }
  .mobile-menu-btn::marker {
    content: "";
  }
  .mobile-menu-label {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
  .mobile-menu-icon {
    font-size: var(--font-size-2);
    line-height: 1;
  }
  .mobile-menu-panel {
    position: absolute;
    inset-block-start: calc(100% + var(--size-2));
    inset-inline-end: 0;
    z-index: 110;
    display: grid;
    min-width: 12rem;
    padding: var(--size-2);
    border: var(--border-size-1) solid var(--border);
    border-radius: var(--radius-2);
    background: var(--bg-elevated);
    box-shadow: var(--shadow-2);
  }
  .mobile-menu-panel a {
    padding: var(--size-2) var(--size-3);
    border-radius: var(--radius-1);
    color: var(--text-secondary);
    font-family: var(--font-mono);
    font-size: var(--font-size-00);
    text-decoration: none;
  }
  .mobile-menu-panel a:hover,
  .mobile-menu-panel a:focus-visible {
    color: var(--text-primary);
    background: var(--bg-hover);
  }

  .logo {
    display: inline-flex;
    align-items: center;
    gap: var(--size-3);
    flex: 0 0 auto;
    min-height: var(--size-10);
    width: 52px;
    min-width: 52px;
    max-width: 52px;
    background: transparent;
    font-size: var(--font-size-3);
    font-weight: var(--font-weight-8);
    color: var(--text-primary);
    text-decoration: none;
    letter-spacing: 0;
    white-space: nowrap;
  }

  .logo:hover .logo-glyph {
    transform: translateY(calc(var(--border-size-1) * -1));
  }

  .logo-glyph {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    align-self: center;
    width: 48px;
    height: 48px;
    max-width: 100%;
    color: var(--text-primary);
    font-family: var(--font-mono);
    font-size: var(--font-size-00);
    font-weight: 800;
    letter-spacing: -.09em;
    line-height: 1;
    white-space: nowrap;
    transition: transform var(--duration-2) var(--ease-2);
    view-transition-name: open-brand-mark;
  }

  .logo:focus-visible {
    outline: var(--focus-size) solid var(--focus-ring);
    outline-offset: var(--focus-offset);
    border-radius: var(--radius-2);
  }

  .header-nav {
    display: flex;
    gap: var(--size-1);
    flex: 1;
    min-width: 0;
    justify-content: center;
    width: fit-content;
    max-width: fit-content;
    margin-inline: auto;
    padding: var(--size-1);
    border: var(--border-size-1) solid color-mix(in srgb, var(--border) 78%, var(--brand));
    border-radius: var(--radius-round);
    background: color-mix(in srgb, var(--bg-elevated) 68%, transparent);
    box-shadow: inset 0 1px 0 var(--edge-highlight);
  }
  .header-nav a {
    color: var(--nav-link-color);
    text-decoration: none;
    font-weight: var(--font-weight-5);
    padding: var(--size-2) var(--size-4);
    border-radius: var(--radius-round);
    font-family: var(--font-mono);
    font-size: var(--font-size-00);
    letter-spacing: .02em;
    transition: color .2s var(--motion-standard), background .2s var(--motion-standard), transform .2s var(--motion-standard);
  }
  .header-nav a:hover {
    color: var(--nav-link-hover);
    background: color-mix(in srgb, var(--brand) 10%, transparent);
    transform: translateY(-1px);
  }
  .header-nav a[aria-current="page"] {
    color: var(--text-primary);
    font-weight: var(--font-weight-8);
    background: color-mix(in srgb, var(--brand) 18%, var(--bg-elevated));
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--brand) 44%, transparent);
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: var(--size-1);
    margin-left: auto;
  }

  /* Footer */
  .app-footer {
    border-top: var(--border-size-1) solid var(--border);
    background: color-mix(in srgb, var(--bg-elevated) 58%, transparent);
  }
  /* Responsive */
  @media (max-width: 1120px) {
    .header-inner {
      gap: var(--size-3);
      padding-inline: var(--size-4);
    }

    .header-nav {
      gap: var(--size-3);
    }
  }

  @media (max-width: 1040px) {
    .header-nav { display: none; }
  }

  @media (max-width: 900px) {
    .mobile-menu-btn { display: flex; }
    .header-inner { padding: 0 var(--size-4); gap: var(--size-2); }
    .header-nav { display: none; }
    .header-right { gap: 4px; }

    .layout-main { width: 100%; }
    .app-footer { padding: 0; }
  }

  @media (max-width: 768px) {
    .header-right { gap: 4px; }
  }
  @media (max-width: 480px) {
    .header-inner { padding: 0 var(--size-3); gap: var(--size-1); }
  }
`)];

  @property({ reflect: false })
  headerNav: HeaderNavLink[] = [];

  @property({ reflect: false })
  footerText = 'Built with OpenElement';

  @property({ reflect: false })
  siteName = 'openElement';

  @property({ reflect: false })
  homeHref = '/';

  render() {
    return (
      <div class='app-layout' part='container'>
        <header class='app-header' part='header'>
          <div class='header-inner'>
            <a class='logo' href={this.homeHref} aria-label={this.siteName}>
              <span class='logo-glyph' aria-hidden='true'>OE</span>
            </a>
            <nav class='header-nav' part='nav' aria-label='Primary navigation'>
              {this.headerNav.map((link) => (
                <a key={link.href} href={link.href} rel='noopener noreferrer'>{link.label}</a>
              ))}
            </nav>
            <div class='header-right'>
              <open-search></open-search>
              <open-theme-toggle></open-theme-toggle>
              <details class='mobile-menu'>
                <summary class='mobile-menu-btn'>
                  <span class='mobile-menu-label'>Open navigation</span>
                  <span class='mobile-menu-icon' aria-hidden='true'>☰</span>
                </summary>
                <nav class='mobile-menu-panel' aria-label='Mobile navigation'>
                  {this.headerNav.map((link) => (
                    <a key={link.href} href={link.href} rel='noopener noreferrer'>{link.label}</a>
                  ))}
                </nav>
              </details>
            </div>
          </div>
        </header>
        <div class='layout-body'>
          <main class='layout-main' part='main'>
            <slot></slot>
          </main>
        </div>
        <footer class='app-footer' part='footer'>
          <span>{this.footerText}</span>
          <span aria-hidden='true'>·</span>
          <a href='https://github.com/open-element/openelement' rel='noopener noreferrer'>GitHub</a>
        </footer>
      </div>
    );
  }
}
