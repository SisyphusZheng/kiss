/**
 * @openelement/core — Island transform core logic.
 *
 * Pure function: injects island metadata markers into source code.
 * Zero Vite dependency. Usable with any build tool.
 */

import type { IslandTransformOptions, IslandTransformResult } from '@openelement/protocol/island';
import { assertValidTagName } from './tag-utils.ts';
import { ERROR_PREFIX } from './errors.ts';
import { normalizeSeparators } from './path-utils.ts';
export type { IslandTransformOptions, IslandTransformResult };

/**
 * Inject island metadata markers into source code.
 *
 * Only transforms files inside the islands directory.
 * Tag names must be lowercase + hyphens (Custom Elements spec).
 * Unsafe characters cause a thrown error.
 */
export function transformIslandSource(
  source: string,
  options: IslandTransformOptions,
): IslandTransformResult {
  const { islandsDir, filePath } = options;
  // Normalize to forward slashes and ensure leading slash for reliable matching
  let normalizedPath = normalizeSeparators(filePath);
  if (!normalizedPath.startsWith('/')) {
    normalizedPath = '/' + normalizedPath;
  }
  const normalizedIslandsDir = normalizeSeparators(islandsDir);

  // Only transform files in the islands directory
  if (!normalizedPath.includes(`/${normalizedIslandsDir}/`)) {
    return { code: source, islands: [] };
  }

  // Extract tag name from file path: replace path separators with hyphens
  // matching route-scanner.ts fileToTagName() behavior.
  // e.g. "nested/my-widget.tsx" → "my-widget", "my-widget.tsx" → "my-widget"
  const relativePath = normalizedPath.split(`/${islandsDir}/`)[1] ??
    normalizedPath.split('/').pop()!;
  const tagName = normalizeSeparators(relativePath)
    .replace(/\.[^.]+$/, '')
    .replace(/\//g, '-')
    .toLowerCase();

  // Files that do not yield any name are skipped silently.
  if (!tagName) {
    return { code: source, islands: [] };
  }

  // Reject file names containing characters outside the safe custom-element
  // alphabet. This is a hard error: the user has named an island file in a
  // way that cannot be turned into a valid tag name.
  if (!/^[a-z0-9-]+$/.test(tagName)) {
    throw new Error(
      `${ERROR_PREFIX} Island tag name "${tagName}" contains unsafe characters. ` +
        'Use lowercase ASCII letters, digits, and hyphens only.',
    );
  }

  // Files without a hyphen are silently skipped (not valid custom element names).
  if (!tagName.includes('-')) {
    return { code: source, islands: [] };
  }

  // Validate against the shared custom element rules (reserved names, xml prefix).
  assertValidTagName(tagName);

  // Inject metadata markers
  const injected = `
// --- Island Markers (auto-injected) ---
export const __island = true;
export const __tagName = '${tagName}';
// --- End Island Markers ---
`;

  return {
    code: source + '\n' + injected,
    islands: [{ tagName, filePath }],
  };
}
