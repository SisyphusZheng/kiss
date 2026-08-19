/** @jsxImportSource @openelement/element */
/**
 * www/app/islands - open-layout
 *
 * App layout component with header, sidebar, and footer.
 * Web Standards Lab: dark-first, cinematic at the brand surface and calm in
 * long-form reading modes.
 *
 * Behavior boundaries (#995): navigation/locale policy lives in
 * site-ui/open-layout-navigation.ts, mobile-menu/theme/scroll behaviors in
 * site-ui/open-layout-behaviors.ts; this class keeps shell structure and slots.
 * Menu open/close runs through a single delegated document listener via
 * composedPath(), so DSD upgrade and SPA shadow-root replacement share it.
 *
 * @csspart container - The app-layout root div
 * @csspart header - The sticky header element
 * @csspart sidebar - The docs-sidebar nav
 * @csspart main - The layout-main element
 * @csspart footer - The app-footer element
 * @csspart nav - The header-nav element
 * @csspart nav-toggle - The mobile menu toggle button
 *
 * Usage:
 * ```html
 * <open-layout current-path="/guide/getting-started"
 *   nav-items='[{"section":"Guide","items":[{"path":"/guide/getting-started","label":"Getting Started"}]}]'>
 * </open-layout>
 * ```
 */

import { OpenElement } from '@openelement/element';
import { StyleSheet, type StyleSheetLike } from '@openelement/element';
import { createLogger } from '@openelement/element';
import { defineCustomElement } from '@openelement/element';
import { defineIslandConfig } from '@openelement/app';
import { normalizeLocalePath } from '@openelement/app/i18n';
import { getBool, getStr } from '../site-ui/get-str.ts';
import {
  filterNavSections,
  type HeaderNavLink,
  isExternalLayoutUrl,
  isSafeLayoutUrl,
  localeSwitchLabel,
  localeSwitchPath,
  localeSwitchScopeNote,
  localizeLayoutPath,
  mobileSectionRoot,
  type NavSection,
} from '../site-ui/open-layout-navigation.ts';
import {
  installLayoutScrollState,
  isMobileMenuToggle,
  propagateLayoutTheme,
  setMobileMenuState,
  shouldDismissMobileMenu,
} from '../site-ui/open-layout-behaviors.ts';
import '@openelement/ui/open-theme-toggle';

export const tagName = 'open-layout';
export const openElement = defineIslandConfig({ hydrate: 'load', ssr: true, dsd: true });
const log = createLogger('ui');

// Shell presentation consumes shared tokens from packages/ui/src/open-props-tokens.ts
// (the single token source of truth); this sheet holds only shell-structure CSS, so the
// "shared presentation tokens" boundary stays with the token layer, not this file (#995).
const sheet: StyleSheetLike = new StyleSheet();
sheet.replaceSync(`
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
  .footer-column h4 {
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
`);

export class OpenLayout extends OpenElement {
  private _scrollCleanup?: () => void;

  private get _locales(): string[] {
    try {
      const raw = (this as Record<string, unknown>).locales || this.getAttribute('locales');
      if (raw) {
        if (Array.isArray(raw)) return raw as string[];
        if (typeof raw === 'string') {
          try {
            return JSON.parse(raw);
          } catch { /* ignore */ }
        }
      }
      return ['en'];
    } catch {
      return ['en'];
    }
  }

  private get _defaultLocale(): string {
    return this.getAttribute('locale') || this._locales[0] || 'en';
  }

  private get _currentLocale(): string {
    try {
      if (typeof globalThis.location !== 'undefined') {
        return normalizeLocalePath(location.pathname, {
          locales: this._locales,
          defaultLocale: this._defaultLocale,
        }).locale;
      }
      return this._defaultLocale;
    } catch {
      return this._defaultLocale;
    }
  }

  private get _currentPathWithoutLocale(): string {
    try {
      if (typeof globalThis.location !== 'undefined') {
        return normalizeLocalePath(location.pathname, {
          locales: this._locales,
          defaultLocale: this._defaultLocale,
        }).path;
      }
      return this.getAttribute('current-path') || '/';
    } catch {
      return '/';
    }
  }

