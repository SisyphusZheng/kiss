/**
 * @openelement/core - JSON serialization helper
 *
 * Shared helper for code generation and file writes that need
 * pretty-printed JSON with a trailing newline.
 */

/**
 * Serialize a value to pretty-printed JSON ending with a newline.
 */
export function writeJson(value: unknown): string {
  return JSON.stringify(value, null, 2) + '\n';
}
