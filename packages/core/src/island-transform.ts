/**
 * @openelement/core — Island transform core logic.
 *
 * Pure function: injects island metadata markers into source code.
 * Zero Vite dependency. Usable with any build tool.
 */

import type { IslandTransformOptions, IslandTransformResult } from '@openelement/protocol/island';
import { assertValidTagName } from './tag-utils.ts';
import { normalizeSeparators, pathToTagName } from './path-utils.ts';
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

  // Extract tag name from file path using the same helper as the SSG route
  // scanner. This keeps route and island tag-name derivation consistent and
  // safely handles edge cases such as top-level numeric file names.
  const relativePath = normalizedPath.split(`/${islandsDir}/`)[1] ??
    normalizedPath.split('/').pop()!;
  const tagName = pathToTagName(relativePath);

  // Files that do not yield a valid name are skipped silently.
  if (!tagName) {
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
