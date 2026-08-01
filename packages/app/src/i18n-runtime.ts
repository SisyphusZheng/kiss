/**
 * @openelement/app/i18n-runtime - Runtime-safe i18n helpers (no node:* modules)
 *
 * Separated from @openelement/adapter-vite/i18n-plugin to prevent node built-ins from
 * being pulled into client island bundles via @openelement/app main re-exports.
 *
 * Route-level helpers:
 * ```ts
 * import { i18nStaticPaths, switchLocale } from '@openelement/app/i18n';
 * ```
 */

// ─── Types ────────────────────────────────────────────────────────

export interface OpenElementI18nOptions {
  /** Available locale codes, e.g. ['en', 'zh'] */
  locales: string[];
  /** Default locale, e.g. 'en' */
  defaultLocale: string;
}

// ─── Data utilities ───────────────────────────────────────────────

/**
 * Pure function: load i18n configuration.
 * No module-level state. No side effects.
 *
 * This replaces the stateful initI18nData() pattern.
 * For virtual module consumers, use @openelement/generated/i18n instead.
 */
export function loadI18nData(options: OpenElementI18nOptions): OpenElementI18nOptions {
  return {
    ...options,
    locales: [...options.locales],
  };
}

// ─── Route helpers ────────────────────────────────────────────────

/**
 * Generate getStaticPaths() return for locale-aware routes.
 *
 * ADR 0018: locales parameter is now REQUIRED (no module-level state fallback).
 * Import locales from @openelement/generated/i18n in route components.
 *
 * Usage in route file:
 * ```ts
 * import { i18nStaticPaths } from '@openelement/app/i18n';
 * import { locales } from '@openelement/generated/i18n';
 *
 * export function getStaticPaths() {
 *   return i18nStaticPaths(locales); // -> [{ locale: 'en' }, { locale: 'zh' }]
 * }
 * ```
 */
export function i18nStaticPaths(
  locales: string[],
): Array<Record<string, string>> {
  return locales.map((locale) => ({ locale }));
}

/**
 * Switch a URL path to a different locale.
 * e.g. switchLocale('/en/guide/overview', 'zh') -> '/zh/guide/overview'
 *      switchLocale('/guide/overview', 'zh', ['en', 'zh']) -> '/zh/guide/overview'
 */
export function switchLocale(
  currentPath: string,
  targetLocale: string,
  locales: string[],
): string {
  // Strip any existing locale prefix
  let stripped = currentPath;
  for (const loc of locales) {
    if (stripped === `/${loc}` || stripped.startsWith(`/${loc}/`)) {
      stripped = stripped.slice(loc.length + 1) || '/';
      break;
    }
  }
  // Prepend target locale
  return `/${targetLocale}${stripped}`;
}

export type { LocalePath } from './internal/router/i18n.ts';
export { normalizeLocalePath } from './internal/router/i18n.ts';
