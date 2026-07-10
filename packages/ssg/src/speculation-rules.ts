import type { SpeculationRulesOptions } from '@openelement/protocol/ssg';

export interface SpeculationRoute {
  path: string;
  type: string;
}

/** Build explicit or route-derived Speculation Rules JSON. */
export function buildSpeculationRulesJson(
  options: SpeculationRulesOptions,
  routes?: SpeculationRoute[],
): string {
  if (options.prerender?.length || options.prefetch?.length) {
    const rules: Record<string, unknown[]> = {};
    if (options.prerender?.length) {
      rules.prerender = options.prerender.map((pattern) => ({
        where: { href_matches: pattern },
        ...(options.eagerness && options.eagerness !== 'moderate'
          ? { eagerness: options.eagerness }
          : {}),
      }));
    }
    if (options.prefetch?.length) {
      rules.prefetch = options.prefetch.map((pattern) => ({
        where: { href_matches: pattern },
      }));
    }
    addExclusions(rules, options.exclude ?? []);
    return JSON.stringify(rules, null, 2);
  }

  if (!routes?.length) return '';
  const staticPaths = routes
    .filter((route) => route.type === 'page' && !route.path.includes(':'))
    .map((route) => route.path);
  if (!staticPaths.length) return '';

  const prerenderPaths = staticPaths.filter((path) => path.split('/').filter(Boolean).length <= 1);
  const prefetchPaths = staticPaths
    .filter((path) => path.split('/').filter(Boolean).length > 1)
    .map((path) => `${path}/*`);
  const rules: Record<string, unknown[]> = {};
  if (prerenderPaths.length) {
    rules.prerender = prerenderPaths.map((pattern) =>
      pattern === '/'
        ? { source: 'list', urls: ['/'], eagerness: 'moderate' }
        : { where: { href_matches: pattern }, eagerness: 'conservative' }
    );
  }
  if (prefetchPaths.length) {
    rules.prefetch = prefetchPaths.map((pattern) => ({ where: { href_matches: pattern } }));
  }
  addExclusions(
    rules,
    routes.filter((route) => route.type === 'api').map((route) => `${route.path}/*`),
  );
  return JSON.stringify(rules, null, 2);
}

function addExclusions(rules: Record<string, unknown[]>, patterns: string[]): void {
  if (!patterns.length) return;
  const orMatches = patterns.map((pattern) => ({ href_matches: pattern }));
  for (const key of ['prerender', 'prefetch']) {
    for (const rule of (rules[key] ?? []) as Record<string, unknown>[]) {
      if (rule.where && typeof rule.where === 'object') {
        (rule.where as Record<string, unknown>).not = { or_matches: orMatches };
      }
    }
  }
}
