/**
 * Generates packages/adapter-vite/src/generated-export-files.ts from the
 * "exports" maps declared in each package deno.json.
 *
 * OPENELEMENT_EXPORT_FILES used to be a
 * hand-maintained copy of those export maps, which drifted (e.g. content's
 * nav-data was renamed to write-json in its deno.json but never updated in
 * the resolver). This script makes deno.json the single source of truth.
 *
 * Usage:
 *   deno run --allow-read --allow-write --allow-run tools/generate-openelement-export-files.ts
 *     -> (re)write the generated file and format it.
 *   deno run --allow-read --allow-write --allow-run tools/generate-openelement-export-files.ts --check
 *     -> regenerate, format, and fail (exit 1) if the committed file is stale.
 */

interface PackageExports {
  [subpath: string]: string;
}

const REPO_ROOT = new URL('../', import.meta.url).pathname;
const TARGET = `${REPO_ROOT}packages/adapter-vite/src/generated-export-files.ts`;

// Packages that participate in the JSR SSG package resolver export map.
const RESOLVER_PACKAGES = [
  'adapter-vite',
  'app',
  'create',
  'element',
  'ui',
];

function stripLeadingSlash(value: string): string {
  return value.replace(/^\.\//, '');
}

async function readPackageExports(pkg: string): Promise<PackageExports> {
  const path = `${REPO_ROOT}packages/${pkg}/deno.json`;
  const raw = JSON.parse(await Deno.readTextFile(path));
  const exportsField = raw.exports;

  const result: PackageExports = {};
  if (typeof exportsField === 'string') {
    result['.'] = stripLeadingSlash(exportsField);
    return result;
  }
  if (exportsField && typeof exportsField === 'object') {
    for (const [key, value] of Object.entries(exportsField)) {
      result[stripLeadingSlash(key)] = stripLeadingSlash(String(value));
    }
  }
  return result;
}

async function buildExportFiles(): Promise<Record<string, PackageExports>> {
  const map: Record<string, PackageExports> = {};
  for (const pkg of RESOLVER_PACKAGES) {
    map[pkg] = await readPackageExports(pkg);
  }
  return map;
}

function render(map: Record<string, PackageExports>): string {
  const packages = Object.keys(map).sort();
  const lines: string[] = [];
  lines.push('// GENERATED FILE — do not edit by hand.');
  lines.push('// Regenerate with: deno task export-files:generate');
  lines.push('// Source of truth: the "exports" field of each packages/*/deno.json.');
  lines.push(
    'export const OPENELEMENT_EXPORT_FILES: Record<string, Record<string, string>> = {',
  );
  for (const pkg of packages) {
    lines.push(`  ${JSON.stringify(pkg)}: {`);
    const subpaths = Object.keys(map[pkg]).sort();
    for (const sub of subpaths) {
      lines.push(`    ${JSON.stringify(sub)}: ${JSON.stringify(map[pkg][sub])},`);
    }
    lines.push('  },');
  }
  lines.push('};');
  lines.push('');
  return lines.join('\n');
}

async function runFormatter(target: string): Promise<void> {
  const cmd = new Deno.Command('deno', { args: ['fmt', target] });
  const status = await cmd.output();
  if (!status.success) {
    throw new Error(`deno fmt failed on ${target}`);
  }
}

async function main(args: string[]): Promise<void> {
  const checkOnly = args.includes('--check');
  const map = await buildExportFiles();
  const source = render(map);

  if (checkOnly) {
    const temporary = await Deno.makeTempFile({
      dir: `${REPO_ROOT}packages/adapter-vite/src`,
      prefix: '.generated-export-files-',
      suffix: '.ts',
    });
    try {
      await Deno.writeTextFile(temporary, source);
      await runFormatter(temporary);
      const [actual, expected] = await Promise.all([
        Deno.readTextFile(TARGET),
        Deno.readTextFile(temporary),
      ]);
      if (actual !== expected) {
        console.error('export-files sync check failed: generated file is stale.');
        Deno.exit(1);
      }
    } finally {
      await Deno.remove(temporary).catch(() => undefined);
    }
    console.log('export-files sync check passed (generated file matches deno.json exports).');
    return;
  }

  await Deno.writeTextFile(TARGET, source);
  await runFormatter(TARGET);
  console.log(`Wrote ${TARGET}`);
}

if (import.meta.main) {
  await main(Deno.args);
}
