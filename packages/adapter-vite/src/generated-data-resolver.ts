import type { Plugin } from 'vite';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const GENERATED_NAV_ID = '@openelement/generated/nav';
export const GENERATED_BLOG_DATA_ID = '@openelement/generated/blog-data';
export const GENERATED_I18N_ID = '@openelement/generated/i18n';

const GENERATED_DATA_FILES: Record<string, string> = {
  [GENERATED_NAV_ID]: '_generated-nav.ts',
  [GENERATED_BLOG_DATA_ID]: '_generated-blog-data.ts',
  [GENERATED_I18N_ID]: '_generated-i18n-data.ts',
};

const GENERATED_DATA_FALLBACKS: Record<string, string> = {
  [GENERATED_NAV_ID]: 'export const headerNav = [];\nexport const navSections = [];',
  [GENERATED_BLOG_DATA_ID]: [
    'export const posts = [];',
    'export function getPostBySlug() { return undefined; }',
  ].join('\n'),
  [GENERATED_I18N_ID]: [
    'export const locales = [];',
    'export function getDefaultLocale() { return "en"; }',
  ].join('\n'),
};

export type GeneratedDataResolverOptions = {
  root: string;
  dataDir?: string;
  name?: string;
  allowFallback?: boolean;
};

export function generatedDataPath(
  root: string,
  id: string,
  dataDir = 'app/data',
): string | null {
  const fileName = GENERATED_DATA_FILES[id];
  if (!fileName) return null;
  return resolve(root, dataDir, fileName);
}

export function createGeneratedDataResolverPlugin(
  options: GeneratedDataResolverOptions,
): Plugin {
  const dataDir = options.dataDir ?? 'app/data';
  const allowFallback = options.allowFallback ?? true;

  return {
    name: options.name ?? 'open:generated-data',
    enforce: 'pre',

    resolveId(id) {
      if (!GENERATED_DATA_FILES[id]) return null;
      const path = generatedDataPath(options.root, id, dataDir);
      if (path && existsSync(path)) return path;
      return '\0open:generated-data:' + id;
    },

    load(id) {
      const prefix = '\0open:generated-data:';
      if (!id.startsWith(prefix)) return null;

      const sourceId = id.slice(prefix.length);
      const path = generatedDataPath(options.root, sourceId, dataDir);
      if (path && existsSync(path)) return readFileSync(path, 'utf-8');

      if (allowFallback) return GENERATED_DATA_FALLBACKS[sourceId] ?? null;
      return null;
    },
  };
}
