/**
 * @openelement/core - JSON formatting helper
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

/**
 * @deprecated Use {@link formatJson} instead. This name incorrectly implies a
 * filesystem side effect; the function only returns a formatted string.
 */
export const writeJson = formatJson;
