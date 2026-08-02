import type { Plugin } from 'vite';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DEFAULT_DATA_DIR } from './internal/paths.ts';

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
  name?: string;
  /**
   * When true (default), a missing generated data module resolves to an empty
   * fallback stub so `deno task dev` keeps working before the first generation.
   */
  allowFallback?: boolean;
  /**
   * Generated data ids that must exist on disk (#671, fail-closed, SOP-001).
   * Build mode lists the ids whose nav/blog/i18n plugins ran during the build:
   * a missing file then means the plugin's generated-data write failed, and
   * the build must fail instead of silently shipping empty fallback data.
   * Ids not listed here keep the allowFallback behavior (apps that do not use
   * a given content plugin must still build).
   */
  required?: string[];
};

export function generatedDataPath(
  root: string,
  id: string,
): string | null {
  const fileName = GENERATED_DATA_FILES[id];
  if (!fileName) return null;
  return resolve(root, DEFAULT_DATA_DIR, fileName);
}

export function createGeneratedDataResolverPlugin(
  options: GeneratedDataResolverOptions,
): Plugin {
  const allowFallback = options.allowFallback ?? true;

  return {
    name: options.name ?? 'open:generated-data',
    enforce: 'pre',

    resolveId(id) {
      if (!GENERATED_DATA_FILES[id]) return null;
      const path = generatedDataPath(options.root, id);
      if (path && existsSync(path)) return path;
      return '\0open:generated-data:' + id;
    },

    load(id) {
      const prefix = '\0open:generated-data:';
      if (!id.startsWith(prefix)) return null;

      const sourceId = id.slice(prefix.length);
      const path = generatedDataPath(options.root, sourceId);
      if (path && existsSync(path)) return readFileSync(path, 'utf-8');

      if (options.required?.includes(sourceId)) {
        throw new Error(
          `[openElement] Generated data module not found: ${path ?? sourceId}. ` +
            'Its content plugin registered data during this build, so the file must ' +
            'exist. A missing file means the generated-data write failed; build mode ' +
            'is fail-closed (SOP-001) and will not ship empty fallback data.',
        );
      }
      if (allowFallback) return GENERATED_DATA_FALLBACKS[sourceId] ?? null;
      return null;
    },
  };
}
