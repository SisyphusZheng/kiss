/**
 * props-utils.ts - Shared prop collection utility (#621).
 *
 * Single implementation of public-prop extraction used by both
 * defineElement (element package) and definePage (app package).
 * Filters internal `__openElement` prefixed keys and uses Reflect.get
 * for safe access to inherited getters.
 *
 * @module ./props-utils.ts
 */

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
  return props;
}
