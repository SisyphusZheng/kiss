/**
 * Shared filesystem helpers for openElement tooling.
 *
 * Use `@std/fs/walk` for recursive traversal (skip/match on full paths).
 */

/** Re-exported from @std/fs: true if the path exists (file or directory). */
export { exists } from '@std/fs';

/** Read a UTF-8 text file and parse it as JSON. */
export async function readJson<T = unknown>(path: string | URL): Promise<T> {
  return JSON.parse(await Deno.readTextFile(path)) as T;
}
