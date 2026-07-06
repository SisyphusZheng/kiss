/**
 * Minimal path normalization helpers used by openElement tooling.
 *
 * Prefer these over `node:path` for scripts that only need to normalise
 * separators across platforms.
 */

/** Replace Windows backslashes with forward slashes. */
export function normalizeSlashes(path: string): string {
  return path.replace(/\\/g, '/');
}
