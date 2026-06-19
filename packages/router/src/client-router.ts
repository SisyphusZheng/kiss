/**
 * URLPattern-based SPA router. One Router instance per <open-layout>.
 *
 * start() sets up:
 *
 * Consumer contract:
 *   open-layout calls `router.start(opts)` once in connectedCallback.
 *   The Router takes over all navigation from that point.
 *   When the caller swaps content (in contentLoader), it must call
 *   router.syncAfterSwap(shadowRoot) to update lang-switch.
 */

interface NavigationLike extends EventTarget {
  addEventListener(type: 'navigate', listener: EventListener): void;
  removeEventListener(type: 'navigate', listener: EventListener): void;
}

import { normalizeLocalePath } from './locale-path.ts';
import { createLogger } from '@openelement/core/logger';

interface NavigationNavigateEvent extends Event {
  canIntercept: boolean;
  hashChange: boolean;
  downloadRequest: boolean;
  destination: { url: string };
  intercept(opts: { handler: () => void }): void;
}

const LOCALE_LABELS: Record<string, string> = {
  zh: '\u4E2D\u6587',
  en: 'EN',
};

const log = createLogger('router');

export interface RouterStartOptions {
  /** Called when navigation destination is resolved. Caller fetches + swaps. */
  contentLoader: (path: string, locale: string) => Promise<void>;
  /** Called after content swap to update nav highlights etc. */
  onAfterSwap?: (path: string, locale: string) => void;
}

/**
 * Router class that encapsulates all locale/path/navigation logic.
 */
export class Router {
  #el: HTMLElement;
  #cleanup?: () => void;
  #options?: RouterStartOptions;

  constructor(element: HTMLElement) {
    this.#el = element;
  }

  get locales(): string[] {
    return this.#parseLocales();
  }

