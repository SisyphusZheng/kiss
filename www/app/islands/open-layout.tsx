/** @jsxImportSource @openelement/element */
/** Compiler-owned WWW app shell (v0.44, ADR-0143). */
import { defineIslandConfig } from '@openelement/app';
import { OpenElement } from '@openelement/element';
import '@openelement/ui/open-theme-toggle';
import { compiledStyle } from '../site-ui/compiled-style.ts';

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

  .app-layout[home] .layout-body,
  .app-layout[full-width] .layout-body {
    display: flex;
    flex-direction: column;
    max-width: none;
  }

  .app-layout[home] .layout-main,
  .app-layout[full-width] .layout-main {
    flex: 1;
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
  .app-header.scrolled {
    background: color-mix(in srgb, var(--bg-base) 88%, transparent);
    border-bottom-color: var(--border-hover);
    box-shadow: 0 var(--size-2) var(--size-10) color-mix(in srgb, var(--brand) 5%, transparent);
  }
  .app-layout[home] .app-header:not(.scrolled) {
    background: linear-gradient(to bottom, color-mix(in srgb, var(--bg-base) 45%, transparent), transparent);
    border-bottom-color: transparent;
    box-shadow: none;
  }
  .app-layout[home] .app-header.scrolled {
    background: color-mix(in srgb, var(--bg-base) 88%, transparent);
    border-bottom-color: var(--border-hover);
    box-shadow: 0 var(--size-2) var(--size-10) color-mix(in srgb, var(--brand) 12%, transparent);
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

  .mobile-tab-bar { display: none; }

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

  .logo-slash {
    color: var(--brand);
  }
  .logo:focus-visible {
    outline: var(--focus-size) solid var(--focus-ring);
    outline-offset: var(--focus-offset);
    border-radius: var(--radius-2);
  }

  .logo-sub {
    font-size: var(--font-size-00);
    color: var(--text-muted);
    margin-left: var(--size-2);
    font-family: var(--font-mono);
    font-weight: var(--font-weight-8);
    text-transform: uppercase;
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
    font-size: var(--font-size-1);
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

  .lang-switch {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: var(--size-9);
    width: var(--size-9);
    height: var(--size-9);
    padding: 0;
    font-size: var(--font-size-button);
    font-weight: var(--font-weight-semibold);
    color: var(--text-secondary);
    border: 0;
    border-radius: var(--radius-round);
    background: transparent;
    cursor: pointer;
    text-decoration: none;
    transition: all 0.15s ease;
  }
  .lang-switch:hover {
    color: var(--brand-deep);
    border-color: transparent;
    background: color-mix(in srgb, var(--brand-pale) 34%, transparent);
  }

  /* Sidebar */
  .docs-sidebar {
    width: clamp(200px, 20vw, 260px);
    flex-shrink: 0;
    border-right: var(--border-size-1) solid var(--border);
    padding: 2rem 0;
    overflow-y: auto;
    height: calc(100vh - var(--nav-height));
    position: sticky;
    top: var(--nav-height);
    scrollbar-width: thin;
    background: linear-gradient(180deg,color-mix(in srgb,var(--violet-2) 26%,var(--bg-base)),color-mix(in srgb,var(--bg-elevated) 72%,transparent));
    backdrop-filter: blur(20px) saturate(140%);
    box-shadow: inset -1px 0 0 color-mix(in srgb,var(--brand) 10%,transparent);
  }
  :host([home]) .docs-sidebar,
  :host([full-width]) .docs-sidebar {
    width: 0; min-width: 0; padding: 0;
    overflow: hidden; border-right: none;
  }

  .nav-section { margin-bottom: 1.5rem; }
  .nav-section summary {
    font-size: var(--font-size-micro);
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.22em;
    color: var(--text-muted);
    padding: 0 1.5rem;
    margin-bottom: 0.5rem;
    cursor: pointer;
    list-style: none;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    user-select: none;
  }
  .nav-section summary::-webkit-details-marker { display: none; }
  .nav-section summary::marker { content: ""; }
  .nav-section summary:hover { color: var(--text-secondary); }

  .docs-sidebar a {
    display: block;
    color: var(--text-muted);
    text-decoration: none;
    font-size: var(--font-size-tiny);
    margin: .12rem .7rem;
    padding: .5rem .8rem;
    border-left: 2px solid transparent;
    border-radius: var(--radius-2);
    transition: color 0.15s ease, border-color 0.15s ease, background 0.15s ease;
  }
  .docs-sidebar a:hover {
    color: var(--text-secondary);
    background: var(--bg-hover);
  }
  .docs-sidebar a.active,
  .docs-sidebar a[aria-current="page"] {
    color: var(--brand);
    border-left-color: var(--brand);
    background: var(--brand-subtle);
    font-weight: 600;
  }

  /* Footer */
  .app-footer {
    border-top: var(--border-size-1) solid var(--border);
    background: color-mix(in srgb, var(--bg-elevated) 58%, transparent);
  }
  .footer-inner {
    max-width: 1240px;
    margin: 0 auto;
    padding: var(--size-16) var(--size-8);
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--size-8);
  }
  .footer-heading {
    display: block;
    font-size: var(--font-size-button);
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
    margin: 0 0 var(--size-4);
  }
  .footer-column a {
    display: block;
    color: var(--text-secondary);
    text-decoration: none;
    font-size: var(--font-size-body-sm);
    padding: 4px 0;
    transition: color 0.15s ease;
  }
  .footer-column a:hover {
    color: var(--text-primary);
  }
  .footer-bottom {
    border-top: var(--border-size-1) solid var(--border);
    padding: var(--size-4) var(--size-8);
    max-width: 1240px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: var(--text-muted);
    font-size: var(--font-size-body-sm);
  }
  .footer-bottom a {
    color: var(--text-secondary);
    text-decoration: none;
    transition: color 0.15s ease;
  }
  .footer-bottom a:hover {
    color: var(--text-primary);
  }

  /* Mobile backdrop */
  .mobile-backdrop {
    position: fixed; inset: 0; top: var(--nav-height);
    background: var(--overlay);
    z-index: 80; opacity: 0; pointer-events: none;
    transition: opacity 0.3s ease;
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

    .docs-sidebar {
      position: fixed; top: var(--nav-height); left: 0;
      width: min(280px, 80vw);
      height: calc(100vh - var(--nav-height)); z-index: 90;
      background: var(--bg-elevated);
      border-right: var(--border-size-1) solid var(--border);
      padding: 1rem 0; overflow-y: auto;
      transform: translateX(-101%);
      transition: transform 0.25s cubic-bezier(0.4,0,0.2,1);
      will-change: transform;
    }
    :host([menu-open]) .docs-sidebar {
      transform: translateX(0);
      box-shadow: var(--shadow-1);
    }
    :host([menu-open]) .mobile-backdrop { opacity: 1; pointer-events: auto; }
    .nav-section { margin-bottom: 0.5rem; }
    .nav-section summary { padding: var(--size-2) var(--size-4); }
    .docs-sidebar a { padding: 0.5rem 1rem 0.5rem 2rem; }
    .layout-main { width: 100%; }
    .app-footer { padding: 0; }
    .footer-inner {
      grid-template-columns: repeat(2, 1fr);
      padding: var(--size-12) var(--size-4);
      padding-bottom: calc(var(--size-12) + var(--size-16));
    }
    .footer-bottom {
      flex-direction: column;
      gap: var(--size-2);
      padding: var(--size-4);
      padding-bottom: calc(var(--size-4) + var(--size-16));
      text-align: center;
    }

    .mobile-tab-bar {
      display: flex; position: fixed; bottom: 0; left: 0; right: 0;
      height: 56px; z-index: 100;
      background: var(--nav-bg);
      backdrop-filter: blur(12px) saturate(180%);
      -webkit-backdrop-filter: blur(12px) saturate(180%);
      border-top: var(--border-size-1) solid var(--border);
      padding: 0 env(safe-area-inset-right) 0 env(safe-area-inset-left);
      padding-bottom: env(safe-area-inset-bottom);
    }
    .tab-item {
      flex: 1; display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: 2px;
      color: var(--text-muted);
      text-decoration: none; font-size: var(--font-size-micro); font-weight: 600;
      transition: color 0.15s ease;
      -webkit-tap-highlight-color: transparent; padding: 4px 0;
    }
    .tab-item svg { width: 20px; height: 20px; flex-shrink: 0; }
    .tab-item:hover { color: var(--text-secondary); }
    .tab-item.active { color: var(--brand); }
  }

  @media (max-width: 768px) {
    .header-right { gap: 4px; }
    .lang-switch { display: none; }
  }
  @media (max-width: 480px) {
    .header-inner { padding: 0 var(--size-3); gap: var(--size-1); }
  }
`)];

  @property({ reflect: false, attribute: false })
  headerNav: HeaderNavLink[] = [];

  @property({ reflect: false })
  footerText = 'Built with OpenElement';

  @property({ reflect: false })
  siteName = 'openElement';

  render() {
    return (
      <div class='app-layout' part='container'>
        <header class='app-header' part='header'>
          <div class='header-inner'>
            <a class='logo' href='/' aria-label={this.siteName}>
              <span class='logo-glyph' aria-hidden='true'>OE</span>
            </a>
            <nav class='header-nav' part='nav' aria-label='Primary navigation'>
              {this.headerNav.map((link) => (
                <a key={link.href} href={link.href} rel='noopener noreferrer'>{link.label}</a>
              ))}
            </nav>
            <div class='header-right'>
              <open-theme-toggle></open-theme-toggle>
              <details class='mobile-menu'>
                <summary class='mobile-menu-btn' aria-label='Open navigation'>Menu</summary>
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
