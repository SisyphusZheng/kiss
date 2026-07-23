/**
 * @openelement/adapter-vite - Alias normalization helpers.
 *
 * Utilities for converting user-provided alias mappings into Vite's Alias[]
 * shape with absolute, root-relative replacements.
 */

import { dirname, join, resolve } from 'node:path';
import { type Alias } from 'vite';

function normalizeAliasReplacement(root: string, replacement: string): string {
  return replacement.startsWith('/') || /^[A-Za-z]:/.test(replacement) ||
      replacement.startsWith('file:') || replacement.startsWith('\0')
    ? replacement
    : resolve(root, replacement);
}

function aliasSpecificity(find: unknown): number {
  return typeof find === 'string' ? find.length : 0;
}

function sortAliasEntries<T extends Alias>(aliases: T[]): T[] {
  return [...aliases].sort((a, b) => {
    return aliasSpecificity(b.find) - aliasSpecificity(a.find);
  });
}

interface OpenElementSourceSubpaths {
  rootFile: string;
  files: Record<string, string>;
}

const OPENELEMENT_SOURCE_SUBPATHS: Record<string, OpenElementSourceSubpaths> = {
  '@openelement/app': {
    rootFile: 'index.ts',
    files: {
      hono: 'hono.ts',
      spa: 'spa.ts',
      model: 'model.ts',
      i18n: 'i18n.ts',
      preact: 'preact.ts',
    },
  },
  '@openelement/element': {
    rootFile: 'index.ts',
    files: {
      'jsx-runtime': 'jsx-runtime.ts',
      'jsx-dev-runtime': 'jsx-dev-runtime.ts',
      'build-utils': 'build-utils.ts',
      'open-element-render': 'open-element-render.ts',
      'open-element-hydration': 'open-element-hydration.ts',
    },
  },
};

function expandOpenElementSourceAliases(aliases: Alias[]): Alias[] {
  const out = [...aliases];
  const existing = new Set(
    out.flatMap((alias) => typeof alias.find === 'string' ? [alias.find] : []),
  );

  for (const alias of aliases) {
    if (typeof alias.find !== 'string' || typeof alias.replacement !== 'string') continue;
    const subpaths = OPENELEMENT_SOURCE_SUBPATHS[alias.find];
    if (!subpaths) continue;
    if (
      !alias.replacement.replace(/\\/g, '/').endsWith(
        `/src/${subpaths.rootFile}`,
      )
    ) continue;

    const sourceDir = dirname(alias.replacement);
    for (const [subpath, fileName] of Object.entries(subpaths.files)) {
      const find = `${alias.find}/${subpath}`;
      if (existing.has(find)) continue;
      out.push({ find, replacement: join(sourceDir, fileName) });
      existing.add(find);
    }
  }

  return out;
}

/**
 * Normalize a user-provided alias map into Vite Alias entries.
 *
 * Accepts either a record of find -> replacement strings or an existing Alias
 * array. Relative replacements are resolved against `root`. Entries are sorted
 * by specificity so longer/more specific aliases match first.
 */
export function normalizeViteAliases(
  aliases: Record<string, string> | Alias[] | null | undefined,
  root: string,
): Alias[] | undefined {
  if (!aliases) return undefined;
  let normalized: Alias[];
  if (Array.isArray(aliases)) {
    normalized = aliases.map((alias) =>
      typeof alias.replacement === 'string'
        ? { ...alias, replacement: normalizeAliasReplacement(root, alias.replacement) }
        : alias
    );
  } else {
    normalized = Object.entries(aliases).map(([find, replacement]) => ({
      find,
      replacement: normalizeAliasReplacement(root, replacement),
    }));
  }
  return sortAliasEntries(expandOpenElementSourceAliases(normalized));
}
