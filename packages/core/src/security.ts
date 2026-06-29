/**
 * @openelement/core - SSR Security Guards.
 *
 * Properties that MUST NOT be injected from untrusted SSR props.
 * These are Object.prototype internals and dangerous overrides that
 * could be exploited via arbitrary property assignment.
 *
 * Shared by island.ts (client-side SSR prop restoration) and render-dsd.ts
 * (SSR injectProps). Previously defined in island.ts and imported by
 * render-instantiate.ts (v0.29.1: merged into render-dsd.ts).
 *
 * @module @openelement/core/security
 */

import { createLogger, warnOnce } from './logger.ts';

/** Object prototype keys that must never be injected as SSR props. */
export const DANGEROUS_KEYS: ReadonlySet<string> = new Set([
  '__proto__',
  'constructor',
  'prototype',
  '__defineGetter__',
  '__defineSetter__',
  '__lookupGetter__',
  '__lookupSetter__',
  'hasOwnProperty',
  'isPrototypeOf',
  'propertyIsEnumerable',
  'toString',
  'toLocaleString',
  'valueOf',
]);

/**
 * Mark caller-supplied HTML as trusted before injection into a DOM/string render path.
 *
 * `trustedHtml` is an explicit trust boundary, not a sanitizer. Core escapes
 * untrusted text by default; callers that cross this boundary must sanitize or
 * otherwise trust the HTML before passing it to openElement.
 */
const _securityLog = createLogger('security');

export function trustRenderHtml(html: string): string {
  warnOnce(
    'trustedHtml',
    _securityLog,
    'trustRenderHtml is a trust boundary, not a sanitizer. ' +
      'Caller must ensure HTML content is safe before passing to openElement.',
  );
  return html;
}
