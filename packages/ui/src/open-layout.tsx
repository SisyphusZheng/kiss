/** @jsxImportSource @openelement/core */
/**
 * @openelement/ui - open-layout
 *
 * App layout component with header, sidebar, and footer.
 * Web Standards Lab: light-first, restrained, documentation-focused.
 *
 * v0.20.0: Migrated from DsdLitElement to DsdElement (Ocean component).
 *   - CSSStyleSheet replaces Lit css``
 *   - render() returns string
 *   - @click bindings for mobile menu toggle
 *   - Native links; application/router code owns navigation policy
 * v0.24.1: Migrated from html`` template to JSX (ADR-0057).
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
import { StyleSheet, type StyleSheetLike } from '@openelement/core/style-sheet';
import { type Context, createContext, provideContext } from '@openelement/core';
import { escapeAttr, escapeHtml } from '@openelement/core';
import { createLogger } from '@openelement/core/logger';
import './open-theme-toggle.tsx';
import './open-brand-mark.tsx';

export const tagName = 'open-layout';
const SAFE_URL_SCHEMES = new Set(['http:', 'https:', 'mailto:', 'tel:', 'sms:']);
const log = createLogger('ui');

function isSafeLayoutUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('//')) return false;
  if (
    trimmed.startsWith('/') ||
    trimmed.startsWith('#') ||
    trimmed.startsWith('./') ||
    trimmed.startsWith('../')
  ) {
    return true;
  }
  try {
    const parsed = new URL(trimmed, 'https://openelement.org/');
    return SAFE_URL_SCHEMES.has(parsed.protocol);
  } catch {
    return false;
  }
}

/* --- Locale/path helpers (inlined from @openelement/router) --- */

const LOCALE_LABELS: Record<string, string> = { en: '中文', zh: 'English' };

function parsePathWithoutLocale(pathname: string, locales: string[]): string {
  const segs = pathname.split('/').filter(Boolean);
  if (segs.length > 0 && locales.includes(segs[0])) {
    return '/' + segs.slice(1).join('/') || '/';
  }
  return pathname || '/';
}

function detectLocale(pathname: string, locales: string[], defaultLocale: string): string {
  const segs = pathname.split('/').filter(Boolean);
  if (segs.length > 0 && locales.includes(segs[0])) return segs[0];
  return defaultLocale;
}

function localizePath(path: string, locale: string): string {
  if (isSafeLayoutUrl(path) && /^https?:/i.test(path)) return path;
  return `/${locale}${path}`;
}

function switchPath(currentPath: string, currentLocale: string, locales: string[]): string {
  const other = locales.find((l) => l !== currentLocale) || currentLocale;
  return `/${other}${currentPath}`;
}

function switchLabel(currentLocale: string): string {
  return LOCALE_LABELS[currentLocale] || currentLocale;
}

/** SignalContext key: theme state shared across all components */
export const THEME_CTX: Context<'dark' | 'light'> = createContext<'dark' | 'light'>(
  Symbol('theme'),
  'light',
);

export interface NavItem {
  path?: string;
  href?: string;
  label: string;
}

export interface NavSection {
  section: string;
  items: NavItem[];
}

