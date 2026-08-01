/**
 * @openelement/app/i18n-runtime - Runtime-safe i18n helpers (no node:* modules)
 *
 * Separated from @openelement/adapter-vite/i18n-plugin to prevent node built-ins from
 * being pulled into client island bundles via @openelement/app main re-exports.
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
