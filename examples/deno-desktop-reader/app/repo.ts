export interface CachedFile {
  path: string;
  sha: string;
  downloadedAt: string;
}

const GITHUB_API = "https://api.github.com/repos";
const GITHUB_RAW = "https://raw.githubusercontent.com";

function defaultCacheDir(): string {
  return (Deno.env.get("HOME") ?? Deno.env.get("USERPROFILE") ?? "/tmp") +
    "/.open-reader";
}

/**
 * List files in a GitHub repo directory (public repo, no auth needed).
 */
export async function listRepoFiles(
  repo: string,
  path?: string,
): Promise<CachedFile[]> {
  const url = path
    ? `${GITHUB_API}/${repo}/contents/${path}`
    : `${GITHUB_API}/${repo}/contents`;
  const res = await fetch(url);
  if (!res.ok) {
    console.warn(
      `[repo] listRepoFiles failed: ${res.status} ${res.statusText}`,
    );
    return [];
  }
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  return data
    .filter((item: { type: string }) => item.type === "file")
    .map((item: { name: string; sha: string }) => ({
      path: item.name,
      sha: item.sha,
      downloadedAt: new Date().toISOString(),
    }));
}

/**
 * Download a single file from GitHub raw URL to local cache.
 */
export async function downloadFile(
  url: string,
  destPath: string,
): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`[repo] downloadFile failed: ${res.status} ${res.statusText}`);
    return;
  }
  const buf = new Uint8Array(await res.arrayBuffer());
  // Ensure parent directory exists
  const parent = destPath.substring(0, destPath.lastIndexOf("/"));
  await Deno.mkdir(parent, { recursive: true });
  await Deno.writeFile(destPath, buf);
}

/**
 * Load the sha-based cache from ~/.open-reader/cache.json.
 */
export function loadCache(
  cacheDir: string,
): Record<string, CachedFile> {
  const cacheFile = `${cacheDir}/cache.json`;
  try {
    const raw = Deno.readTextFileSync(cacheFile);
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/**
 * Save the cache to ~/.open-reader/cache.json.
 */
export function saveCache(
  cacheDir: string,
  cache: Record<string, CachedFile>,
): void {
  const cacheFile = `${cacheDir}/cache.json`;
  Deno.mkdirSync(cacheDir, { recursive: true });
  Deno.writeTextFileSync(cacheFile, JSON.stringify(cache, null, 2));
}

/**
 * Sync books: compare remote sha vs local cache, download new/changed files.
 */
export async function syncBooks(
  repo: string,
  cacheDir?: string,
): Promise<string[]> {
  const dir = cacheDir ?? defaultCacheDir();
  const booksDir = `${dir}/books`;
  Deno.mkdirSync(booksDir, { recursive: true });

  const cache = loadCache(dir);
  const remoteFiles = await listRepoFiles(repo);
  const downloaded: string[] = [];

  for (const rf of remoteFiles) {
    const existing = cache[rf.path];
    if (existing && existing.sha === rf.sha) continue; // already current

    const rawUrl = `${GITHUB_RAW}/${repo}/master/${rf.path}`;
    const destPath = `${booksDir}/${rf.path}`;
    try {
      await downloadFile(rawUrl, destPath);
      cache[rf.path] = {
        path: rf.path,
        sha: rf.sha,
        downloadedAt: new Date().toISOString(),
      };
      downloaded.push(rf.path);
    } catch (err) {
      console.warn(`[repo] skip ${rf.path}:`, err);
    }
  }

  saveCache(dir, cache);
  return downloaded;
}
