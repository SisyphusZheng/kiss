/**
 * adapter-vite internal SSG - Deno External Dependency Pre-Resolution (ADR-0047).
 *
 * Eliminates ESM subpath leaks into Rolldown by having Deno resolve all
 * external package transitive dependencies before the bundler sees them.
 * Produces a complete specifier list so ssr.external needs no regex.
 *
 * ADR-0054: AST-based specifier resolution replaces manual regex patterns.
 * For each external package, we parse its package.json exports field to
 * auto-discover ALL subpath exports. No more regex maintenance.
 */
import type { ExternalManifest } from '@openelement/protocol/ssg';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { writeJson } from '@openelement/content/write-json';
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';

interface DenoInfoModule {
  specifier: string;
  error?: string;
}

interface DenoInfoOutput {
  modules: DenoInfoModule[];
  roots: string[];
  redirects?: Record<string, string>;
}

/** Package.json minimal shape for exports parsing. */
interface PkgJson {
  exports?: unknown;
  main?: string;
}

/** Conditional keys to skip when walking exports (not subpaths). */
const CONDITION_KEYS = new Set([
  'import',
  'require',
  'node',
  'default',
  'types',
  'browser',
  'deno',
  'worker',
  'development',
  'production',
  'module',
]);

/**
 * ADR-0054: Recursively walk a package.json exports field to extract all
 * export subpaths as bare specifier strings.
 *
 * Handles:
 *   "."          → "package-name"
 *   "./sub"      → "package-name/sub"
 *   "./sub/*"    → "package-name/sub/*" (wildcard, matches all sub-subpaths)
 *   "./*"        → "package-name/*"
 *   Conditional  → recurses into sub-conditions (import/require/default)
 *
 * Skips condition keys: import, require, node, default, types, browser,
 * deno, worker, development, production, module.
 */
export function walkExports(
  exports: unknown,
  packageName: string,
  prefix = '',
): string[] {
  const results: string[] = [];

  if (typeof exports === 'string') {
    // Leaf: e.g. ".": "./index.js" → package-name
    // Strip "./" prefix to get subpath: "./sub" → "sub", "./*" → "*", "." → ""
    const subpath = prefix.replace(/^\.\/?/, '');
    results.push(subpath ? `${packageName}/${subpath}` : packageName);
    return results;
  }

  if (exports === null || exports === undefined) {
    return results;
  }

  if (Array.isArray(exports)) {
    // Array fallback — take first valid
    for (const item of exports) {
      const sub = walkExports(item, packageName, prefix);
      if (sub.length > 0) {
        results.push(...sub);
        break;
      }
    }
    return results;
  }

  if (typeof exports === 'object') {
    const obj = exports as Record<string, unknown>;

    const hasSubpathKeys = Object.keys(obj).some((k) => !CONDITION_KEYS.has(k));
    const hasConditionKeys = Object.keys(obj).some((k) => CONDITION_KEYS.has(k));

    if (hasConditionKeys && !hasSubpathKeys) {
      // Pure condition block: recurse into each condition
      const seen = new Set<string>();
      for (const key of Object.keys(obj)) {
        if (CONDITION_KEYS.has(key)) {
          const sub = walkExports(obj[key], packageName, prefix);
          for (const s of sub) {
            if (!seen.has(s)) {
              seen.add(s);
              results.push(s);
            }
          }
        }
      }
    } else if (hasSubpathKeys) {
      // Subpath mapping: each key is a subpath
      for (const key of Object.keys(obj)) {
        if (CONDITION_KEYS.has(key)) continue;
        const newPrefix = key; // e.g. ".", "./secure-headers", "./*"
        const sub = walkExports(obj[key], packageName, newPrefix);
        results.push(...sub);
      }
    }
  }

  return results;
}

/**
 * ADR-0054: Resolve a package's exports to a complete list of bare specifiers
 * by reading its package.json from node_modules.
 */
export function resolvePackageExports(packageName: string, projectRoot: string): string[] {
  // Try standard node_modules resolution first
  const candidates = [
    join(projectRoot, 'node_modules', packageName, 'package.json'),
    join(
      projectRoot,
      'node_modules',
      '.deno',
      `${packageName}.node_modules`,
      packageName,
      'package.json',
    ),
  ];

  for (const pkgPath of candidates) {
    if (existsSync(pkgPath)) {
      try {
        const pkg: PkgJson = JSON.parse(readFileSync(pkgPath, 'utf-8'));
        if (pkg.exports) {
          return walkExports(pkg.exports, packageName);
        }
        // No exports field — use main or default to package name
        break;
      } catch {
        // corrupt package.json — skip
      }
    }
  }

  // Fallback: return just the main package name
  return [packageName];
}

/**
 * ADR-0054: Complete external specifier list by resolving each package's
 * exports via AST (package.json exports walk).
 */
export function completeExternalSpecifiers(
  baseSpecifiers: string[],
  externalPackages: string[],
  projectRoot: string,
): string[] {
  const seen = new Set(baseSpecifiers);
  const result = [...baseSpecifiers];

  for (const pkg of externalPackages) {
    try {
      const subpaths = resolvePackageExports(pkg, projectRoot);
      for (const sp of subpaths) {
        if (!seen.has(sp)) {
          seen.add(sp);
          result.push(sp);
        }
      }
    } catch {
      // Package not found or has no exports — keep base specifiers
    }
  }

  return result.sort();
}

/**
 * Compute a stable hash of deno.lock for cache invalidation.
 * Returns 'no-lock' if deno.lock doesn't exist.
 */
function computeLockHash(projectRoot: string): string {
  const lockPath = join(projectRoot, 'deno.lock');
  if (!existsSync(lockPath)) return 'no-lock';
  const content = readFileSync(lockPath, 'utf-8');
  return createHash('sha256').update(content).digest('hex').substring(0, 16);
}

