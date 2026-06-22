/**
 * @openelement/protocol/router - Locale-aware path contracts.
 *
 * Zero-dependency pure TypeScript — shared by @openelement/router and
 * @openelement/app/i18n helpers.
 */

export interface LocalePath {
  locale: string;
  path: string;
  localizedPath: string;
  isDefaultLocalePath: boolean;
}
