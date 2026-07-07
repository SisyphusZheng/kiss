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
import { formatError } from './errors.ts';

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

/**
 * Safely inject a plain props object into a component instance.
 *
 * - Skips Object.prototype keys and other dangerous keys that could lead to
 *   prototype pollution when props originate from untrusted SSR data.
 * - Logs the first dangerous-key occurrence once per context to avoid noisy
 *   repeated warnings during hydration.
 * - Catches read-only property assignment errors and logs them at debug level
 *   so prop injection remains defensive.
 *
 * This helper replaces the copy-paste prop-assignment loops in
 * render-dsd.ts, jsx-render-dom.ts, event-hydration.ts, and island.ts
 * (R-1 / comprehensive review).
 */
export function injectPropsSafe(
  instance: object,
  props: Record<string, unknown>,
  context: string,
): void {
  for (const [key, value] of Object.entries(props)) {
    if (DANGEROUS_KEYS.has(key)) {
      warnOnce(
        `dangerous-prop:${context}:${key}`,
        _securityLog,
        `Skipping dangerous prop key "${key}" on ${context} - potential prototype pollution`,
      );
      continue;
    }
    try {
      (instance as Record<string, unknown>)[key] = value;
    } catch (e) {
      _securityLog.debug(
        `Cannot set read-only property "${key}" on ${context}: ${formatError(e)}`,
      );
    }
  }
}