/**
 * Read a cached manifest from .openElement/external-manifest.json.
 * Returns null if the cache is stale (lock hash mismatch) or missing.
 */
function readCachedManifest(projectRoot: string, lockHash: string): ExternalManifest | null {
  const cachePath = join(projectRoot, '.openElement', 'external-manifest.json');
  if (!existsSync(cachePath)) return null;
  try {
    const cached = JSON.parse(readFileSync(cachePath, 'utf-8')) as ExternalManifest;
    if (cached.lockHash === lockHash && cached.specifiers?.length > 0) {
      return cached; // Cache hit — lock unchanged, deps stable
    }
  } catch {
    /* stale/corrupt cache — treat as miss */
  }
  return null;
}

/**
 * Write the manifest cache to .openElement/external-manifest.json.
 */
function writeCachedManifest(projectRoot: string, manifest: ExternalManifest): void {
  const dir = join(projectRoot, '.openElement');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'external-manifest.json'), writeJson(manifest), 'utf-8');
}

/**
 * ADR-0047: Parse `deno info --json` output to extract all specifiers belonging
 * to external packages. This eliminates the need for regex-based external matching
 * that leaks ESM subpaths into Rolldown.
 */
export function extractExternalSpecifiers(
  denoInfo: DenoInfoOutput,
  externalPackages: string[],
): string[] {
  const specifiers = new Set<string>();

  for (const mod of denoInfo.modules) {
    if (mod.error) continue;
    const spec = mod.specifier;
    // Only process npm: specifiers — these are the ones Rolldown chokes on.
    if (!spec.startsWith('npm:')) continue;

    for (const pkg of externalPackages) {
      // Match: npm:pkg@..., npm:pkg@.../sub/path, npm:pkg/sub/path
      if (
        spec === `npm:${pkg}` ||
        spec.startsWith(`npm:${pkg}@`) ||
        spec.startsWith(`npm:${pkg}/`)
      ) {
        // Strip npm: prefix to get the bare specifier Rolldown expects.
        const bare = spec.replace(/^npm:/, '');
        // Strip version tag to get clean bare specifier:
        //   entities@^4/lib/escape.js → entities/lib/escape.js
        const clean = bare.replace(/@[^/]+/, '');
        specifiers.add(clean);
      }
    }
  }

  return [...specifiers].sort();
}

/**
 * Build a fallback manifest.
 * Used when Deno is unavailable or skipResolution is true.
 *
 * ADR-0054: Uses AST-based exports resolution instead of regex patterns.
 */
export function buildFallbackManifest(
  externalPackages: string[],
  projectRoot: string,
): ExternalManifest {
  const specifiers = completeExternalSpecifiers([], externalPackages, projectRoot);

  return {
    specifiers,
    importMap: {}, // Fallback skips importmap generation
    generatedAt: new Date().toISOString(),
    lockHash: 'fallback',
  };
}

/**
 * Build importmap entries from Deno redirects.
 * Only includes redirects that point to npm: URLs.
 */
function buildImportMapFromRedirects(
  output: DenoInfoOutput,
  _externalPackages: string[],
): Record<string, string> {
  const importMap: Record<string, string> = {};

  if (output.redirects) {
    for (const [key, value] of Object.entries(output.redirects)) {
      // Only include redirects that start with npm:
      if (value.startsWith('npm:')) {
        importMap[key] = value;
      }
    }
  }

  return importMap;
}

/**
 * Resolve the complete external dependency manifest using Deno module graph.
 *
 * Flow:
 * 1. Check cache (.openElement/external-manifest.json by deno.lock hash)
 * 2. If cache miss: write temp probe module, run `deno info --json`, parse
 * 3. Supplement with AST-based exports resolution (ADR-0054)
 * 4. Fallback to AST-only if Deno is unavailable
 */
export async function resolveExternalManifest(
  externalPackages: string[],
  projectRoot: string,
  skipResolution = false,
): Promise<ExternalManifest> {
  const lockHash = computeLockHash(projectRoot);

  // Cache hit?
  if (!skipResolution) {
    const cached = readCachedManifest(projectRoot, lockHash);
    if (cached) return cached;
  }

  if (skipResolution) {
    return buildFallbackManifest(externalPackages, projectRoot);
  }

  // Try Deno pre-resolution
  try {
    const probeCode = externalPackages
      .map((pkg) => `import '${pkg}';`)
      .join('\n');
    const probePath = join(projectRoot, '.openElement', '.external-probe.ts');

    mkdirSync(join(projectRoot, '.openElement'), { recursive: true });
    writeFileSync(probePath, probeCode, 'utf-8');

    const { execSync } = await import('node:child_process');
    const deno = execSync(
      `deno info --json "${probePath}"`,
      { cwd: projectRoot, maxBuffer: 10 * 1024 * 1024, timeout: 15000 },
    );

    unlinkSync(probePath);
    const output: DenoInfoOutput = JSON.parse(deno.toString());

    const baseSpecifiers = extractExternalSpecifiers(output, externalPackages);
    // ADR-0054: Supplement with AST-based exports resolution
    const specifiers = completeExternalSpecifiers(
      baseSpecifiers,
      externalPackages,
      projectRoot,
    );
    const importMap = buildImportMapFromRedirects(output, externalPackages);

    const manifest: ExternalManifest = {
      specifiers,
      importMap,
      generatedAt: new Date().toISOString(),
      lockHash,
    };

    writeCachedManifest(projectRoot, manifest);
    return manifest;
  } catch (_err) {
    // Deno not available or failed — fallback to AST-based resolution
    const fallback = buildFallbackManifest(externalPackages, projectRoot);
    return fallback;
  }
}
