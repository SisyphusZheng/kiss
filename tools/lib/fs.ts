/**
 * Shared filesystem helpers for openElement tooling.
 */

export interface WalkOptions {
  /** Directory names or patterns to skip. */
  skip?: Array<string | RegExp>;
  /** Optional extension filter regex (tested against the full path). */
  extensions?: RegExp;
  /** Follow only files (default) or include directories. */
  includeDirs?: boolean;
}

function shouldSkip(name: string, skip: Array<string | RegExp>): boolean {
  for (const s of skip) {
    if (typeof s === 'string' && name === s) return true;
    if (s instanceof RegExp && s.test(name)) return true;
  }
  return false;
}

/** Recursively walk a directory, yielding file paths. */
export async function* walk(
  dir: string,
  options: WalkOptions = {},
): AsyncGenerator<string> {
  const { skip = [], extensions, includeDirs = false } = options;

  for await (const entry of Deno.readDir(dir)) {
    if (shouldSkip(entry.name, skip)) continue;

    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory) {
      if (includeDirs) yield path;
      yield* walk(path, options);
    } else if (entry.isFile) {
      if (!extensions || extensions.test(path)) yield path;
    }
  }
}

/** Return true if the path exists (file or directory). */
export async function exists(path: string): Promise<boolean> {
  try {
    await Deno.stat(path);
    return true;
  } catch {
    return false;
  }
}
