/**
 * @openelement/adapter-vite - Alias normalization helpers.
 *
 * Utilities for converting user-provided alias mappings into Vite's Alias[]
 * shape with absolute, root-relative replacements.
 */

import { resolve } from 'node:path';
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
  if (Array.isArray(aliases)) {
    return sortAliasEntries(
      aliases.map((alias) =>
        typeof alias.replacement === 'string'
          ? { ...alias, replacement: normalizeAliasReplacement(root, alias.replacement) }
          : alias
      ),
    );
  }
  return sortAliasEntries(
    Object.entries(aliases).map(([find, replacement]) => ({
      find,
      replacement: normalizeAliasReplacement(root, replacement),
    })),
  );
}
