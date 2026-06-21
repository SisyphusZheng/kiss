/**
 * @openelement/app/i18n - Runtime-safe i18n helpers (no node:* modules)
 *
 * Thin re-export barrel from i18n-runtime.ts.
 * The node-only Vite plugin is in i18n-plugin.ts and must NOT be re-exported here,
 * to prevent node:process/node:path/node:fs from being pulled into client
 * island bundles via @openelement/app main re-exports.
 *
 * Route-level helpers:
 * ```ts
 * import { i18nStaticPaths, switchLocale } from '@openelement/app/i18n';
 * ```
 */

export type { OpenElementI18nOptions } from './i18n-runtime.ts';
export { i18nStaticPaths, loadI18nData, switchLocale } from './i18n-runtime.ts';
export type { LocalePath } from '@openelement/router/i18n';
export { normalizeLocalePath } from '@openelement/router/i18n';
