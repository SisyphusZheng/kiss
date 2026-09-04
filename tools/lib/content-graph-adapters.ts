/**
 * Content Graph adapters (#1157, B2.4): one adapter per owned Beta.2 truth
 * source — Markdown collections, public API data, compiler metadata,
 * roadmap and release truth. Adapters own all IO; the schemas, validators
 * and queries live in ./content-graph.ts.
 *
 * No generic CMS and no hand-rolled TypeScript parsing: Markdown goes
 * through the adapter-vite collection loader, route scanning goes through
 * the adapter's SSG route scanner and the roadmap source goes through the
 * repo's TypeScript AST tooling.
 */

import ts from 'typescript';
import {
  type CollectionOptions,
  loadCollectionData,
} from '../../packages/adapter-vite/src/content.ts';
import { scanRoutes } from '../../packages/adapter-vite/src/internal/ssg/route-scanner.ts';
import { parseTypeScript } from './typescript-ast.ts';
import { extractExportClassMap, extractSurfaceMap } from '../check-package-surface.ts';
import { articleCollections } from '../../www/content-collections.ts';
import type { ContentGraph, EntryReference, GraphEntry, LocaleAlternate } from './content-graph.ts';

export const SITE_LOCALES = ['en', 'zh'] as const;

const WWW_ROOT = 'www';
const WWW_ROUTES_DIR = `${WWW_ROOT}/app/routes`;

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return new Uint8Array(digest).toHex();
}

// ─── Markdown collection adapter ────────────────────────────────────────────

/**
 * Extract inline Markdown links from collection content. Fragments and
 * external/protocol links are left to the built-output link gate (#1159) and
 * the deferred external checker; only internal links become references.
 */
export function extractMarkdownReferences(
  content: string,
  resolve: (target: string) => EntryReference | null,
): EntryReference[] {
  const references: EntryReference[] = [];
  const linkPattern = /\[[^\]]*\]\(([^)\s]+)[^)]*\)|^\s*\[[^\]]+\]:\s*(\S+)/gm;
  for (const match of content.matchAll(linkPattern)) {
    const raw = match[1] ?? match[2];
    if (raw === undefined || raw.startsWith('#')) continue;
    if (/^[a-z][a-z0-9+.-]*:/i.test(raw) || raw.startsWith('//')) continue;
    const line = content.slice(0, match.index).split('\n').length;
    const target = raw.split('#')[0];
    if (target === '') continue;
    const reference = resolve(target);
    if (reference) references.push({ ...reference, line });
  }
  return references;
}

function localizedFileName(fileName: string): { slug: string; locale: string } {
  const localized = fileName.match(/^(.*)\.([a-z]{2})$/);
  return localized
    ? { slug: localized[1], locale: localized[2] }
    : { slug: fileName, locale: 'en' };
}

