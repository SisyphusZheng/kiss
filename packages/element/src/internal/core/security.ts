/**
 * security.ts - SSR Security Guards.
 *
 * Properties that MUST NOT be injected from untrusted SSR props.
 * These are Object.prototype internals and dangerous overrides that
 * could be exploited via arbitrary property assignment.
 *
 * Shared by island.ts (client-side SSR prop restoration) and render-dsd.ts
 * (SSR injectProps). Previously defined in island.ts and imported by
 * render-instantiate.ts (v0.29.1: merged into render-dsd.ts).
 *
 * @module ./security.ts
 */

import { createLogger, warnOnce } from './logger.ts';
import { formatError } from './errors.ts';

/** Object prototype keys that must never be injected as SSR props. */
const DANGEROUS_KEYS: ReadonlySet<string> = new Set([
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
 * Shared dangerous-key predicate (#903). Prototype-internal keys must never
 * be injected from untrusted props on ANY path: SSR injection
 * (injectPropsSafe), SSR serialization (collectPublicProps), and CSR element
 * binding (collectPropBindings) all filter through this single source so a
 * new dangerous pattern cannot be missed on one path.
 */
export function isDangerousKey(key: string): boolean {
  return DANGEROUS_KEYS.has(key);
}

/**
 * Shared safe-attribute-name predicate (#1033). Attribute *names* are not
 * escaped on any render path, so a name must be a valid HTML attribute name
 * (blocks quote/space injection, #602) and must not be an event handler
 * (`on*`, case-insensitive). render-ir.ts (silent skip) and adapter-vite
 * head-injection.ts (throw) enforce the same rule with different failure
 * strategies; both delegate here so the boundary cannot diverge.
 */
export function isSafeAttributeName(name: string): boolean {
  return /^[a-zA-Z_:][\w:.-]*$/.test(name) && !/^on/i.test(name);
}

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
 * Safely assign caller-supplied props onto a target object, skipping keys that
 * could enable prototype pollution and tolerating read-only properties.
 *
 * Consolidates the previously duplicated guarded-assignment loop from
 * island.ts (`bindSsrProps`) and render-dsd.ts (`injectProps`). Callers pass
 * their own logger so existing log channels are preserved; a security logger is
 * used when none is supplied.
 *
 * @param target - Object that receives the props (element instance or record).
 * @param props - Caller-supplied prop map.
 * @param tagName - Tag name used in log messages (e.g. `my-el`).
 * @param log - Logger exposing `warn`/`debug`; defaults to the security logger.
 */
export function injectPropsSafe(
  target: Record<string, unknown>,
  props: Record<string, unknown>,
  tagName: string,
  log: { warn(message: string): void; debug(message: string): void } = _securityLog,
): void {
  for (const key of Object.keys(props)) {
    if (isDangerousKey(key)) {
      log.warn(
        `Skipping dangerous prop key "${key}" on <${tagName}> - potential prototype pollution`,
      );
      continue;
    }
    let value: unknown;
    try {
      value = Reflect.get(props, key);
    } catch (e) {
      log.debug(`Skipping throwing getter prop "${key}" on <${tagName}>: ${formatError(e)}`);
      continue;
    }
    try {
      target[key] = value;
    } catch (e) {
      log.debug(
        `Cannot set read-only property "${key}" on <${tagName}>: ${formatError(e)}`,
      );
    }
  }
}
