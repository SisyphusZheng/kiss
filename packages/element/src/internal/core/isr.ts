/**
 * isr.ts - route-level ISR cache primitives.
 *
 * v0.44: Platform adapters (CF Workers KV, Deno KV).
 *
 * Architecture:
 *   1. Build: SSG produces static HTML + isr-manifest.json
 *   2. Runtime: Edge handler checks cache before serving static
 *   3. Hit: serve fresh cached HTML directly
 *   4. Stale: serve cached HTML + async background regeneration
 */

export function createIsrCacheKey(
  routePath: string,
  params: Record<string, string> = {},
): string {
  // Encode each path segment so characters like '?' or '&' in a route path
  // cannot collide with the param-suffix delimiter or each other. Slashes are
  // preserved as segment separators.
  const encodedPath = routePath
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  const sortedParams = Object.entries(params).sort(([a], [b]) => a.localeCompare(b));
  const suffix = sortedParams.length === 0 ? '' : '?' +
    sortedParams.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
  return `openelement:isr:${encodedPath}${suffix}`;
}
