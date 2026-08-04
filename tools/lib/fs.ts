/**
 * Shared filesystem helpers for openElement tooling.
 *
 * Use `@std/fs/walk` for recursive traversal (skip/match on full paths).
 */

/** Return true if the path exists (file or directory). */
export async function exists(path: string | URL): Promise<boolean> {
  try {
    await Deno.stat(path);
    return true;
  } catch {
    return false;
  }
}

/** Read a UTF-8 text file and parse it as JSON. */
export async function readJson<T = unknown>(path: string | URL): Promise<T> {
  return JSON.parse(await Deno.readTextFile(path)) as T;
}