  static override styles = [sheet];
  static override observedAttributes = [
    'current-path',
    'nav-items',
    'header-nav',
    'logo-sub',
    'locale',
    'locales',
  ];

  private _themeHandler?: (e: Event) => void;
  private _docClickCleanup?: () => void;

  override render(): ReturnType<typeof OpenElement.prototype.render> {
    return this._renderLayout();
  }

  // Locale path math goes through @openelement/app/i18n (normalizeLocalePath);
  // Pure locale and navigation policy lives in open-layout-navigation.ts.
  // Prop-first boolean reads use getBool from get-str.ts.

  private _currentPath(): string {
    // SSR-safe: prefer attribute/prop set by renderDsd over URL detection
    // location.pathname is undefined during build.
    const prop = (this as Record<string, unknown>).currentPath;
    if (typeof prop === 'string' && prop.length > 0) return prop;
    const attr = this.getAttribute('current-path');
    if (attr && attr.length > 0) return attr;
    try {
      if (typeof globalThis.location !== 'undefined') {
        return normalizeLocalePath(location.pathname, {
          locales: this._locales,
          defaultLocale: this._defaultLocale,
        }).path;
      }
      return this.getAttribute('current-path') || '/';
    } catch {
      return '/';
    }
  }

  private _homeHref(): string {
    try {
      const pathname = globalThis.location?.pathname || getStr(this, 'current-path', '/');
      // Built from the injected `locales` attribute so newly added locales
      // keep working. www/public/logo-home.js mirrors this pattern — public
      // scripts are static assets and cannot import app modules.
      const localePrefixRe = new RegExp(`^/(${this._locales.join('|')})(?:/|$)`);
      const locale = pathname.match(localePrefixRe)?.[1];
      return locale ? `/${locale}/` : '/';
    } catch {
      return '/';
    }
  }

  private _navItems(): NavSection[] {
    const items = this._rawNavItems();
    return this._filterByPath(items);
  }

  /** Auto-filter sidebar sections by current path prefix. */
  private _filterByPath(items: NavSection[]): NavSection[] {
    return filterNavSections(items, this._currentPath());
  }

  private _rawNavItems(): NavSection[] {
    try {
      const prop = (this as Record<string, unknown>).navItems;
      if (prop && Array.isArray(prop)) return prop as NavSection[];
      const raw = this.getAttribute('nav-items');
      if (raw) return JSON.parse(raw);
      return [];
    } catch (e) {
      log.warn('Failed to parse nav-items JSON:', e);
      return [];
    }
  }

  private _headerNav(): HeaderNavLink[] {
    try {
      const prop = (this as Record<string, unknown>).headerNav;
      if (prop && Array.isArray(prop)) return prop as HeaderNavLink[];
      const raw = this.getAttribute('header-nav');
      if (raw) return JSON.parse(raw);
      return [];
    } catch (e) {
      log.warn('Failed to parse header-nav JSON:', e);
      return [];
    }
  }

  // --- Icons ---

  /** v0.24.1: SVG icon attributes shared across all mobile tab bar icons. */
  private static _ICON_ATTRS = {
    viewBox: '0 0 20 20',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '1.5',
    'stroke-linecap': 'round' as const,
    'stroke-linejoin': 'round' as const,
  };

  /** v0.24.1: Render mobile tab icon as JSX SVG. Falls back to a generic shape. */
  private _renderIcon(label: string) {
    const a = OpenLayout._ICON_ATTRS;
    switch (label) {
      case 'Docs':
      case 'Blog':
        return (
          <svg {...a}>
            <rect x='3' y='2' width='14' height='16' rx='2' />
            <path d='M7 6h6M7 10h6M7 14h3' />
          </svg>
        );
      case 'Roadmap':
        return (
          <svg {...a}>
            <circle cx='4' cy='6' r='1.5' />
            <circle cx='10' cy='10' r='1.5' />
            <circle cx='16' cy='14' r='1.5' />
            <path d='M5.5 6h10M11.5 10h5' />
          </svg>
        );
      default:
        return (
          <svg {...a}>
            <circle cx='10' cy='10' r='8' />
            <path d='M6 6l3 5 5 3-3-5z' />
          </svg>
        );
    }
  }

