/**
 * ./path-utils.ts — Path normalization utilities.
 *
 * These helpers are framework-agnostic string operations used by the app model
 * and SSG drivers. They intentionally avoid `node:path` so they stay safe in
 * browser, edge, and Deno-desktop runtimes.
 *
 * @module ./path-utils.ts
 */

/**
 * Normalize path separators and collapse duplicates.
 *
 * - Backslashes and forward slashes are replaced with the chosen separator.
 * - Repeated separators are collapsed to a single separator.
 */
export function normalizeSeparators(path: string, sep: '/' | '-' = '/'): string {
  if (!path) return '';
  const normalized = path.replace(/[\\/]/g, sep);
  const duplicateRe = sep === '-' ? /-{2,}/g : /\/{2,}/g;
  return normalized.replace(duplicateRe, sep);
}

/**
 * Convert a file path into a kebab-cased custom element tag name.
 *
 * - Removes a leading `./` or `/`.
 * - Strips known file extensions (`ts`, `tsx`, `js`, `jsx`, `mjs`, `mdx`).
 * - Replaces directory separators with hyphens.
 * - Ensures the result starts with a letter and contains at least one hyphen.
 */
export function pathToTagName(filePath: string): string {
  if (!filePath) return '';
  const withoutPrefix = filePath.replace(/^(\.\/|\/)/, '');
  const withoutExt = withoutPrefix.replace(/\.(tsx?|jsx?|mjs|mdx)$/i, '');
  const tagName = normalizeSeparators(withoutExt, '-')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');

  if (!tagName) return '';

  // Ensure it starts with a letter.
  const startsWithLetter = /^[a-z]/.test(tagName);
  const withPrefix = startsWithLetter ? tagName : `el-${tagName}`;

  // Ensure at least one hyphen so it is a valid custom element candidate.
  return withPrefix.includes('-') ? withPrefix : `${withPrefix}-page`;
}
