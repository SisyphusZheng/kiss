import { readFile } from 'node:fs/promises';
import type { Alias, Plugin } from 'vite';
import { formatError } from '@openelement/element';
import { OPENELEMENT_EXPORT_FILES } from './generated-export-files.ts';

export { OPENELEMENT_EXPORT_FILES } from './generated-export-files.ts';

const VIRTUAL_OPENELEMENT_PACKAGE_PREFIX = '\0openelement:ssg-pkg/';
// Packages resolved by this plugin for JSR consumer SSG builds.
// Retained optional packages (content, i18n) are handled by optionalPackageStubsPlugin
// in build-ssg.ts instead. The resolver must NOT intercept them, because it runs
// enforce: 'pre' and would prevent the stubs plugin from providing empty stubs
// when packages are absent.
const DEFAULT_OPENELEMENT_PACKAGES = new Set([
  'adapter-vite',
  'app',
  'core',
  'create',
  'element',
  'router',
  'signal',
  'ssg',
  'protocol',
  'ui',
]);

export interface OpenJsrPackageSpecifier {
  packageName: string;
  subpath: string;
  range?: string;
}

export interface OpenJsrPackageResolverOptions {
  workspaceRoot: string | null;
  version: string;
  localPackageRoot?: string | null;
  userAliases?: Record<string, string> | Alias[] | null;
  fetchSource?: (url: string) => Promise<Response>;
  readLocalSource?: (path: string) => string;
  /** Registry mode. 'npm' lets Vite resolve @openelement/* from node_modules.
   * 'jsr' keeps the legacy virtual-module source fetch for JSR consumers. */
  registry?: 'npm' | 'jsr';
}

export function parseOpenPackageSpecifier(id: string): OpenJsrPackageSpecifier | null {
  const bare = id.match(/^@openelement\/([^/@]+)(?:\/(.+))?$/);
  if (bare) return { packageName: bare[1], subpath: bare[2] ?? '.' };

  const jsr = id.match(/^jsr:@openelement\/([^/@]+)(?:@([^/]+))?(?:\/(.+))?$/);
  if (jsr) {
    return {
      packageName: jsr[1],
      range: jsr[2],
      subpath: jsr[3] ?? '.',
    };
  }

  return null;
}

export function resolveOpenPackageExport(packageName: string, subpath: string): string {
  const exports = OPENELEMENT_EXPORT_FILES[packageName];
  if (!exports) {
    throw new Error(`[openElement/SSG] Unknown openElement package: @openelement/${packageName}`);
  }

  const normalized = normalizeSubpath(subpath);
  const file = exports[normalized] ??
    (normalized.endsWith('.js') ? exports[normalized.replace(/\.js$/, '')] : undefined);
  if (file) return file;

  throw new Error(
    `[openElement/SSG] Unknown @openelement/${packageName} export subpath: ${subpath}`,
  );
}

/** Build a validated JSR source URL for a published openElement module. */
export function buildJsrSourceUrl(packageName: string, version: string, filePath: string): string {
  if (!OPENELEMENT_EXPORT_FILES[packageName]) {
    throw new Error(`[openElement/SSG] Unknown openElement package: @openelement/${packageName}`);
  }
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/u.test(version)) {
    throw new Error(`[openElement/SSG] Unsafe JSR package version: ${version}`);
  }
  if (filePath.startsWith('/') || filePath.includes('..')) {
    throw new Error(`[openElement/SSG] Unsafe package source path: ${filePath}`);
  }
  return new URL(`/@openelement/${packageName}/${version}/${filePath}`, 'https://jsr.io').href;
}

export function toVirtualOpenPackageId(packageName: string, sourcePath: string): string {
  return `${VIRTUAL_OPENELEMENT_PACKAGE_PREFIX}${packageName}/${sourcePath}`;
}

export function resolveVirtualOpenPackageRelative(id: string, importer: string): string | null {
  if (!importer.startsWith(VIRTUAL_OPENELEMENT_PACKAGE_PREFIX)) return null;
  if (!id.startsWith('./') && !id.startsWith('../')) return null;

  const importerPath = importer.slice(VIRTUAL_OPENELEMENT_PACKAGE_PREFIX.length);
  const [packageName, ...pathParts] = importerPath.split('/');
  const base = pathParts.slice(0, -1);
  const parts = [...base, ...id.split('/')];
  const resolved: string[] = [];

  for (const part of parts) {
    if (!part || part === '.') continue;
    if (part === '..') resolved.pop();
    else resolved.push(part);
  }

  return toVirtualOpenPackageId(
    packageName,
    resolveSourcePathExtension(packageName, resolved.join('/')),
  );
}

