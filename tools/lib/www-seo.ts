/**
 * Per-route SEO plan for the www build (#1307, B2.4 finding 3).
 *
 * The framework's page-head channel (`definePage({ head })`) is a static,
 * per-route-module descriptor — and the descriptor seam (packages/app
 * authoring) is frozen under ADR-0122 — so locale-appropriate per-route
 * metadata cannot flow through it. The www build therefore derives an SEO
 * plan from owned truth and applies it to the built shell documents before
 * Pagefind indexing:
 *
 *   - content routes (guide/architecture/blog) come from the committed,
 *     drift-gated content graph (`seoEntries` — #1157);
 *   - route-level pages (home, docs, apilist, blog index, roadmap, changelog,
 *     contributing, 404, probe) come from the authored bilingual map in
 *     www/app/seo.ts;
 *   - locale-expanded pages without their own graph entry (blog posts are
 *     single-language originals) inherit the original-language entry — the
 *     same honesty the on-page language notice expresses.
 *
 * Pure functions only; IO lives in ../apply-www-seo.ts.
 */

import { type ContentGraph, seoEntries, type SeoEntry } from './content-graph.ts';

export const SITE_ORIGIN = 'https://openelement.org';

/** One built page's resolved head metadata. */
export interface SeoPlanEntry {
  /** Built-file path relative to dist, e.g. 'zh/blog/x/index.html' or '404.html'. */
  file: string;
  /** Localized public route, e.g. '/zh/blog/x'. */
  route: string;
  locale: string;
  title: string;
  description: string;
  /** locale -> localized route, for hreflang. */
  alternates: Record<string, string>;
}

/** Authored bilingual head copy for one route-level page. */
export interface RouteSeo {
  title: string;
  description: string;
}

export type RouteSeoMap = Record<string, Record<string, RouteSeo>>;

const BRAND = 'openElement';

/** Branded document title; the brand suffix keeps the site name in every title. */
export function brandedTitle(title: string): string {
  return title.includes(BRAND) ? title : `${title} — ${BRAND}`;
}

/** Map a built HTML file (relative to dist) to its localized route + locale. */
export function builtFileToRoute(
  file: string,
  locales: readonly string[],
): { route: string; locale: string } | null {
  let path = file;
  if (path.endsWith('/index.html')) path = path.slice(0, -'/index.html'.length);
  else if (path === 'index.html') path = '';
  else if (path.endsWith('.html')) path = path.slice(0, -'.html'.length);
  else return null;
  const route = `/${path}`;
  const first = path.split('/').filter(Boolean)[0];
  if (first && locales.includes(first) && first !== locales[0]) {
    const rest = path.slice(first.length);
    return { route: rest === '' ? '/' : rest, locale: first };
  }
  return { route, locale: locales[0] };
}

/** Map a localized route back to the built file that serves it. */
export function routeToBuiltFile(route: string): string {
  if (route === '/') return 'index.html';
  if (route === '/404' || route.endsWith('/404')) {
    // The default-locale 404 is a flat artifact; locale-prefixed 404s are not.
    return route === '/404' ? '404.html' : `${route.slice(1)}/index.html`;
  }
  return `${route.slice(1)}/index.html`;
}

