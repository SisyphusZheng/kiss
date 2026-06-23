export interface WalkOptions {
  include?(entry: { name: string; path: string }): boolean;
  exclude?(entry: { name: string; path: string }): boolean;
  maxDepth?: number;
}

export function* walkFiles(
  dir: string,
  options: WalkOptions = {},
  depth = 0,
): Generator<string> {
  if (options.maxDepth !== undefined && depth > options.maxDepth) return;
  for (const entry of Deno.readDirSync(dir)) {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory) {
      if (options.exclude?.({ name: entry.name, path })) continue;
      yield* walkFiles(path, options, depth + 1);
    } else if (entry.isFile) {
      if (options.exclude?.({ name: entry.name, path })) continue;
      if (options.include && !options.include({ name: entry.name, path })) continue;
      yield path;
    }
  }
}