export function createOpenJsrPackageResolverPlugin(
  options: OpenJsrPackageResolverOptions,
): Plugin {
  const fetchSource = options.fetchSource ?? fetch;
  const registry = options.registry ??
    (typeof import.meta.url === 'string' && import.meta.url.startsWith('https://') ? 'jsr' : 'npm');
  const isNpmMode = registry === 'npm';

  return {
    name: 'open:ssg-package-resolve',
    enforce: 'pre',
    transform(code) {
      if (!code.includes('npm:')) return null;
      const rewritten = rewriteNpmSpecifiers(code);
      if (rewritten === code) return null;
      return { code: rewritten, map: null };
    },
    resolveId(id, importer) {
      if (options.workspaceRoot) return null;
      if (isNpmMode) return null;
      if (hasExactUserAlias(id, options.userAliases)) return null;

      const spec = parseOpenPackageSpecifier(id);
      if (spec) {
        if (!DEFAULT_OPENELEMENT_PACKAGES.has(spec.packageName)) return null;
        return toVirtualOpenPackageId(
          spec.packageName,
          resolveOpenPackageExport(spec.packageName, spec.subpath),
        );
      }

      return resolveVirtualOpenPackageRelative(id, importer ?? '');
    },
    async load(id) {
      if (options.workspaceRoot) return null;
      if (isNpmMode) return null;
      if (!id.startsWith(VIRTUAL_OPENELEMENT_PACKAGE_PREFIX)) return null;

      const [packageName, ...pathParts] = id.slice(VIRTUAL_OPENELEMENT_PACKAGE_PREFIX.length).split(
        '/',
      );
      const filePath = pathParts.join('/');
      if (options.localPackageRoot) {
        const localPath = `${options.localPackageRoot}/packages/${packageName}/${filePath}`;
        try {
          return options.readLocalSource
            ? options.readLocalSource(localPath)
            : typeof Deno !== 'undefined'
            ? await Deno.readTextFile(localPath)
            : await readFile(localPath, 'utf-8');
        } catch (error) {
          throw new Error(
            `[openElement/SSG] Failed to read local @openelement/${packageName}/${filePath} ` +
              `from ${localPath}: ${formatError(error)}`,
          );
        }
      }

      const url = `https://jsr.io/@openelement/${packageName}/${options.version}/${filePath}`;
      const resp = await fetchSource(url);
      if (!resp.ok) {
        throw new Error(
          `[openElement/SSG] Failed to fetch @openelement/${packageName}/${filePath} ` +
            `from ${url}: HTTP ${resp.status}`,
        );
      }
      const source = await resp.text();
      // JSR rewrites bare npm specifiers (e.g. 'marked') to 'npm:marked@x.y.z'.
      // Vite/Rolldown does not understand Deno's 'npm:' scheme, so we must
      // convert them back to bare specifiers that the bundler can resolve.
      return rewriteNpmSpecifiers(source);
    },
  };
}

export function hasExactUserAlias(
  id: string,
  aliases: Record<string, string> | Alias[] | null | undefined,
): boolean {
  if (!aliases) return false;
  if (Array.isArray(aliases)) {
    return aliases.some((alias) => typeof alias.find === 'string' && alias.find === id);
  }
  return Object.prototype.hasOwnProperty.call(aliases, id);
}

function normalizeSubpath(subpath: string): string {
  if (subpath === '' || subpath === '.') return '.';
  return subpath.replace(/^\.\//, '');
}

function resolveSourcePathExtension(packageName: string, path: string): string {
  const normalized = path.replace(/\.js$/, '');
  const exports = OPENELEMENT_EXPORT_FILES[packageName];
  if (exports) {
    const matched = Object.values(exports).find((file) =>
      file.replace(/\.(tsx|ts)$/, '') === normalized
    );
    if (matched) return matched;
  }
  return ensureTsExtension(path);
}

function ensureTsExtension(path: string): string {
  const withoutJs = path.replace(/\.js$/, '');
  if (withoutJs.endsWith('.tsx') || withoutJs.endsWith('.ts')) return withoutJs;
  return `${withoutJs}.ts`;
}

/**
 * Rewrite Deno/JSR `npm:` import/export specifiers to bare specifiers that
 * Vite/Rolldown can resolve. JSR rewrites bare npm imports like
 * `import from 'marked'` to `import from 'npm:marked@12.0.0'`. Published openElement
 * source can also use explicit `npm:` specifiers so fresh Deno consumers do not
 * need root import-map aliases. Vite doesn't understand `npm:` so we strip the
 * prefix and version, leaving a bare specifier like `marked` or
 * `@preact/signals-core`.
 *
 * Handles:
 */
const NPM_SPECIFIER_RE =
  /(\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)(['"])npm:(@?[a-z0-9_-]+(?:\/[a-z0-9_-]+)?)@[^'"/]+(\/[^'"]*)?\2/g;

function rewriteNpmSpecifiers(source: string): string {
  return source.replace(
    NPM_SPECIFIER_RE,
    (_match, prefix: string, quote: string, pkg: string, subpath?: string) => {
      return `${prefix}${quote}${pkg}${subpath ?? ''}${quote}`;
    },
  );
}