  private _safeHref(href: string | undefined, fallback = '#'): string {
    if (!href) return fallback;
    const trimmed = href.trim();
    return isSafeLayoutUrl(trimmed) ? trimmed : fallback;
  }

  private _isExternalHref(href: string): boolean {
    return isExternalLayoutUrl(href);
  }

  private _localizedSafeHref(href: string | undefined): { href: string; isExternal: boolean } {
    const safeHref = this._safeHref(href);
    const isExternal = this._isExternalHref(safeHref);
    return {
      href: isExternal
        ? safeHref
        : localizeLayoutPath(safeHref, this._currentLocale, this._locales, this._defaultLocale),
      isExternal,
    };
  }

  // --- Main render ---

  private _renderLayout() {
    const home = getBool(this, 'full-width') || getBool(this, 'home');
    const noSearch = this.hasAttribute('no-search');
    const logoSub = getStr(this, 'logo-sub', '');
    const locales = this._locales;
    const defaultLocale = this._defaultLocale;
    const currentLocale = this._currentLocale;
    const currentPath = this._currentPathWithoutLocale;
    const langLabel = locales.length > 1 ? localeSwitchLabel(currentLocale) : '';
    const langHref = locales.length > 1
      ? localeSwitchPath(currentPath, currentLocale, locales, defaultLocale)
      : '';
    const localePath = (path: string) =>
      localizeLayoutPath(path, currentLocale, locales, defaultLocale);

    return (
      <div className='app-layout' part='container' home={home || undefined}>
        <header className='app-header' part='header'>
          <nav className='header-inner' aria-label='Primary navigation'>
            <a
              className='logo'
              href={this._homeHref()}
              data-nav='/'
              data-open-brand
              aria-label='OpenElement home'
            >
              <span className='logo-glyph' aria-hidden='true'>
                &lt;open<span className='logo-slash'>/</span>&gt;
              </span>
              {logoSub && <span className='logo-sub'>{logoSub}</span>}
            </a>
            {this._renderHeaderNav()}
            <div className='header-right'>
              {!noSearch && <open-search></open-search>}
              {!home && (
                <button
                  type='button'
                  className='mobile-menu-btn'
                  part='nav-toggle'
                  aria-label='Toggle navigation'
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
              )}
              <open-theme-toggle></open-theme-toggle>
              {locales.length > 1 && (
                <a
                  className='lang-switch'
                  href={langHref}
                  data-nav={langHref}
                  title={localeSwitchScopeNote(currentLocale)}
                  aria-label={localeSwitchScopeNote(currentLocale)}
                >
                  {langLabel}
                </a>
              )}
            </div>
          </nav>
        </header>
        <div className='mobile-backdrop'></div>
        <div className='layout-body'>
          {!home && this._renderSidebarNav()}
          <main className='layout-main' part='main'>
            <slot></slot>
          </main>
        </div>
        <footer className='app-footer' part='footer'>
          <div className='footer-inner'>
            <div className='footer-column'>
              <h4>Product</h4>
              <a
                href={localePath('/guide/core-concepts')}
                data-nav={localePath('/guide/core-concepts')}
              >
                Elements
              </a>
              <a
                href={localePath('/architecture/design-system')}
                data-nav={localePath('/architecture/design-system')}
              >
                UI
              </a>
              <a
                href={localePath('/architecture/architecture')}
                data-nav={localePath('/architecture/architecture')}
              >
                Framework
              </a>
              <a
                href={localePath('/architecture/standards-registry')}
                data-nav={localePath('/architecture/standards-registry')}
              >
                Protocols
              </a>
            </div>
            <div className='footer-column'>
              <h4>Resources</h4>
              <a
                href={localePath('/guide/getting-started')}
                data-nav={localePath('/guide/getting-started')}
              >
                Guide
              </a>
              <a
                href={localePath('/guide/api')}
                data-nav={localePath('/guide/api')}
              >
                API
              </a>
              <a
                href={localePath('/architecture/architecture')}
                data-nav={localePath('/architecture/architecture')}
              >
                Architecture
              </a>
              <a
                href={localePath('/blog')}
                data-nav={localePath('/blog')}
              >
                Blog
              </a>
            </div>
            <div className='footer-column'>
              <h4>Company</h4>
              <a href='https://github.com/open-element/openelement'>GitHub</a>
              <a
                href={localePath('/roadmap')}
                data-nav={localePath('/roadmap')}
              >
                Roadmap
              </a>
              <a
                href={localePath('/changelog')}
                data-nav={localePath('/changelog')}
              >
                Changelog
              </a>
            </div>
            <div className='footer-column'>
              <h4>Legal</h4>
              <a href='https://github.com/open-element/openelement/blob/main/LICENSE'>
                MIT License
              </a>
              <a
                href={localePath('/contributing')}
                data-nav={localePath('/contributing')}
              >
                Contributing
              </a>
            </div>
          </div>
          <div className='footer-bottom'>
            <span>(c) 2026 openElement. MIT License.</span>
          </div>
        </footer>
        {this._renderMobileTabBar()}
      </div>
    );
  }