export interface HeaderNavLink {
  href: string;
  label: string;
}

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
    max-width: 1400px;
    margin: 0 auto;
    width: 100%;
  }

  .layout-main {
    flex: 1;
    min-width: 0;
    width: 100%;
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
    transition: background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
  }
  .app-header.scrolled {
    background: color-mix(in srgb, var(--bg-base) 88%, transparent);
    border-bottom-color: var(--border-hover);
    box-shadow: 0 var(--size-2) var(--size-10) color-mix(in srgb, var(--brand) 5%, transparent);
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
    max-width: min(38vw, calc(var(--size-10) * 3.45));
    font-size: var(--font-size-3);
    font-weight: var(--font-weight-8);
    color: var(--text-primary);
    text-decoration: none;
    letter-spacing: 0;
    white-space: nowrap;
  }

  .logo:hover open-brand-mark {
    transform: translateY(calc(var(--border-size-1) * -1));
  }

  open-brand-mark {
    display: inline-grid;
    align-self: center;
    max-width: 100%;
    transition: transform var(--duration-2) var(--ease-2);
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
    gap: clamp(var(--size-5), 3vw, var(--size-8));
    flex: 1;
    min-width: 0;
    justify-content: center;
  }
  .header-nav a {
    color: var(--nav-link-color);
    text-decoration: none;
    font-size: var(--font-size-1);
    font-weight: var(--font-weight-5);
    padding: var(--size-2) 0;
    transition: color 0.15s ease, background 0.15s ease;
  }
  .header-nav a:hover {
    color: var(--nav-link-hover);
  }
  .header-nav a[aria-current="page"] {
    color: var(--brand-deep);
    font-weight: var(--font-weight-8);
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: var(--size-1);
    margin-left: auto;
  }

  /* CTA buttons */
  .btn-secondary {
    display: inline-flex;
    align-items: center;
    gap: var(--size-2);
    color: var(--text-primary);
    text-decoration: none;
    font-size: var(--font-size-button);
    font-weight: var(--font-weight-semibold);
    padding: var(--size-2) var(--size-4);
    border: var(--border-size-1) solid color-mix(in srgb, var(--border) 72%, var(--brand));
    border-radius: var(--radius-round);
    background: color-mix(in srgb, var(--bg-elevated) 76%, transparent);
    box-shadow: inset 0 1px 0 color-mix(in srgb, var(--gray-0) 70%, transparent);
    transition: all 0.15s ease;
  }
  .btn-secondary:hover {
    color: var(--brand-deep);
    border-color: var(--brand-light);
    background: color-mix(in srgb, var(--brand-pale) 42%, var(--bg-elevated));
  }
  .btn-secondary svg { flex-shrink: 0; }

  .btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: var(--on-brand);
    text-decoration: none;
    font-size: var(--font-size-button);
    font-weight: var(--font-weight-semibold);
    padding: var(--size-2) var(--size-4);
    border: var(--border-size-1) solid transparent;
    border-radius: var(--radius-round);
    background: linear-gradient(135deg, var(--brand), var(--brand-light));
    box-shadow: 0 var(--size-2) var(--size-5) var(--brand-glow);
    white-space: nowrap;
    transition: all 0.15s ease;
  }
  .btn-primary:hover {
    background: linear-gradient(135deg, var(--brand-hover), var(--brand-light));
    transform: translateY(calc(var(--border-size-1) * -1));
  }

  .header-right .btn-secondary,
  .header-right .btn-primary {
    display: none;
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
    background: color-mix(in srgb, var(--bg-elevated) 42%, transparent);
  }
  :host([home]) .docs-sidebar,
  :host([full-width]) .docs-sidebar {
    width: 0; min-width: 0; padding: 0;
    overflow: hidden; border-right: none;
  }

  .nav-section { margin-bottom: 1.5rem; }
  .nav-section summary {
    font-size: 0.625rem;
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
    font-size: 0.85rem;
    padding: 0.35rem 1.5rem;
    border-left: 2px solid transparent;
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

    .btn-secondary .btn-text { display: none; }
  }

  @media (max-width: 1040px) {
    .header-nav { display: none; }
  }

  @media (max-width: 900px) {
    .mobile-menu-btn { display: flex; }
    .header-inner { padding: 0 var(--size-4); gap: var(--size-2); }
    .header-nav { display: none; }
    .btn-secondary .btn-text { display: none; }
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
      text-decoration: none; font-size: 10px; font-weight: 600;
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
    .btn-primary { display: none; }
    .btn-secondary { padding: 8px; border: none; }
    .btn-secondary .btn-text { display: none; }
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
        return detectLocale(location.pathname, this._locales, this._defaultLocale);
      }
      return this._defaultLocale;
    } catch {
      return this._defaultLocale;
    }
  }

  private get _currentPathWithoutLocale(): string {
    try {
      if (typeof globalThis.location !== 'undefined') {
        return parsePathWithoutLocale(location.pathname, this._locales);
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
    'github-url',
    'edit-url',
    'locale',
    'locales',
  ];

  private _themeHandler?: (e: Event) => void;
  private _docClickCleanup?: () => void;

  override render(): ReturnType<typeof OpenElement.prototype.render> {
    return this._renderLayout();
  }

  private _getStr(attr: string, def: string): string {
    const camel = attr.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
    const prop = (this as Record<string, unknown>)[camel];
    if (prop !== undefined && prop !== null) return String(prop);
    return this.getAttribute(attr) || def;
  }

  private _getBool(attr: string): boolean {
    const camel = attr.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
    const prop = (this as Record<string, unknown>)[camel];
    if (typeof prop === 'boolean') return prop;
    return this.hasAttribute(attr);
  }

  // _currentPathWithoutLocale, _currentLocale, _locales, _switchPath(),
  // _switchLabel(), _updateSwitch(), _localizePath()
  // ?? all inlined (replaces former @openelement/router dependency)

  private _currentPath(): string {
    // SSR-safe: prefer attribute/prop set by renderDsd over URL detection
    // location.pathname is undefined during build.
    const prop = (this as Record<string, unknown>).currentPath;
    if (typeof prop === 'string' && prop.length > 0) return prop;
    const attr = this.getAttribute('current-path');
    if (attr && attr.length > 0) return attr;
    try {
      if (typeof globalThis.location !== 'undefined') {
        return parsePathWithoutLocale(location.pathname, this._locales);
      }
      return this.getAttribute('current-path') || '/';
    } catch {
      return '/';
    }
  }

  /** Compute GitHub edit URL from current path. */
  private _computeEditUrl(): string {
    const path = this._currentPath();
    if (!path || path === '/') return '';
    const EDIT_BASE = 'https://github.com/open-element/openelement/edit/main/www/app/routes';
    const clean = path.replace(/\/$/, '').split('/').filter(Boolean);
    // Remove locale prefix if present (en/, zh/)
    if (['en', 'zh'].includes(clean[0])) clean.shift();
    const filePath = clean.length === 0 ? 'index/index' : clean.join('/');
    return `${EDIT_BASE}/${filePath}.tsx`;
  }

  private _navItems(): NavSection[] {
    const items = this._rawNavItems();
    return this._filterByPath(items);
  }

  /** Auto-filter sidebar sections by current path prefix. */
  private _filterByPath(items: NavSection[]): NavSection[] {
    const path = this._currentPath();
    const SECTION_MAP: Record<string, string[]> = {
      '/guide': ['Quick Start', 'Core', 'Production'],
      '/architecture': ['Principles', 'Compatibility', 'Reference'],
      '/registry': ['Registry'],
      '/hub': ['Registry'],
      '/blog': ['History'],
    };
    for (const [prefix, sections] of Object.entries(SECTION_MAP)) {
      if (path.startsWith(prefix)) {
        return items.filter((s) => sections.includes(s.section));
      }
    }
    return items;
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
      case 'Home':
        return (
          <svg {...a}>
            <path d='M3 10l7-7 7 7' />
            <path d='M5 8v9h3v-5h4v5h3V8' />
          </svg>
        );
      case 'Docs':
      case 'Blog':
        return (
          <svg {...a}>
            <rect x='3' y='2' width='14' height='16' rx='2' />
            <path d='M7 6h6M7 10h6M7 14h3' />
          </svg>
        );
      case 'Examples':
        return (
          <svg {...a}>
            <rect x='3' y='3' width='14' height='14' rx='2' />
            <path d='M7 7l6 3-6 3z' />
          </svg>
        );
      case 'Components':
        return (
          <svg {...a}>
            <rect x='2' y='2' width='7' height='7' rx='1' />
            <rect x='11' y='2' width='7' height='7' rx='1' />
            <rect x='2' y='11' width='7' height='7' rx='1' />
            <rect x='11' y='11' width='7' height='7' rx='1' />
          </svg>
        );
      case 'Architecture':
      case 'Engine':
        return (
          <svg {...a}>
            <circle cx='10' cy='10' r='3' />
            <path d='M10 1v2M10 17v2M3.5 3.5l1.4 1.4M15.1 15.1l1.4 1.4M1 10h2M17 10h2M3.5 16.5l1.4-1.4M15.1 4.9l1.4-1.4' />
          </svg>
        );
      case 'Hub':
      case 'RegistryHub':
        return (
          <svg {...a}>
            <path d='M10 2l7 4v8l-7 4-7-4V6z' />
            <path d='M10 10l7-4M10 10v8M10 10L3 6' />
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
      case 'Framework':
        return (
          <svg {...a}>
            <path d='M5 3h10M5 3v6h7M12 9v3M5 17h7' />
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
    try {
      const parsed = new URL(href, 'https://openelement.org/');
      return parsed.origin !== 'https://openelement.org' && SAFE_URL_SCHEMES.has(parsed.protocol);
    } catch {
      return false;
    }
  }

  private _localizedSafeHref(href: string | undefined): { href: string; isExternal: boolean } {
    const safeHref = this._safeHref(href);
    const isExternal = this._isExternalHref(safeHref);
    return {
      href: isExternal ? safeHref : localizePath(safeHref, this._currentLocale),
      isExternal,
    };
  }

  // --- Main render ---

  private _renderLayout() {
    const home = this._getBool('full-width') || this._getBool('home');
    const noSearch = this.hasAttribute('no-search');
    const logoSub = this._getStr('logo-sub', '');
    const locales = this._locales;
    const currentLocale = this._currentLocale;
    const currentPath = this._currentPathWithoutLocale;
    const langLabel = locales.length > 1 ? switchLabel(currentLocale) : '';
    const langHref = locales.length > 1 ? switchPath(currentPath, currentLocale, locales) : '';

    return (
      <div className='app-layout' part='container' home={home || undefined}>
        <header className='app-header' part='header'>
          <nav className='header-inner' aria-label='Primary navigation'>
            <a className='logo' href='/' aria-label='open home'>
              <open-brand-mark size='md'></open-brand-mark>
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
                  onClick={(event: Event) => this._toggleMenu(event)}
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
                href={localizePath('/guide/core-concepts', currentLocale)}
                data-nav={localizePath('/guide/core-concepts', currentLocale)}
              >
                Elements
              </a>
              <a
                href={localizePath('/architecture/design-system', currentLocale)}
                data-nav={localizePath('/architecture/design-system', currentLocale)}
              >
                UI
              </a>
              <a
                href={localizePath('/architecture/architecture', currentLocale)}
                data-nav={localizePath('/architecture/architecture', currentLocale)}
              >
                Framework
              </a>
              <a
                href={localizePath('/architecture/standards-registry', currentLocale)}
                data-nav={localizePath('/architecture/standards-registry', currentLocale)}
              >
                Protocols
              </a>
            </div>
            <div className='footer-column'>
              <h4>Resources</h4>
              <a
                href={localizePath('/guide/getting-started', currentLocale)}
                data-nav={localizePath('/guide/getting-started', currentLocale)}
              >
                Guide
              </a>
              <a
                href={localizePath('/guide/api', currentLocale)}
                data-nav={localizePath('/guide/api', currentLocale)}
              >
                API
              </a>
              <a
                href={localizePath('/architecture/architecture', currentLocale)}
                data-nav={localizePath('/architecture/architecture', currentLocale)}
              >
                Architecture
              </a>
              <a
                href={localizePath('/blog', currentLocale)}
                data-nav={localizePath('/blog', currentLocale)}
              >
                Blog
              </a>
            </div>
            <div className='footer-column'>
              <h4>Company</h4>
              <a href='https://github.com/open-element/openelement'>GitHub</a>
              <a
                href={localizePath('/roadmap', currentLocale)}
                data-nav={localizePath('/roadmap', currentLocale)}
              >
                Roadmap
              </a>
              <a
                href={localizePath('/changelog', currentLocale)}
                data-nav={localizePath('/changelog', currentLocale)}
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
                href={localizePath('/contributing', currentLocale)}
                data-nav={localizePath('/contributing', currentLocale)}
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
    const sectionRoot = (href: string): string => {
      const segs = href.split('/').filter(Boolean);
      const start = locs.length > 1 && locs.includes(segs[0]) ? 1 : 0;
      return segs.length > start + 1 ? '/' + segs[start] : href;
    };

    const rawPath = this._currentPathWithoutLocale;

    return (
      <nav className='mobile-tab-bar' aria-label='Quick navigation'>
        {mobileLinks.map((link) => {
          const { href: localized, isExternal } = this._localizedSafeHref(link.href);
          const root = sectionRoot(link.href);
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
    let ticking: ReturnType<typeof setTimeout> | undefined;
    const onScroll = () => {
      if (ticking !== undefined) return;
      ticking = globalThis.setTimeout(() => {
        const header = this.shadowRoot?.querySelector('.app-header');
        if (header) {
          header.classList.toggle('scrolled', globalThis.scrollY > 0);
        }
        ticking = undefined;
      }, 100);
    };
    globalThis.addEventListener('scroll', onScroll, { passive: true });
    this._scrollCleanup = () => {
      globalThis.removeEventListener('scroll', onScroll);
      if (ticking !== undefined) {
        globalThis.clearTimeout(ticking);
      }
    };
  }

  private _teardownScrollDetection(): void {
    this._scrollCleanup?.();
    this._scrollCleanup = undefined;
  }

  // --- Lifecycle ---

  override connectedCallback(): void {
    super.connectedCallback();

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
    // SignalContext: provide theme state to all child components
    const initialTheme = (docTheme as 'dark' | 'light') || 'light';
    provideContext(this, THEME_CTX, initialTheme);

    // Listen for theme change events from open-theme-toggle
    this._themeHandler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.theme) {
        this.setAttribute('data-theme', detail.theme);
        provideContext(this, THEME_CTX, detail.theme);
        this._propagateTheme(detail.theme);
      }
    };
    globalThis.addEventListener?.('open:theme-change', this._themeHandler);

    this._propagateTheme(initialTheme);

    if (this.shadowRoot && this.shadowRoot.childNodes.length > 0) {
      this._setupDetailsToggle();
    }

    // v0.23.0: Integrated from www/public/mobile-menu.js.
    // Close mobile menu on backdrop click or sidebar nav link click.
    this._docClickCleanup = this._setupBackdropClose();

    // Scroll detection for header backdrop blur
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
    if (old === val) return;
    if (name === 'current-path') {
      this._updateActiveNav();
    }
  }

  // --- Mobile menu ---

  // v0.31 UI-shell debt: replace _replaceShadowRootFromLayout with signal-driven SPA nav.
  // Currently SPA navigation destroys the entire shadow DOM and rebuilds it from
  // fetched HTML, then manually re-attaches events in _setupDetailsToggle. This is
  // incompatible with the signal architecture ?? we should make currentPath/navItems
  // signals and let data-signal markers handle DOM updates reactively. Then the
  // _setupDetailsToggle hack (and this entire method) can be deleted.
  private _menuBtnHandler: ((e: Event) => void) | null = null;

  private _setupDetailsToggle(): void {
    const btn = this.shadowRoot?.querySelector('.mobile-menu-btn');
    if (!btn) return;
    // Remove any stale listener from a previous shadow root.
    if (this._menuBtnHandler) {
      btn.removeEventListener('click', this._menuBtnHandler);
    }
    this._menuBtnHandler = this._toggleMenu.bind(this);
    btn.addEventListener('click', this._menuBtnHandler);
  }

  private _toggleMenu(_e: Event): void {
    const isOpen = this.hasAttribute('menu-open');
    this.toggleAttribute('menu-open', !isOpen);
    this._syncInert(!isOpen);
  }

  private _syncInert(menuOpen: boolean): void {
    const main = this.shadowRoot?.querySelector('.layout-main');
    if (main) {
      if (menuOpen) main.setAttribute('inert', '');
      else main.removeAttribute('inert');
    }
  }

  /**
   * v0.23.0: Integrated from www/public/mobile-menu.js.
   * Closes mobile menu when backdrop or sidebar nav link is clicked.
   * Uses composedPath() to detect clicks across shadow DOM boundaries.
   */
  private _setupBackdropClose(): () => void {
    const handler = (e: Event) => {
      const target = e.target;
      if (!target || !(target instanceof Element)) return;

      const path = e.composedPath();
      let isBackdrop = false;
      let isNavLink = false;

      for (let i = 0; i < path.length; i++) {
        const el = path[i] as Element;
        if (!el?.classList) continue;
        if (el.classList.contains('mobile-backdrop')) {
          isBackdrop = true;
          break;
        }
        if (el.tagName === 'A') {
          isNavLink = true;
          break;
        }
      }

      if (!isBackdrop && !isNavLink) return;
      this._closeMenu();
    };

    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }

  private _closeMenu(): void {
    this.removeAttribute('menu-open');
    const details = this.shadowRoot?.querySelector('details.mobile-menu');
    if (details) details.removeAttribute('open');
    this._syncInert(false);
  }

  // --- Theme ---
  private _propagateTheme(theme: string): void {
    const walk = (root: Element | ShadowRoot) => {
      root.querySelectorAll('*').forEach((el) => {
        if (el.tagName.includes('-')) {
          el.setAttribute('data-theme', theme);
        }
        if (el.shadowRoot) {
          walk(el.shadowRoot);
        }
      });
    };
    // Walk light DOM children (slotted page components like docs-home, ui-showcase)
    walk(this);
    // Walk shadow DOM content (internal layout elements)
    if (this.shadowRoot) {
      walk(this.shadowRoot);
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

  // --- Utilities ---

  private _esc = escapeHtml;
  private _escAttr = escapeAttr;
}

export default OpenLayout;