async function adaptCollection(
  collection: string,
  options: CollectionOptions,
  kind: 'article' | 'blog-post',
): Promise<GraphEntry[]> {
  const loaded = await loadCollectionData(collection, options);
  const basePath = options.basePath ?? `/${collection}`;
  const localeOf = (index: number) => loaded[index].locale ?? 'en';
  const idFor = (slug: string, locale: string) => `article:${collection}/${slug}:${locale}`;
  // loadCollectionData does not expose source paths; re-derive them from the
  // slug/locale the collection schema produced (the schema's transform is the
  // single owner of the `<slug>.<locale>.md` convention).
  const pathFor = (slug: string, locale: string) =>
    locale === 'en'
      ? `${options.contentDir}/${slug}.md`
      : `${options.contentDir}/${slug}.${locale}.md`;
  const known = new Map<string, string>();
  for (const [index, entry] of loaded.entries()) {
    known.set(`${entry.slug}:${localeOf(index)}`, idFor(entry.slug, localeOf(index)));
  }

  const graphEntries: GraphEntry[] = [];
  for (const [index, entry] of loaded.entries()) {
    const locale = localeOf(index);
    const sourcePath = pathFor(entry.slug, locale);
    const raw = await Deno.readTextFile(sourcePath);
    const alternates: LocaleAlternate[] = SITE_LOCALES
      .filter((candidate) => candidate !== locale)
      .map((candidate) => known.get(`${entry.slug}:${candidate}`))
      .filter((id): id is string => id !== undefined)
      .map((id) => ({ locale: id.slice(id.lastIndexOf(':') + 1), id }));
    const references = extractMarkdownReferences(entry.content, (target) => {
      if (target.startsWith('/')) {
        // Strip a site-locale prefix so zh-content links resolve to the
        // canonical (default-locale) route they localize.
        for (const siteLocale of SITE_LOCALES) {
          if (siteLocale !== 'en' && target.startsWith(`/${siteLocale}/`)) {
            return { kind: 'route', target: target.slice(siteLocale.length + 1) };
          }
        }
        return { kind: 'route', target };
      }
      const fileName = target.replace(/^\.\//, '').replace(/\.mdx?$/, '');
      const relative = localizedFileName(fileName);
      const id = known.get(`${relative.slug}:${relative.locale}`);
      return id ? { kind: 'entry', target: id } : null;
    });
    graphEntries.push({
      id: idFor(entry.slug, locale),
      kind,
      locale,
      source: { path: sourcePath },
      alternates,
      references,
      route: `${basePath}/${entry.slug}`,
      fingerprint: await sha256Hex(raw),
      data: {
        title: entry.frontmatter.title,
        ...(typeof entry.frontmatter.lede === 'string' ? { lede: entry.frontmatter.lede } : {}),
        ...(typeof entry.frontmatter.order === 'number' ? { order: entry.frontmatter.order } : {}),
      },
    });
  }
  return graphEntries;
}

// ─── Public API data adapter ────────────────────────────────────────────────

async function adaptApiSurface(): Promise<GraphEntry[]> {
  const path = 'docs/current/PACKAGE_SURFACE.md';
  const doc = await Deno.readTextFile(path);
  const surfaceMap = extractSurfaceMap(doc);
  const classMap = extractExportClassMap(doc);
  if (!surfaceMap || !classMap) {
    throw new Error('PACKAGE_SURFACE.md machine-readable blocks are missing or malformed');
  }
  const entries: GraphEntry[] = [];
  for (const [name, surface] of Object.entries(surfaceMap)) {
    entries.push({
      id: `api:${name}`,
      kind: 'api-package',
      locale: 'en',
      source: { path },
      alternates: [],
      references: [],
      fingerprint: await sha256Hex(JSON.stringify([name, surface, classMap[name] ?? null])),
      data: {
        supported: surface.supported,
        internal: surface.internal,
        exportClasses: classMap[name] ?? {},
      },
    });
  }
  return entries;
}

// ─── Compiler metadata adapter ──────────────────────────────────────────────

interface UiManifestDeclaration {
  tagName: string;
  filePath?: string;
  attributes?: unknown[];
  events?: unknown[];
  slots?: unknown[];
  cssParts?: unknown[];
  layer?: string;
  hydrate?: string;
}

async function adaptCompilerMetadata(): Promise<GraphEntry[]> {
  const path = 'packages/ui/src/generated-manifest.json';
  const manifest = JSON.parse(await Deno.readTextFile(path)) as {
    declarations?: UiManifestDeclaration[];
  };
  const entries: GraphEntry[] = [];
  for (const declaration of manifest.declarations ?? []) {
    entries.push({
      id: `element:${declaration.tagName}`,
      kind: 'custom-element',
      locale: 'en',
      source: { path: declaration.filePath ?? path },
      alternates: [],
      references: [],
      fingerprint: await sha256Hex(JSON.stringify(declaration)),
      data: {
        tagName: declaration.tagName,
        attributes: declaration.attributes ?? [],
        events: declaration.events ?? [],
        slots: declaration.slots ?? [],
        cssParts: declaration.cssParts ?? [],
        layer: declaration.layer ?? null,
        hydrate: declaration.hydrate ?? null,
      },
    });
  }
  return entries;
}

// ─── Roadmap adapter ────────────────────────────────────────────────────────

export interface RoadmapTimelineEntry {
  version: string;
  theme: string;
  copy: string;
  state: string;
  status: string;
  stamp?: string;
  line: number;
}

/**
 * Read the www roadmap timeline through the TypeScript AST (never a regex
 * parser): the route's `entries` record maps locale -> TimelineEntry[] with
 * static string fields.
 */
export function extractRoadmapTimeline(source: string): Record<string, RoadmapTimelineEntry[]> {
  const file = parseTypeScript(source, 'roadmap.tsx');
  const result: Record<string, RoadmapTimelineEntry[]> = {};
  for (const statement of file.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || declaration.name.text !== 'entries') continue;
      let initializer = declaration.initializer;
      while (
        initializer &&
        (ts.isAsExpression(initializer) || ts.isSatisfiesExpression(initializer))
      ) {
        initializer = initializer.expression;
      }
      if (!initializer || !ts.isObjectLiteralExpression(initializer)) continue;
      for (const localeProperty of initializer.properties) {
        if (!ts.isPropertyAssignment(localeProperty)) continue;
        const locale =
          ts.isIdentifier(localeProperty.name) || ts.isStringLiteral(localeProperty.name)
            ? localeProperty.name.text
            : undefined;
        if (!locale || !ts.isArrayLiteralExpression(localeProperty.initializer)) continue;
        const timeline: RoadmapTimelineEntry[] = [];
        for (const element of localeProperty.initializer.elements) {
          if (!ts.isObjectLiteralExpression(element)) continue;
          const record: Record<string, string> = {};
          for (const property of element.properties) {
            if (!ts.isPropertyAssignment(property)) continue;
            const key = ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)
              ? property.name.text
              : undefined;
            if (!key) continue;
            const value = property.initializer;
            if (ts.isStringLiteralLike(value) || ts.isNoSubstitutionTemplateLiteral(value)) {
              record[key] = value.text;
            }
          }
          if (typeof record.version === 'string' && typeof record.theme === 'string') {
            timeline.push({
              version: record.version,
              theme: record.theme,
              copy: record.copy ?? '',
              state: record.state ?? '',
              status: record.status ?? '',
              ...(typeof record.stamp === 'string' ? { stamp: record.stamp } : {}),
              line: file.getLineAndCharacterOfPosition(element.getStart(file)).line + 1,
            });
          }
        }
        result[locale] = timeline;
      }
    }
  }
  return result;
}

