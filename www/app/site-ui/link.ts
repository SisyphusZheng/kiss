/**
 * Shared in-content link helpers for www routes and site-ui shells.
 *
 * The site builds exactly two locales (www/vite.config.ts `locales`); the
 * default locale keeps canonical unprefixed paths, every other locale gets a
 * `/<locale>` prefix. All in-content internal links must go through
 * localizePath so a zh page never drops the reader back into the English
 * tree (#1031). Locale math delegates to @openelement/app/i18n.
 */
import { normalizeLocalePath } from '@openelement/app/i18n';

/** Locales emitted by the www build (www/vite.config.ts `locales`). */
export const SITE_LOCALES: readonly string[] = ['en', 'zh'];
export const SITE_DEFAULT_LOCALE: string = SITE_LOCALES[0];

/**
 * Prefix an internal absolute path with the locale unless it is the default
 * locale. External URLs, anchors, and unknown locales pass through unchanged.
 */
export function localizePath(path: string, locale: string): string {
  if (!path.startsWith('/')) return path;
  if (!SITE_LOCALES.includes(locale)) return path;
  return normalizeLocalePath(`/${locale}${path === '/' ? '' : path}`, {
    locales: [...SITE_LOCALES],
    defaultLocale: SITE_DEFAULT_LOCALE,
  }).localizedPath;
}