function escapeAttr(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export interface SeoPlanFailure {
  file: string;
  message: string;
}

/** Join a locale prefix with a canonical route. */
export function localizeRoute(route: string, locale: string, defaultLocale: string): string {
  if (locale === defaultLocale) return route;
  return route === '/' ? `/${locale}` : `/${locale}${route}`;
}

/**
 * Compose the per-page SEO plan. Fails closed: every built HTML page must
 * resolve to an entry, and every entry must resolve to a built page.
 */
export function buildSeoPlan(options: {
  graph: ContentGraph;
  routeSeo: RouteSeoMap;
  locales: readonly string[];
  builtHtmlFiles: readonly string[];
}): { plan: SeoPlanEntry[]; failures: SeoPlanFailure[] } {
  const { graph, routeSeo, locales, builtHtmlFiles } = options;
  const defaultLocale = locales[0];
  const failures: SeoPlanFailure[] = [];
  const byFile = new Map<string, SeoPlanEntry>();

  // Content routes from the drift-gated content graph.
  const contentEntries = seoEntries(graph, locales);
  const contentByRoute = new Map<string, SeoEntry>();
  for (const entry of contentEntries) contentByRoute.set(entry.route, entry);

  // Route-level pages from the authored bilingual map.
  for (const [route, byLocale] of Object.entries(routeSeo)) {
    for (const locale of locales) {
      const copy = byLocale[locale] ?? byLocale[defaultLocale];
      if (!copy) {
        failures.push({ file: 'www/app/seo.ts', message: `route '${route}' has no SEO copy` });
        continue;
      }
      const localized = localizeRoute(route, locale, defaultLocale);
      byFile.set(routeToBuiltFile(localized), {
        file: routeToBuiltFile(localized),
        route: localized,
        locale,
        title: brandedTitle(copy.title),
        description: copy.description,
        alternates: Object.fromEntries(
          locales.map((candidate) => [candidate, localizeRoute(route, candidate, defaultLocale)]),
        ),
      });
    }
  }

  // Content routes overlay; a locale-expanded page without its own graph
  // entry inherits the default-locale (original-language) entry.
  for (const file of builtHtmlFiles) {
    if (byFile.has(file)) continue;
    const resolved = builtFileToRoute(file, locales);
    if (!resolved) continue;
    const localized = localizeRoute(resolved.route, resolved.locale, defaultLocale);
    const own = contentByRoute.get(localized);
    const fallback = contentByRoute.get(resolved.route);
    const entry = own ?? fallback;
    if (!entry) {
      failures.push({ file, message: `no SEO entry for built page (route '${resolved.route}')` });
      continue;
    }
    byFile.set(file, {
      file,
      route: localized,
      locale: resolved.locale,
      title: brandedTitle(entry.title),
      // Posts without an excerpt still get a real, page-specific description.
      description: entry.description !== ''
        ? entry.description
        : `${entry.title} — openElement dispatch`,
      alternates: Object.fromEntries(
        locales.map((candidate) => [
          candidate,
          localizeRoute(resolved.route, candidate, defaultLocale),
        ]),
      ),
    });
  }

  // Every entry must resolve to a real built page.
  const built = new Set(builtHtmlFiles);
  for (const entry of byFile.values()) {
    if (!built.has(entry.file)) {
      failures.push({
        file: entry.file,
        message: `SEO entry for '${entry.route}' has no built page`,
      });
    }
  }

  return {
    plan: [...byFile.values()].sort((a, b) => a.file.localeCompare(b.file)),
    failures,
  };
}

/**
 * Apply one plan entry to a built HTML document: replace the boilerplate
 * title/description/og values and inject canonical + hreflang links.
 * Fails (returns null) when the expected boilerplate anchors are absent —
 * a silent no-op rewrite would hide template drift.
 */
export function applySeoToHtml(html: string, entry: SeoPlanEntry): string | null {
  let out = html;

  const titleMatch = out.match(/<title>[^<]*<\/title>/);
  if (!titleMatch) return null;
  out = out.replace(titleMatch[0], `<title>${escapeHtml(entry.title)}</title>`);

  const descriptionPattern = /<meta name="description" content="[^"]*"\s*\/?>/;
  if (!descriptionPattern.test(out)) return null;
  out = out.replace(
    descriptionPattern,
    `<meta name="description" content="${escapeAttr(entry.description)}">`,
  );

  const ogTitlePattern = /<meta property="og:title" content="[^"]*"\s*\/?>/;
  if (ogTitlePattern.test(out)) {
    out = out.replace(
      ogTitlePattern,
      `<meta property="og:title" content="${escapeAttr(entry.title)}">`,
    );
  }
  const ogDescriptionPattern = /<meta property="og:description" content="[^"]*"\s*\/?>/;
  if (ogDescriptionPattern.test(out)) {
    out = out.replace(
      ogDescriptionPattern,
      `<meta property="og:description" content="${escapeAttr(entry.description)}">`,
    );
  }
  const ogUrlPattern = /<meta property="og:url" content="[^"]*"\s*\/?>/;
  if (ogUrlPattern.test(out)) {
    out = out.replace(
      ogUrlPattern,
      `<meta property="og:url" content="${escapeAttr(SITE_ORIGIN + entry.route)}">`,
    );
  }

  // 404 pages stay out of canonical/hreflang (they are error documents, and
  // the sitemap excludes them).
  if (!entry.route.endsWith('/404') && entry.route !== '/404') {
    const links = [
      `<link rel="canonical" href="${escapeAttr(SITE_ORIGIN + entry.route)}">`,
      ...Object.entries(entry.alternates).map(([locale, route]) =>
        `<link rel="alternate" hreflang="${escapeAttr(locale)}" href="${
          escapeAttr(SITE_ORIGIN + route)
        }">`
      ),
      `<link rel="alternate" hreflang="x-default" href="${
        escapeAttr(SITE_ORIGIN + (entry.alternates['en'] ?? entry.route))
      }">`,
    ].join('\n  ');
    out = out.replace('</head>', `  ${links}\n</head>`);
  }
  return out;
}
