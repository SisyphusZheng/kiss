/**
 * Deterministic JSON file body for generated artifacts: two-space indent plus
 * a trailing newline, matching the repo's generated-file convention.
 */
export function formatJson(value: unknown): string {
  return JSON.stringify(value, null, 2) + '\n';
}
