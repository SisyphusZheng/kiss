/**
 * @openelement/core — Island transform core logic.
 *
 * Pure function: injects island metadata markers into source code.
 * Zero Vite dependency. Usable with any build tool.
 */

import type { IslandTransformOptions, IslandTransformResult } from '@openelement/protocol/island';
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
  let normalizedPath = filePath.replace(/\\/g, '/');
  if (!normalizedPath.startsWith('/')) {
    normalizedPath = '/' + normalizedPath;
  }
  const normalizedIslandsDir = islandsDir.replace(/\\/g, '/');

  // Only transform files in the islands directory
  if (!normalizedPath.includes(`/${normalizedIslandsDir}/`)) {
    return { code: source, islands: [] };
  }

  // Extract tag name from file path: replace path separators with hyphens
  // matching route-scanner.ts fileToTagName() behavior.
  // e.g. "nested/my-widget.tsx" → "my-widget", "my-widget.tsx" → "my-widget"
  const relativePath = normalizedPath.split(`/${islandsDir}/`)[1] ??
    normalizedPath.split('/').pop()!;
  const tagName = relativePath
    .replace(/\.(tsx?|jsx?)$/, '')
    .replace(/[/\\]/g, '-')
    .toLowerCase();

  // Validate tag name (must contain a hyphen for Custom Elements)
  if (!tagName.includes('-')) {
    return { code: source, islands: [] };
  }

  // Security: only allow lowercase letters, digits, and hyphens
  if (!/^[a-z0-9-]+$/.test(tagName)) {
    throw new Error(
      `Island tag name "${tagName}" contains unsafe characters. ` +
        `Only lowercase letters, digits, and hyphens are allowed.`,
    );
  }

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