  /** Current locale from attribute or URL */
  get locale(): string {
    const prop = Reflect.get(this.#el, 'locale');
    if (typeof prop === 'string') return prop;
    const attr = this.#el.getAttribute('locale');
    if (attr) return attr;
    return this.#parseUrl().locale;
  }

  /** Current path without locale prefix */
  get path(): string {
    return this.#parseUrl().path;
  }

  /** Path to switch to the other locale */
  switchPath(): string {
    const { locale, path } = this.#parseUrl();
    const target = this.locales.find((l) => l !== locale) || this.locales[0];
    return `/${target}${path}`;
  }

  switchLabel(): string {
    const { locale } = this.#parseUrl();
    const target = this.locales.find((l) => l !== locale) || this.locales[0];
    return LOCALE_LABELS[target] || target.toUpperCase();
  }

  /** Add locale prefix to a path if needed */
  localize(path: string): string {
    if (this.locales.length <= 1) return path;
    if (path.startsWith('http')) return path;
    for (const loc of this.locales) {
      if (path === `/${loc}` || path.startsWith(`/${loc}/`)) return path;
    }
    return `/${this.locale}${path}`;
  }

  /** Update lang-switch DOM element (for SPA navigation) */
  updateSwitch(shadowRoot: ShadowRoot): void {
    const link = shadowRoot.querySelector('.lang-switch') as HTMLAnchorElement | null;
    if (!link) return;
    link.textContent = this.switchLabel();
    link.setAttribute('href', this.switchPath());
  }

  /**
   * Start the SPA router.
   *
   * Sets up click delegation on the shadow root AND Navigation API interception.
   * Both paths route through the same contentLoader callback.
   *
   * Call once per component lifecycle (in connectedCallback).
   */
  start(opts: RouterStartOptions): void {
    this.#options = opts;

    if (this.#el.shadowRoot) {
      this.#setupClickDelegation(this.#el.shadowRoot);
    }
    this.#setupNavigationApi();

    // but we need the fallback for browsers without Navigation API)
    this.#setupPopState();
  }

  /**
   * Fetch loader data for a route from the /_data endpoint.
   * Used by open-layout (or other consumers) during SPA navigation to
   * re-fetch data without a full page load.
   *
   * Returns the data object, or null if the route has no loader.
   */
  async fetchLoaderData<T = unknown>(routePath: string): Promise<{ data: T } | null> {
    try {
      const url = new URL(location.origin);
      url.pathname = '/_data';
      url.searchParams.set('route', routePath);
      const resp = await fetch(url.toString());
      if (!resp.ok) return null;
      const json = await resp.json();
      return json as { data: T };
    } catch {
      return null;
    }
  }

  /**
   * Stop the SPA router. Removes all event listeners.
   */
  stop(): void {
    this.#cleanup?.();
    this.#cleanup = undefined;
  }

  /**
   * Navigate programmatically to a new URL.
   * Updates browser history without full-page load.
   */
  navigateTo(href: string): void {
    const url = new URL(href, location.origin);
    if (url.origin !== location.origin) {
      location.href = href;
      return;
    }

    history.pushState(null, '', url.pathname + url.search + url.hash);
    this.#navigateNow(url.pathname);
  }

  /**
   * Replace current history entry (useful for lang switches where
   * the user stays on the "same" page).
   */
  replaceTo(href: string): void {
    const url = new URL(href, location.origin);
    if (url.origin !== location.origin) return;

    history.replaceState(null, '', url.pathname + url.search + url.hash);
    this.#navigateNow(url.pathname);
  }

  #setupClickDelegation(root: ShadowRoot): void {
    const handler = (e: Event) => {
      const link = (e.target as HTMLElement).closest<HTMLAnchorElement>('a');
      if (!link) return;
      const href = link.getAttribute('href');
      if (!href) return;

      // Skip external, hash-only, and mailto links
      if (
        href.startsWith('http') ||
        href.startsWith('#') ||
        href.startsWith('mailto:') ||
        href.startsWith('javascript:')
      ) {
        return;
      }

      e.preventDefault();
      e.stopImmediatePropagation();

      // For lang-switch, use replaceState to avoid adding to history
      const isLangSwitch = link.classList.contains('lang-switch');
      if (isLangSwitch) {
        this.replaceTo(href);
      } else {
        this.navigateTo(href);
      }
    };
    root.addEventListener('click', handler);
    const prev = this.#cleanup;
    this.#cleanup = () => {
      root.removeEventListener('click', handler);
      prev?.();
    };
  }

  #setupNavigationApi(): void {
    const nav = (globalThis as typeof globalThis & { navigation?: NavigationLike }).navigation;
    if (!nav) return;

    const onNav: EventListener = (event) => {
      const e = event as NavigationNavigateEvent;
      if (!e.canIntercept || e.hashChange || e.downloadRequest) return;

      const url = new URL(e.destination.url);
      if (url.origin !== location.origin) return;

      e.intercept({
        handler: () => this.#navigateNow(url.pathname),
      });
    };

    try {
      nav.addEventListener('navigate', onNav);
      const prev = this.#cleanup;
      this.#cleanup = () => {
        try {
          nav.removeEventListener('navigate', onNav);
        } catch { /* */ }
        prev?.();
      };
    } catch {
      // Navigation API interception is optional; fall back to popstate routing.
    }
  }

  #setupPopState(): void {
    const handler = () => {
      this.#navigateNow(location.pathname);
    };
    globalThis.addEventListener('popstate', handler);
    const prev = this.#cleanup;
    this.#cleanup = () => {
      globalThis.removeEventListener('popstate', handler);
      prev?.();
    };
  }

  #navigateNow(pathname: string): void {
    const { locale } = this.#parseUrlFrom(pathname);
    this.#el.setAttribute('current-path', pathname);
    this.#el.setAttribute('locale', locale);

    const opts = this.#options;
    if (!opts) return;

    // Update lang-switch immediately (before async fetch)
    if (this.#el.shadowRoot) {
      this.updateSwitch(this.#el.shadowRoot);
    }

    opts.contentLoader(pathname, locale).then(() => {
      // After content swap: update lang-switch again (content may have new one)
      if (this.#el.shadowRoot) {
        this.updateSwitch(this.#el.shadowRoot);
      }
      opts.onAfterSwap?.(pathname, locale);
    }).catch((err) => {
      log.warn('content load failed:', err);
      // Fallback: full page reload
      location.reload();
    });
  }

  #parseUrl(): { locale: string; path: string } {
    if (typeof globalThis.location === 'undefined') {
      const locale = this.#el.getAttribute('locale') || 'en';
      const path = this.#el.getAttribute('current-path') || '/';
      return { locale, path };
    }
    return this.#parseUrlFrom(location.pathname);
  }

  #parseUrlFrom(pathname: string): { locale: string; path: string } {
    const locales = this.locales;
    const defaultLocale = this.#el.getAttribute('locale') || locales[0] || 'en';
    const normalized = normalizeLocalePath(pathname, { locales, defaultLocale });
    return { locale: normalized.locale, path: normalized.path };
  }

  #parseLocales(): string[] {
    try {
      const raw = Reflect.get(this.#el, 'locales') || this.#el.getAttribute('locales');
      if (raw) {
        if (Array.isArray(raw)) return raw as string[];
        if (typeof raw === 'string') {
          try {
            return JSON.parse(raw);
          } catch {
            return ['en'];
          }
        }
      }
      return ['en'];
    } catch {
      return ['en'];
    }
  }
}
