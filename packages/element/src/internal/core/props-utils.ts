/**
 * props-utils.ts - Shared prop collection utility (#621).
 *
 * Single implementation of public-prop extraction used by both
 * defineElement (element package) and definePage (app package).
 * Filters internal `__openElement` prefixed keys and uses Reflect.get
 * for safe access to inherited getters.
 *
 * v0.42.0-alpha.15 (#903): normalizePublicProps is the shared
 * prop-normalization core. DANGEROUS_KEYS filtering now applies on every
 * path (SSR serialization via collectPublicProps, SSR injection via
 * injectPropsSafe, CSR element binding via collectPropBindings) through the
 * single isDangerousKey predicate in security.ts.
 *
 * @module ./props-utils.ts
 */

import { isDangerousKey } from './security.ts';

/**
 * Collect all public (non-internal) own properties from a host object.
 * Keys starting with `__openElement` are framework-internal and excluded.
 * Uses Reflect.get for safe access (respects getters without throwing).
 */
export function collectPublicProps(host: object): Record<string, unknown> {
  const props: Record<string, unknown> = {};
  for (const key of Object.keys(host)) {
    if (key.startsWith('__openElement')) continue;
    props[key] = Reflect.get(host, key);
  }
  return normalizePublicProps(props);
}

/**
 * Shared prop-normalization core (#903): strip framework-internal
 * (`__openElement*`) and prototype-dangerous keys from a raw props map.
 * Both SSR (render-dsd.ts) and CSR (jsx-render-dom.ts) filter through this
 * so the two paths cannot diverge on which keys survive.
 */
export function normalizePublicProps(
  props: Record<string, unknown>,
): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (key.startsWith('__openElement')) continue;
    if (isDangerousKey(key)) continue;
    clean[key] = value;
  }
  return clean;
}