async function adaptRoadmap(): Promise<GraphEntry[]> {
  const routePath = `${WWW_ROUTES_DIR}/roadmap.tsx`;
  const source = await Deno.readTextFile(routePath);
  const timeline = extractRoadmapTimeline(source);
  const entries: GraphEntry[] = [];
  for (const [locale, items] of Object.entries(timeline)) {
    for (const [index, item] of items.entries()) {
      // The timeline is bilingual by construction: the same index in another
      // locale's array is the same logical entry, modeled as an alternate.
      const alternates: LocaleAlternate[] = Object.keys(timeline)
        .filter((candidate) => candidate !== locale && timeline[candidate][index] !== undefined)
        .map((candidate) => ({ locale: candidate, id: `roadmap:${candidate}:${index}` }));
      entries.push({
        id: `roadmap:${locale}:${index}`,
        kind: 'roadmap-entry',
        locale,
        source: { path: routePath, line: item.line },
        alternates,
        references: [],
        fingerprint: await sha256Hex(JSON.stringify(item)),
        data: {
          version: item.version,
          theme: item.theme,
          copy: item.copy,
          state: item.state,
          status: item.status,
          ...(item.stamp ? { stamp: item.stamp } : {}),
        },
      });
    }
  }
  const roadmapDoc = 'docs/roadmap/ROADMAP.md';
  entries.push({
    id: 'doc:docs/roadmap/ROADMAP.md',
    kind: 'doc',
    locale: 'en',
    source: { path: roadmapDoc },
    alternates: [],
    references: [],
    fingerprint: await sha256Hex(await Deno.readTextFile(roadmapDoc)),
    data: {},
  });
  return entries;
}

// ─── Release truth adapter ──────────────────────────────────────────────────

async function adaptReleases(): Promise<GraphEntry[]> {
  const statePath = 'docs/release/release-state.json';
  const stateRaw = await Deno.readTextFile(statePath);
  const state = JSON.parse(stateRaw) as Record<string, unknown>;
  const entries: GraphEntry[] = [{
    id: 'release:state',
    kind: 'release',
    locale: 'en',
    source: { path: statePath },
    alternates: [],
    references: [],
    fingerprint: await sha256Hex(stateRaw),
    data: state,
  }];
  const notes: string[] = [];
  for await (const entry of Deno.readDir('docs/release')) {
    if (entry.isFile && /^v\d+\.\d+\.\d+(?:-[0-9a-z.]+)?\.md$/.test(entry.name)) {
      notes.push(entry.name);
    }
  }
  for (const name of notes.sort()) {
    const path = `docs/release/${name}`;
    const raw = await Deno.readTextFile(path);
    const title = raw.split('\n')[0]?.replace(/^#\s*/, '') ?? name;
    entries.push({
      id: `release:${name.slice(0, -'.md'.length)}`,
      kind: 'release',
      locale: 'en',
      source: { path },
      alternates: [],
      references: [],
      fingerprint: await sha256Hex(raw),
      data: { title },
    });
  }
  return entries;
}

// ─── Route universe ─────────────────────────────────────────────────────────

/** Every public route the website serves, canonical (default-locale) form. */
export async function scanPublicRoutes(): Promise<string[]> {
  const scanned = await scanRoutes(WWW_ROUTES_DIR);
  const routes = new Set<string>(['/']);
  for (const entry of scanned) {
    if (entry.type !== 'page') continue;
    // Dynamic segments (:slug) are not literal link targets; concrete
    // article/blog routes join the universe from the content graph itself.
    if (entry.path.includes(':')) continue;
    routes.add(entry.path === '' ? '/' : entry.path);
  }
  return [...routes].sort();
}

// ─── Graph assembly ─────────────────────────────────────────────────────────

/**
 * Build the full typed content graph from the owned repository sources.
 * Purely a function of on-disk inputs; serialization determinism is asserted
 * by the generator's check mode.
 */
export async function buildContentGraph(root = WWW_ROOT): Promise<ContentGraph> {
  const entries: GraphEntry[] = [];
  for (const [name, options] of Object.entries(articleCollections)) {
    entries.push(
      ...await adaptCollection(
        name,
        { ...options, contentDir: `${root}/${options.contentDir}` },
        'article',
      ),
    );
  }
  entries.push(
    ...await adaptCollection(
      'blog',
      { contentDir: `${root}/content/blog`, basePath: '/blog' },
      'blog-post',
    ),
  );
  entries.push(...await adaptApiSurface());
  entries.push(...await adaptCompilerMetadata());
  entries.push(...await adaptRoadmap());
  entries.push(...await adaptReleases());
  return { version: 1, generated: 'deterministic', entries };
}