  private _renderHeaderNav() {
    const links = this._headerNav();
    if (links.length === 0) return null;
    const cp = this._currentPath();
    return (
      <nav className='header-nav' part='nav'>
        {links.map((link) => {
          const { href: localized, isExternal } = this._localizedSafeHref(link.href);
          const isCurrent = !isExternal &&
            (cp === link.href || cp === localized || cp.startsWith(localized + '/'));
          return (
            <a
              href={localized}
              data-nav={isExternal ? '' : localized}
              aria-current={isCurrent ? 'page' : undefined}
            >
              {link.label}
            </a>
          );
        })}
      </nav>
    );
  }

  private _renderSidebarNav() {
    const nav = this._navItems();
    if (nav.length === 0) return null;
    return (
      <nav
        className='docs-sidebar'
        part='sidebar'
        aria-label='Documentation navigation'
      >
        {nav.map((section) => (
          <details className='nav-section' open>
            <summary className='nav-section-title'>
              {section.section}
            </summary>
            {section.items.map((item) => {
              const href = item.href || item.path || '#';
              const { href: localized, isExternal } = this._localizedSafeHref(href);
              const cp = this._currentPath();
              const isActive = !isExternal && cp === localized;
              return (
                <a
                  href={localized}
                  className={isActive ? 'active' : undefined}
                  aria-current={isActive ? 'page' : undefined}
                  data-nav={isExternal ? '' : localized}
                >
                  {item.label}
                </a>
              );
            })}
          </details>
        ))}
      </nav>
    );
  }

  private _renderMobileTabBar() {
    const links = this._headerNav();
    if (links.length === 0) return null;

    const MOBILE_TAB_LIMIT = 5;
    const mobileLinks = links.slice(0, MOBILE_TAB_LIMIT);

    const locs = this._locales;
    const rawPath = this._currentPathWithoutLocale;

    return (
      <nav className='mobile-tab-bar' aria-label='Quick navigation'>
        {mobileLinks.map((link) => {
          const { href: localized, isExternal } = this._localizedSafeHref(link.href);
          const root = mobileSectionRoot(link.href, locs);
          const isActive = !isExternal &&
            (rawPath === root || rawPath.startsWith(root + '/'));
          return (
            <a
              className={`tab-item${isActive ? ' active' : ''}`}
              href={localized}
              data-nav={isExternal ? '' : localized}
              aria-current={isActive ? 'page' : undefined}
            >
              {this._renderIcon(link.label)}
              <span>{link.label}</span>
            </a>
          );
        })}
      </nav>
    );
  }

