/**
 * write-json.ts - JSON formatting helper
 *
 * Shared helper for code generation and file writes that need
 * pretty-printed JSON with a trailing newline.
 */

/**
 * Serialize a value to pretty-printed JSON ending with a newline.
 */
export function formatJson(value: unknown): string {
  return JSON.stringify(value, null, 2) + '\n';
}