  // --- Scroll detection ---

  private _setupScrollDetection(): void {
    if (typeof globalThis.window === 'undefined') return;
    this._scrollCleanup = installLayoutScrollState(
      globalThis,
      () => this.shadowRoot?.querySelector('.app-header'),
    );
  }

  private _teardownScrollDetection(): void {
    this._scrollCleanup?.();
    this._scrollCleanup = undefined;
  }

  // --- Lifecycle ---

  override connectedCallback(): void {
    super.connectedCallback();

    const logo = this.shadowRoot?.querySelector<HTMLAnchorElement>('a.logo');
    if (logo) logo.href = this._homeHref();

    const locales = this._locales;
    if (locales.length > 1) {
      const locale = this._currentLocale;
      if (locales.includes(locale)) {
        this.setAttribute('locale', locale);
      }
    }

    // Sync data-theme from document.documentElement on connect
    const docTheme = document.documentElement?.dataset?.theme;
    if (docTheme) {
      this.setAttribute('data-theme', docTheme);
    }

    // Listen for theme change events from open-theme-toggle
    if (this._themeHandler) {
      globalThis.removeEventListener?.('open:theme-change', this._themeHandler);
    }
    this._themeHandler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.theme) {
        this.setAttribute('data-theme', detail.theme);
        this._propagateTheme(detail.theme);
      }
    };
    globalThis.addEventListener?.('open:theme-change', this._themeHandler);

    this._propagateTheme((docTheme as 'dark' | 'light') || 'dark');

    // Delegate across the composed path so DSD upgrade and SPA shadow-root
    // replacement share one stable listener.
    this._docClickCleanup?.();
    this._docClickCleanup = this._setupBackdropClose();

    // Scroll detection for header backdrop blur
    this._teardownScrollDetection();
    this._setupScrollDetection();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._docClickCleanup?.();
    if (this._themeHandler) {
      globalThis.removeEventListener?.('open:theme-change', this._themeHandler);
    }
    this._teardownScrollDetection();
  }

  override attributeChangedCallback(name: string, old: string | null, val: string | null): void {
    super.attributeChangedCallback(name, old, val);
    if (old === val) return;
    if (name === 'current-path') {
      this._updateActiveNav();
    }
  }

  // --- Mobile menu ---

  private _toggleMenu(_e: Event): void {
    const isOpen = this.hasAttribute('menu-open');
    setMobileMenuState(this, !isOpen);
  }

  /**
   * Single delegated click listener for the mobile menu: toggles when the
   * composed path hits .mobile-menu-btn, closes on backdrop or nav link.
   * composedPath() detects clicks across shadow DOM boundaries.
   */
  private _setupBackdropClose(): () => void {
    const handler = (e: Event) => {
      const path = e.composedPath();
      if (isMobileMenuToggle(path)) this._toggleMenu(e);
      else if (shouldDismissMobileMenu(path)) this._closeMenu();
    };

    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }

  private _closeMenu(): void {
    setMobileMenuState(this, false);
  }

  // --- Theme ---
  private _propagateTheme(theme: string): void {
    // Walk light DOM children (slotted page components like the home page and UI showcase)
    propagateLayoutTheme(this, theme);
    // Walk shadow DOM content (internal layout elements)
    if (this.shadowRoot) {
      propagateLayoutTheme(this.shadowRoot, theme);
    }
  }

  private _updateActiveNav(): void {
    if (!this.shadowRoot) return;
    const cp = this._currentPath();
    const links = this.shadowRoot.querySelectorAll(
      '.docs-sidebar a[data-nav], .header-nav a[data-nav]',
    );
    links.forEach((a) => {
      const nav = a.getAttribute('data-nav');
      const isActive = nav === cp;
      a.classList.toggle('active', isActive);
      if (isActive) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }
}

export default OpenLayout;

defineCustomElement(tagName, OpenLayout);
